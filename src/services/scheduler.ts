import cron from 'node-cron';
import { Bot } from 'grammy';
import { config } from '../config';
import { rekapHarian, rekapMingguan, rekapBulanan } from './rekap';

/**
 * Scheduler for automatic rekap reports
 *
 * Schedule:
 * - Rekap Harian: Every day at 17:30 WIB
 * - Rekap Mingguan: Every Friday at 17:35 WIB
 * - Rekap Bulanan: Every 15th of month at 17:40 WIB
 */

/**
 * Send message to the group
 */
async function sendToGroup(bot: Bot, message: string): Promise<void> {
  try {
    await bot.api.sendMessage(config.GROUP_ID, message, {
      parse_mode: 'HTML',
    });
  } catch (error) {
    console.error('Failed to send scheduled message:', error);
  }
}

/**
 * Send daily reminder (exported for testing via command)
 */
export async function sendDailyReminder(bot: Bot): Promise<void> {
  const gifUrl =
    'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWtleHpjbnJpZGRlbTI0YjA2YmFsZDFnbnd2NWwxbWpia2YzMDBrdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UL7IwuaOrgN6NFfgio/giphy.gif';
  const caption =
    '😘 Jangan lupa absen hari ini!\n\n' +
    'Kirim foto dengan caption sesuai unit dan jadwal masing-masing yaa..';

  await bot.api.sendAnimation(config.GROUP_ID, gifUrl, {
    caption: caption,
  });
}

/**
 * Setup scheduled rekap jobs
 */
export function setupScheduler(bot: Bot): void {
  console.log('🕐 Setting up scheduled jobs...');

  // ============================================
  // REMINDER ABSENSI - Every day at 07:00 WIB
  // ============================================
  // Cron: "0 7 * * *" = At 07:00 every day
  cron.schedule(
    '0 7 * * *',
    async () => {
      console.log('⏰ Sending daily attendance reminder...');
      try {
        await sendDailyReminder(bot);
        console.log('✅ Daily reminder sent to group');
      } catch (error) {
        console.error('❌ Error sending daily reminder:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  ✅ Reminder Absensi: Every day at 07:00 WIB');

  // ============================================
  // REKAP HARIAN - Every day at 17:00 WIB
  // ============================================
  // Cron: "0 17 * * *" = At 17:00 every day
  cron.schedule(
    '0 17 * * *',
    async () => {
      console.log('📊 Running scheduled rekap harian...');
      try {
        const result = await rekapHarian();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          console.log('✅ Rekap harian sent to group');
        } else {
          console.log('📭 No data for rekap harian today');
        }
      } catch (error) {
        console.error('❌ Error in scheduled rekap harian:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  ✅ Rekap Harian: Every day at 17:00 WIB');

  // ============================================
  // REKAP MINGGUAN - Every Friday at 17:05 WIB
  // ============================================
  // Cron: "5 17 * * 5" = At 17:05 every Friday (5 = Friday)
  cron.schedule(
    '5 17 * * 5',
    async () => {
      console.log('📊 Running scheduled rekap mingguan...');
      try {
        const result = await rekapMingguan();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          console.log('✅ Rekap mingguan sent to group');
        } else {
          console.log('📭 No data for rekap mingguan this week');
        }
      } catch (error) {
        console.error('❌ Error in scheduled rekap mingguan:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  ✅ Rekap Mingguan: Every Friday at 17:05 WIB');

  // ============================================
  // REKAP BULANAN - Every 15th at 17:10 WIB
  // ============================================
  // Cron: "10 17 15 * *" = At 17:10 on the 15th of every month
  cron.schedule(
    '10 17 15 * *',
    async () => {
      console.log('📊 Running scheduled rekap bulanan...');
      try {
        const result = await rekapBulanan();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          console.log('✅ Rekap bulanan sent to group');
        } else {
          console.log('📭 No data for rekap bulanan this month');
        }
      } catch (error) {
        console.error('❌ Error in scheduled rekap bulanan:', error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  ✅ Rekap Bulanan: Every 15th at 17:10 WIB');

  console.log('🕐 All scheduled jobs are set up!');
}
