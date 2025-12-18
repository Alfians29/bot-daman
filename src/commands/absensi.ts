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
    // Show valid commands based on unit
    const validCommandsMsg =
      user.unit === 'SDI'
        ? '• /pagi\n• /piket'
        : '• /pagi\n• /malam\n• /pagimalam\n• /piketpagi\n• /piketmalam';

    await ctx.reply(
      `⚠️ <b>Command tidak dikenali!</b>\n\n` +
        `Kamu mengirim: <code>${command || 'tidak ada command'}</code>\n\n` +
        `Command yang tersedia untuk <b>${user.unit}</b>:\n${validCommandsMsg}\n\n` +
        `💡 <i>Pastikan penulisan command sudah benar.</i>`,
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
  // IMPORTANT: Order matters! Longer commands must come first to avoid prefix matching issues
  // (e.g., /pagimalam must be checked before /pagi)
  const validCommands = [
    // Daman commands
    '/pagimalam',
    '/pagi_malam',
    '/piketpagi',
    '/piket_pagi',
    '/piketmalam',
    '/piket_malam',
    '/pagi',
    '/malam',
    '/libur',
    // SDI commands
    '/piket',
  ];

  for (const cmd of validCommands) {
    if (text.startsWith(cmd)) {
      return cmd;
    }
  }

  return null;
}
