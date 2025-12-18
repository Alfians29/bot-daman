import { Bot, Context, InputFile } from 'grammy';
import { config } from '../config';
import {
  findUserByTelegram,
  hasAttendedToday,
  validateCommand,
  recordAttendance,
} from '../services/attendance';
import { formatTanggal, formatJam, getNow } from '../utils/date';

/**
 * Handle attendance commands: /pagi, /malam, /piketpagi, /piketmalam, /libur
 */
export async function handleAbsensi(
  ctx: Context,
  command: string
): Promise<void> {
  const chatId = ctx.chat?.id;
  const username = ctx.from?.username;
  const message = ctx.message;

  if (!chatId || !username) {
    await ctx.reply('⚠️ <b>Tidak dapat mengidentifikasi user.</b>', {
      parse_mode: 'HTML',
    });
    return;
  }

  // Check if message has photo
  const photo = message?.photo;
  if (!photo || photo.length === 0) {
    await ctx.reply(
      '⚠️ <b>Absen harus menyertakan foto dengan caption sesuai jadwal.</b>',
      {
        parse_mode: 'HTML',
      }
    );
    return;
  }

  // Find user in database
  const user = await findUserByTelegram(`@${username}`);
  if (!user) {
    await ctx.reply(
      '⚠️ <b>Username tidak terdaftar di database.</b>\n\nHubungi admin untuk didaftarkan.',
      {
        parse_mode: 'HTML',
      }
    );
    return;
  }

  // Validate command matches user's allowed commands for their unit
  const isValidCommand = await validateCommand(user, command);
  if (!isValidCommand) {
    await ctx.reply(
      `⚠️ <b>Caption tidak sesuai dengan jadwal unit kamu.</b>\n\n` +
        `Kirim /help untuk melihat command yang tersedia untuk ${user.unit}.`,
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Check if already attended today
  const alreadyAttended = await hasAttendedToday(user);
  if (alreadyAttended) {
    await ctx.reply(
      '⚠️ <b>Kamu sudah melakukan absen!</b>\n' +
        'Hanya diperbolehkan <b>1x absen per hari</b>, atau hubungi admin jika ada kendala yaa.',
      { parse_mode: 'HTML' }
    );
    return;
  }

  // Get photo URL from Telegram
  const fileId = photo[photo.length - 1].file_id;
  let photoUrl = '';

  try {
    const file = await ctx.api.getFile(fileId);
    photoUrl = `https://api.telegram.org/file/bot${config.BOT_TOKEN}/${file.file_path}`;
  } catch (error) {
    console.error('Error getting file URL:', error);
    photoUrl = fileId; // Fallback to file_id
  }

  // Record attendance
  const result = await recordAttendance(
    user,
    command,
    photoUrl,
    message?.message_id?.toString(),
    chatId.toString()
  );

  if (result.success && result.data) {
    const statusEmoji = result.data.status === 'Ontime' ? '🟢' : '🔴';
    const notif =
      `✅ <b>Absensi Berhasil!</b>\n\n` +
      `👤 ${result.data.nama}\n` +
      `🗓️ ${result.data.tanggal} • ${result.data.jamAbsen} WIB\n` +
      `📌 Status: ${statusEmoji} <b>${result.data.status}</b>`;

    await ctx.reply(notif, { parse_mode: 'HTML' });
  } else {
    await ctx.reply(result.message, { parse_mode: 'HTML' });
  }
}

/**
 * Get command from message caption
 */
export function extractCommand(caption: string | undefined): string | null {
  if (!caption) return null;

  const text = caption.trim().toLowerCase();

  // List of valid attendance commands
  const validCommands = [
    '/pagi',
    '/malam',
    '/piketpagi',
    '/piket_pagi',
    '/piketmalam',
    '/piket_malam',
    '/pagimalam',
    '/pagi_malam',
    '/libur',
  ];

  for (const cmd of validCommands) {
    if (text.startsWith(cmd)) {
      return cmd;
    }
  }

  return null;
}
