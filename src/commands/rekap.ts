import { Context } from 'grammy';
import { rekapHarian, rekapMingguan, rekapBulanan } from '../services/rekap';
import { config } from '../config';

/**
 * Handle /rekapharian command
 */
export async function handleRekapHarian(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;

  // Only allow in configured group
  if (chatId?.toString() !== config.GROUP_ID) {
    return;
  }

  try {
    const result = await rekapHarian();

    if (
      !result ||
      (result.includes('📊 REKAP HARIAN') && !result.includes('•'))
    ) {
      await ctx.reply('📭 <b>Belum ada data absensi hari ini.</b>', {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.reply(result, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error getting rekap harian:', error);
    await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap harian.');
  }
}

/**
 * Handle /rekapmingguan command
 */
export async function handleRekapMingguan(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;

  // Only allow in configured group
  if (chatId?.toString() !== config.GROUP_ID) {
    return;
  }

  try {
    const result = await rekapMingguan();

    if (
      !result ||
      (result.includes('📊 REKAP MINGGUAN') && !result.includes('•'))
    ) {
      await ctx.reply('📭 <b>Belum ada data absensi minggu ini.</b>', {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.reply(result, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error getting rekap mingguan:', error);
    await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap mingguan.');
  }
}

/**
 * Handle /rekapbulanan command
 */
export async function handleRekapBulanan(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;

  // Only allow in configured group
  if (chatId?.toString() !== config.GROUP_ID) {
    return;
  }

  try {
    const result = await rekapBulanan();

    if (
      !result ||
      (result.includes('📊 REKAP BULANAN') && !result.includes('•'))
    ) {
      await ctx.reply('📭 <b>Belum ada data absensi bulan ini.</b>', {
        parse_mode: 'HTML',
      });
      return;
    }

    await ctx.reply(result, { parse_mode: 'HTML' });
  } catch (error) {
    console.error('Error getting rekap bulanan:', error);
    await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap bulanan.');
  }
}
