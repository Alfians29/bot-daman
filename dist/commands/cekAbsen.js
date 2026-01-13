"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCekAbsen = handleCekAbsen;
const attendance_1 = require("../services/attendance");
const date_1 = require("../utils/date");
/**
 * Handle /cekabsen command
 */
async function handleCekAbsen(ctx) {
    const username = ctx.from?.username;
    if (!username) {
        await ctx.reply('⚠️ <b>Tidak dapat mengidentifikasi user.</b>', {
            parse_mode: 'HTML',
        });
        return;
    }
    // Find user in database
    const user = await (0, attendance_1.findUserByTelegram)(`@${username}`);
    if (!user) {
        await ctx.reply('⚠️ <b>Username tidak terdaftar di database.</b>', {
            parse_mode: 'HTML',
        });
        return;
    }
    // Get today's attendance
    const record = await (0, attendance_1.getTodayAttendance)(user);
    if (!record) {
        await ctx.reply('ℹ️ <b>Kamu belum melakukan absen hari ini.</b>', {
            parse_mode: 'HTML',
        });
        return;
    }
    const msg = `📋 <b>DETAIL ABSENSI</b>\n\n` +
        `👤 <b>${record.nama}</b>\n` +
        `├ ${(0, date_1.formatTanggalFull)(record.waktu)}\n` +
        `├ Jam: ${record.jamAbsen} WIB\n` +
        `├ Jadwal: ${record.jadwalMasuk}\n` +
        `├ Keterangan: ${record.keterangan}\n` +
        `├ Unit: ${record.unit}\n` +
        `└ Status: <b>${record.status}</b>`;
    await ctx.reply(msg, { parse_mode: 'HTML' });
}
//# sourceMappingURL=cekAbsen.js.map