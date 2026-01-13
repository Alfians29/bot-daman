import { Context } from 'grammy';

/**
 * Handle /help command
 */
export async function handleHelp(ctx: Context): Promise<void> {
  const msg =
    `📖 <b>PANDUAN BOT ABSENSI</b>\n\n` +
    `📸 <b>Cara Absen</b>\n` +
    `├ Kirim foto dengan caption command\n` +
    `└ Contoh: Foto + /pagi\n\n` +
    `📝 <b>Command DAMAN</b>\n` +
    `├ /pagi → Shift pagi\n` +
    `├ /malam → Shift malam\n` +
    `├ /piketpagi → Piket pagi\n` +
    `└ /piketmalam → Piket malam\n\n` +
    `📝 <b>Command SDI</b>\n` +
    `├ /pagi → Pagi\n` +
    `└ /piket → Piket\n\n` +
    `🔍 <b>Command Lainnya</b>\n` +
    `├ /help → Panduan ini\n` +
    `└ /cekabsen → Cek absensi hari ini\n\n` +
    `⚠️ <b>Catatan</b>\n` +
    `├ Absen wajib menyertakan foto\n` +
    `├ Maksimal 1x absen per shift\n` +
    `└ Telat jika lewat 5 menit`;

  await ctx.reply(msg, { parse_mode: 'HTML' });
}

/**
 * Handle /start command
 */
export async function handleStart(ctx: Context): Promise<void> {
  const name = ctx.from?.first_name || 'User';

  const msg =
    `👋 Halo <b>${name}</b>!\n\n` +
    `Selamat datang di <b>Bot Absensi</b>.\n\n` +
    `Ketik /help untuk melihat panduan penggunaan bot.`;

  await ctx.reply(msg, { parse_mode: 'HTML' });
}
