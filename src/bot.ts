import { Bot } from 'grammy';
import { config, validateConfig } from './config';
import { handleAbsensi, extractCommand } from './commands/absensi';
import { handleCekAbsen } from './commands/cekAbsen';
import { handleHelp, handleStart } from './commands/help';

/**
 * Create and configure the Telegram bot
 */
export function createBot(): Bot {
  validateConfig();

  const bot = new Bot(config.BOT_TOKEN);

  // Command handlers
  bot.command('start', handleStart);
  bot.command('help', handleHelp);
  bot.command('cekabsen', handleCekAbsen);

  // Photo handler (for attendance with photo + caption)
  bot.on('message:photo', async (ctx) => {
    const caption = ctx.message.caption;
    const command = extractCommand(caption);

    if (command) {
      await handleAbsensi(ctx, command);
    }
    // If no valid command in caption, ignore
  });

  // Text command handler (for attendance commands without photo - will show error)
  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text;

    // Check if it's an attendance command
    const attendanceCommands = [
      '/pagi',
      '/malam',
      '/piketpagi',
      '/piket_pagi',
      '/piketmalam',
      '/piket_malam',
      '/libur',
      '/piket',
    ];
    const isAttendanceCmd = attendanceCommands.some((cmd) =>
      text.toLowerCase().startsWith(cmd)
    );

    if (isAttendanceCmd) {
      await ctx.reply(
        '⚠️ <b>Absen harus menyertakan foto dengan caption sesuai jadwal.</b>',
        {
          parse_mode: 'HTML',
        }
      );
    }
  });

  // Error handler
  bot.catch((err) => {
    console.error('Bot error:', err);
  });

  return bot;
}
