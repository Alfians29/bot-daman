import { Context } from 'grammy';
import {
  findUserByTelegram,
  getCommandByUnitAndCommand,
  getTodayAttendance,
  normalizeCommand,
  commandToShiftType,
  BotUserData,
} from '../services/attendance';
import { prisma } from '../lib/prisma';
import {
  getTodayStart,
  formatTanggal,
  formatLogTimestamp,
  getNow,
  isLateByTimeString,
} from '../utils/date';
import { AttendanceStatus } from '@prisma/client';
import { updateAttendanceInSheet } from '../services/sheets';

// Admin username
const ADMIN_USERNAME = 'alfiyyann';

/**
 * Handle /editabsen command (admin only)
 * Format: /editabsen @username [jadwal]
 * Example: /editabsen @alfiyyann pagi
 */
export async function handleEditAbsen(ctx: Context): Promise<void> {
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
    await ctx.reply(
      `⚠️ <b>Format salah!</b>\n\n` +
        `Format: <code>/editabsen @username jadwal</code>\n\n` +
        `Contoh:\n` +
        `• /editabsen @alfiyyann pagi\n` +
        `• /editabsen @alfiyyann malam`,
      { parse_mode: 'HTML' },
    );
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
  const targetUser = await findUserByTelegram(targetUsername);
  if (!targetUser) {
    await ctx.reply(
      `⚠️ <b>User ${targetUsername} tidak ditemukan di database.</b>`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  // Check if user has attendance today
  const todayAttendance = await getTodayAttendance(targetUser);
  if (!todayAttendance) {
    await ctx.reply(
      `⚠️ <b>${targetUser.nama} belum absen hari ini.</b>\n\nTidak ada data yang bisa diedit.`,
      { parse_mode: 'HTML' },
    );
    return;
  }

  // Get new command data
  const newCommand = `/${newJadwal}`;

  // Get schedule based on unit
  let startTime: string;
  let endTime: string;
  let lateAfter: string;
  let keterangan: string;

  if (targetUser.unit === 'SDI') {
    // SDI fixed schedules
    if (newJadwal === 'pagi') {
      startTime = '07:30';
      endTime = '17:00';
      lateAfter = '07:36';
      keterangan = 'Pagi';
    } else if (newJadwal === 'piket') {
      startTime = '08:00';
      endTime = '17:00';
      lateAfter = '08:06';
      keterangan = 'Piket';
    } else {
      await ctx.reply(
        `⚠️ <b>Jadwal tidak valid untuk SDI!</b>\n\nPilihan: pagi, piket`,
        { parse_mode: 'HTML' },
      );
      return;
    }
  } else {
    // DAMAN - get from database ShiftSetting
    const cmdData = await getCommandByUnitAndCommand(
      targetUser.unit,
      newCommand,
    );
    if (!cmdData) {
      await ctx.reply(
        `⚠️ <b>Jadwal "${newJadwal}" tidak ditemukan untuk ${targetUser.unit}!</b>`,
        { parse_mode: 'HTML' },
      );
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
  const isLate = isLateByTimeString(jamAbsen, lateAfter);
  const newStatus = isLate ? 'Telat' : 'Ontime';

  try {
    // Update in database (for Daman users)
    if (targetUser.source === 'USER') {
      const today = getTodayStart();
      const shiftType = commandToShiftType(newCommand);

      await prisma.attendance.updateMany({
        where: {
          memberId: targetUser.id,
          tanggal: today,
        },
        data: {
          keterangan: shiftType,
          status: isLate ? AttendanceStatus.TELAT : AttendanceStatus.ONTIME,
        },
      });
    }

    // Update in Google Sheets (jadwal, keterangan, and status)
    const todayStr = formatTanggal(getTodayStart());
    await updateAttendanceInSheet(targetUser.nik, todayStr, {
      jadwalMasuk: jadwal,
      keterangan: keterangan,
      status: newStatus,
    });

    const now = getNow();
    console.log(
      `${formatLogTimestamp(now)} Jadwal masuk ${
        targetUser.nama
      } diubah menjadi ${keterangan} oleh admin`,
    );

    const statusEmoji = newStatus === 'Ontime' ? '🟢' : '🔴';
    await ctx.reply(
      `✅ <b>Absensi berhasil diupdate!</b>\n\n` +
        `👤 ${targetUser.nama}\n` +
        `├ Jadwal baru: ${jadwal}\n` +
        `├ Keterangan: ${keterangan}\n` +
        `└ Status: ${statusEmoji} ${newStatus}`,
      { parse_mode: 'HTML' },
    );
  } catch (error) {
    console.error('Error updating attendance:', error);
    await ctx.reply('❌ <b>Gagal mengupdate absensi.</b> Silakan coba lagi.', {
      parse_mode: 'HTML',
    });
  }
}
