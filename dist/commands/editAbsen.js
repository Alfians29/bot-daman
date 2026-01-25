"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleEditAbsen = handleEditAbsen;
const attendance_1 = require("../services/attendance");
const prisma_1 = require("../lib/prisma");
const date_1 = require("../utils/date");
const client_1 = require("@prisma/client");
const sheets_1 = require("../services/sheets");
// Admin username
const ADMIN_USERNAME = 'alfiyyann';
/**
 * Handle /editabsen command (admin only)
 * Format: /editabsen @username [jadwal]
 * Example: /editabsen @alfiyyann pagi
 */
async function handleEditAbsen(ctx) {
    const username = ctx.from?.username?.toLowerCase();
    // Only allow admin
    if (username !== ADMIN_USERNAME) {
        await ctx.reply('Aku gamau respon kamu. 😒', { parse_mode: 'HTML' });
        return;
    }
    const messageText = ctx.message?.text || '';
    const parts = messageText.split(/\s+/);
    // Parse: /editabsen @username jadwal
    if (parts.length < 3) {
        await ctx.reply(`⚠️ <b>Format salah!</b>\n\n` +
            `Format: <code>/editabsen @username jadwal</code>\n\n` +
            `Contoh:\n` +
            `• /editabsen @alfiyyann pagi\n` +
            `• /editabsen @alfiyyann malam`, { parse_mode: 'HTML' });
        return;
    }
    const targetUsername = parts[1]; // @username
    const newJadwal = parts[2].toLowerCase(); // pagi, malam, etc
    // Validate username format
    if (!targetUsername.startsWith('@')) {
        await ctx.reply('⚠️ <b>Username harus diawali dengan @</b>', {
            parse_mode: 'HTML',
        });
        return;
    }
    // Find target user
    const targetUser = await (0, attendance_1.findUserByTelegram)(targetUsername);
    if (!targetUser) {
        await ctx.reply(`⚠️ <b>User ${targetUsername} tidak ditemukan di database.</b>`, { parse_mode: 'HTML' });
        return;
    }
    // Check if user has attendance today
    const todayAttendance = await (0, attendance_1.getTodayAttendance)(targetUser);
    if (!todayAttendance) {
        await ctx.reply(`⚠️ <b>${targetUser.nama} belum absen hari ini.</b>\n\nTidak ada data yang bisa diedit.`, { parse_mode: 'HTML' });
        return;
    }
    // Get new command data
    const newCommand = `/${newJadwal}`;
    // Get schedule based on unit
    let startTime;
    let endTime;
    let lateAfter;
    let keterangan;
    if (targetUser.unit === 'SDI') {
        // SDI fixed schedules
        if (newJadwal === 'pagi') {
            startTime = '07:30';
            endTime = '17:00';
            lateAfter = '07:36';
            keterangan = 'Pagi';
        }
        else if (newJadwal === 'piket') {
            startTime = '08:00';
            endTime = '17:00';
            lateAfter = '08:06';
            keterangan = 'Piket';
        }
        else {
            await ctx.reply(`⚠️ <b>Jadwal tidak valid untuk SDI!</b>\n\nPilihan: pagi, piket`, { parse_mode: 'HTML' });
            return;
        }
    }
    else {
        // DAMAN - get from database ShiftSetting
        const cmdData = await (0, attendance_1.getCommandByUnitAndCommand)(targetUser.unit, newCommand);
        if (!cmdData) {
            await ctx.reply(`⚠️ <b>Jadwal "${newJadwal}" tidak ditemukan untuk ${targetUser.unit}!</b>`, { parse_mode: 'HTML' });
            return;
        }
        startTime = cmdData.startTime || '07:30';
        endTime = cmdData.endTime || '16:30';
        lateAfter = cmdData.lateAfter || startTime;
        keterangan = cmdData.shiftName;
    }
    const jadwal = `${startTime}-${endTime} WIB`;
    // Recalculate status based on jam absen and new lateAfter time
    const jamAbsen = todayAttendance.jamAbsen; // e.g., "8:02"
    const isLate = (0, date_1.isLateByTimeString)(jamAbsen, lateAfter);
    const newStatus = isLate ? 'Telat' : 'Ontime';
    try {
        // Update in database (for Daman users)
        if (targetUser.source === 'USER') {
            const today = (0, date_1.getTodayStart)();
            const shiftType = (0, attendance_1.commandToShiftType)(newCommand);
            await prisma_1.prisma.attendance.updateMany({
                where: {
                    memberId: targetUser.id,
                    tanggal: today,
                },
                data: {
                    keterangan: shiftType,
                    status: isLate ? client_1.AttendanceStatus.TELAT : client_1.AttendanceStatus.ONTIME,
                },
            });
        }
        // Update in Google Sheets (jadwal, keterangan, and status)
        const todayStr = (0, date_1.formatTanggal)((0, date_1.getTodayStart)());
        await (0, sheets_1.updateAttendanceInSheet)(targetUser.nik, todayStr, {
            jadwalMasuk: jadwal,
            keterangan: keterangan,
            status: newStatus,
        });
        const now = (0, date_1.getNow)();
        console.log(`${(0, date_1.formatLogTimestamp)(now)} Jadwal masuk ${targetUser.nama} diubah menjadi ${keterangan} oleh admin`);
        const statusEmoji = newStatus === 'Ontime' ? '🟢' : '🔴';
        await ctx.reply(`✅ <b>Absensi berhasil diupdate!</b>\n\n` +
            `👤 ${targetUser.nama}\n` +
            `├ Jadwal baru: ${jadwal}\n` +
            `├ Keterangan: ${keterangan}\n` +
            `└ Status: ${statusEmoji} ${newStatus}`, { parse_mode: 'HTML' });
    }
    catch (error) {
        console.error('Error updating attendance:', error);
        await ctx.reply('❌ <b>Gagal mengupdate absensi.</b> Silakan coba lagi.', {
            parse_mode: 'HTML',
        });
    }
}
//# sourceMappingURL=editAbsen.js.map