import { Context } from 'grammy';
import { findUserByTelegram, getTodayAttendance } from '../services/attendance';
import { formatTanggalFull } from '../utils/date';

/**
 * Handle /cekabsen command
 */
export async function handleCekAbsen(ctx: Context): Promise<void> {
  const username = ctx.from?.username;

  if (!username) {
    await ctx.reply('⚠️ <b>Tidak dapat mengidentifikasi user.</b>', {
      parse_mode: 'HTML',
    });
    return;
  }

  // Find user in database
  const user = await findUserByTelegram(`@${username}`);
  if (!user) {
    await ctx.reply('⚠️ <b>Username tidak terdaftar di database.</b>', {
      parse_mode: 'HTML',
    });
    return;
  }

  // Get today's attendance
  const record = await getTodayAttendance(user);

  if (!record) {
    await ctx.reply('ℹ️ <b>Kamu belum melakukan absen hari ini.</b>', {
      parse_mode: 'HTML',
    });
    return;
  }

  const msg =
    `📋 <b>Data Absen Kamu</b>\n\n` +
    `👤 ${record.nama}\n` +
    `🗓️ ${formatTanggalFull(record.waktu)}\n` +
    `🕒 Jam Absen: ${record.jamAbsen} WIB\n` +
    `📒 Jadwal: ${record.jadwalMasuk}\n` +
    `📝 Keterangan: ${record.keterangan}\n` +
    `🏷️ Unit: ${record.unit}\n` +
    `📌 Status: <b>${record.status}</b>\n\n` +
    (record.linkFoto ? `🔗 <a href='${record.linkFoto}'>Lihat Foto</a>` : '');

  await ctx.reply(msg, { parse_mode: 'HTML' });
}
