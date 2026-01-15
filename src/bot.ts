import { Bot } from 'grammy';
import { config, validateConfig } from './config';
import { handleAbsensi, extractCommand } from './commands/absensi';
import { handleCekAbsen } from './commands/cekAbsen';
import { handleHelp } from './commands/help';
import {
  handleRekapHarian,
  handleRekapMingguan,
  handleRekapBulanan,
} from './commands/rekap';
import { handleEditAbsen } from './commands/editAbsen';
import { logCommand } from './utils/logger';

/**
 * Create and configure the Telegram bot
 */
export function createBot(): Bot {
  validateConfig();

  const bot = new Bot(config.BOT_TOKEN);

  // Command handlers with logging
  bot.command('help', (ctx) => {
    logCommand('help', ctx.from?.username, ctx.from?.id);
    return handleHelp(ctx);
  });
  bot.command('cekabsen', (ctx) => {
    logCommand('cekabsen', ctx.from?.username, ctx.from?.id);
    return handleCekAbsen(ctx);
  });
  bot.command('rekapharian', (ctx) => {
    logCommand('rekapharian', ctx.from?.username, ctx.from?.id);
    return handleRekapHarian(ctx);
  });
  bot.command('rekapmingguan', (ctx) => {
    logCommand('rekapmingguan', ctx.from?.username, ctx.from?.id);
    return handleRekapMingguan(ctx);
  });
  bot.command('rekapbulanan', (ctx) => {
    logCommand('rekapbulanan', ctx.from?.username, ctx.from?.id);
    return handleRekapBulanan(ctx);
  });
  bot.command('editabsen', (ctx) => {
    logCommand('editabsen', ctx.from?.username, ctx.from?.id);
    return handleEditAbsen(ctx);
  });

  // Bot status command - admin only
  const botStartTime = new Date();
  bot.command('botstatus', async (ctx) => {
    logCommand('botstatus', ctx.from?.username, ctx.from?.id);
    const username = ctx.from?.username?.toLowerCase();

    // Only allow @alfiyyann
    if (username !== 'alfiyyann') {
      await ctx.reply('Aku gamau respon kamu. 😒', { parse_mode: 'HTML' });
      return;
    }

    const now = new Date();
    const uptimeMs = now.getTime() - botStartTime.getTime();
    const uptimeDays = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const uptimeHours = Math.floor(
      (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const uptimeMinutes = Math.floor(
      (uptimeMs % (1000 * 60 * 60)) / (1000 * 60)
    );
    const uptimeSeconds = Math.floor((uptimeMs % (1000 * 60)) / 1000);

    let uptimeStr = '';
    if (uptimeDays > 0) uptimeStr += `${uptimeDays} hari `;
    if (uptimeHours > 0) uptimeStr += `${uptimeHours} jam `;
    if (uptimeMinutes > 0) uptimeStr += `${uptimeMinutes} menit `;
    uptimeStr += `${uptimeSeconds} detik`;

    const timestamp = now.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const startTimeStr = botStartTime.toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const statusMessage =
      `🤖 <b>BOT ABSENSI DAMAN & SDI</b>\n\n` +
      `📝 <b>Bot Information</b>\n` +
      `├ Name: AbsensiBot\n` +
      `├ Version: 1.0.0\n` +
      `├ Language: TypeScript\n` +
      `└ Framework: grammY + Prisma\n\n` +
      `📊 <b>Server Status</b>\n` +
      `├ Status: ✅ <b>Active</b>\n` +
      `├ Uptime: ${uptimeStr.trim()}\n` +
      `├ Start: ${startTimeStr} WIB\n` +
      `└ Time: ${timestamp} WIB`;

    await ctx.reply(statusMessage, { parse_mode: 'HTML' });
  });

  // Photo handler (for attendance with photo + caption)
  bot.on('message:photo', async (ctx) => {
    const caption = ctx.message.caption || '';
    const command = extractCommand(caption);

    if (command) {
      await handleAbsensi(ctx, command);
      return;
    }

    // Check if caption looks like a typo command (starts with /)
    const trimmedCaption = caption.trim().toLowerCase();
    if (trimmedCaption.startsWith('/')) {
      await ctx.reply(
        `⚠️ <b>Command tidak dikenali!</b>\n\n` +
          `Kamu mengirim: <code>${trimmedCaption}</code>\n\n` +
          `<b>Command yang tersedia:</b>\n` +
          `DAMAN:\n• /pagi\n• /malam\n• /pagimalam\n• /piketpagi\n• /piketmalam\n\n` +
          `SDI:\n• /pagi\n• /piket\n\n` +
          `💡 <i>Pastikan penulisan command benar.</i>`,
        { parse_mode: 'HTML' }
      );
    }
  });

  // Text command handler (for attendance commands without photo - will show error)
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.toLowerCase().trim();

    // Valid attendance commands (longer first to avoid prefix issues)
    const validCommands = [
      '/pagimalam',
      '/pagi_malam',
      '/piketpagi',
      '/piket_pagi',
      '/piketmalam',
      '/piket_malam',
      '/pagi',
      '/malam',
      '/libur',
      '/piket',
    ];

    // Check if it's a valid attendance command
    const isValidCmd = validCommands.some((cmd) => text.startsWith(cmd));

    if (isValidCmd) {
      await ctx.reply(
        '⚠️ <b>Absen harus menyertakan foto dengan caption sesuai jadwal.</b>',
        { parse_mode: 'HTML' }
      );
      return;
    }

    // Check if it looks like a typo command (starts with /p, /m, or /l but not valid)
    const looksLikeCommand =
      text.startsWith('/pagi') ||
      text.startsWith('/pag') ||
      text.startsWith('/pa') ||
      text.startsWith('/mal') ||
      text.startsWith('/mala') ||
      text.startsWith('/pik') ||
      text.startsWith('/piket') ||
      text.startsWith('/lib');

    if (looksLikeCommand) {
      await ctx.reply(
        `⚠️ <b>Command tidak dikenali!</b>\n\n` +
          `Kamu mengirim: <code>${text}</code>\n\n` +
          `<b>Command yang tersedia:</b>\n` +
          `DAMAN:\n• /pagi\n• /malam\n• /pagimalam\n• /piketpagi\n• /piketmalam\n\n` +
          `SDI:\n• /pagi\n• /piket\n\n` +
          `💡 <i>Pastikan penulisan command benar dan sertakan foto.</i>`,
        { parse_mode: 'HTML' }
      );
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
