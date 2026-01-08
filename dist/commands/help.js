"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleHelp = handleHelp;
exports.handleStart = handleStart;
/**
 * Handle /help command
 */
async function handleHelp(ctx) {
    const msg = `🤖 <b>Panduan Bot Absensi</b>\n\n` +
        `📸 <b>Absen</b>\n` +
        `Kirim foto + caption sesuai jadwal.\n\n` +
        `📝 <b>Cek Absensi</b>\n` +
        `/cekabsen → Lihat absensi hari ini\n\n` +
        `ℹ️ <b>Command Absensi</b>\n` +
        `<b>DAMAN</b>\n` +
        `• /pagi\n` +
        `• /malam\n` +
        `• /piketpagi\n` +
        `• /piketmalam\n\n` +
        `<b>SDI</b>\n` +
        `• /pagi\n` +
        `• /piket\n\n` +
        `⏰ <b>Catatan</b>\n` +
        `• Absen harus disertai foto\n` +
        `• Hanya boleh 1x absen per hari\n` +
        `• Status Telat jika lewat 5 menit dari jadwal`;
    await ctx.reply(msg, { parse_mode: 'HTML' });
}
/**
 * Handle /start command
 */
async function handleStart(ctx) {
    const name = ctx.from?.first_name || 'User';
    const msg = `👋 Halo <b>${name}</b>!\n\n` +
        `Selamat datang di <b>Bot Absensi</b>.\n\n` +
        `Ketik /help untuk melihat panduan penggunaan bot.`;
    await ctx.reply(msg, { parse_mode: 'HTML' });
}
//# sourceMappingURL=help.js.map