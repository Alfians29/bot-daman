import cron from 'node-cron';
import { Bot } from 'grammy';
import { config } from '../config';
import { rekapHarian, rekapMingguan, rekapBulanan } from './rekap';
import {
  logSuccess,
  logError,
  logSchedule,
  logReminder,
  logHeartbeat as logHeartbeatUtil,
} from '../utils/logger';

/**
 * Get Indonesian day name
 */
function getIndonesianDay(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[date.getDay()];
}

/**
 * Get Indonesian month name
 */
function getIndonesianMonth(date: Date): string {
  const months = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember',
  ];
  return months[date.getMonth()];
}

/**
 * Log day change with minimalist design
 */
function logDayChange(): void {
  const now = new Date();
  const dayName = getIndonesianDay(now);
  const day = now.getDate();
  const month = getIndonesianMonth(now);
  const year = now.getFullYear();

  const dateStr = `📅 ${dayName}, ${day} ${month} ${year}`;
  const line = '─'.repeat(11);

  console.log('');
  console.log(`${line} ${dateStr} ${line}`);
  console.log('');
}

// Bot start time for uptime calculation
let botStartTime: Date | null = null;

/**
 * Set bot start time (called when bot starts)
 */
export function setBotStartTime(): void {
  botStartTime = new Date();
}

/**
 * Log heartbeat with uptime and memory usage
 */
function logHeartbeat(): void {
  const now = new Date();

  // Calculate uptime
  let uptimeStr = 'N/A';
  if (botStartTime) {
    const uptimeMs = now.getTime() - botStartTime.getTime();
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      uptimeStr = `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      uptimeStr = `${hours}h ${minutes}m`;
    } else {
      uptimeStr = `${minutes}m`;
    }
  }

  // Get memory usage
  const memUsage = process.memoryUsage();
  const memMB = Math.round(memUsage.heapUsed / 1024 / 1024);

  logHeartbeatUtil(uptimeStr, memMB);
}

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
  // DAY CHANGE LOG - Every day at 00:00 WIB
  // ============================================
  // Cron: "0 0 * * *" = At 00:00 every day
  cron.schedule(
    '0 0 * * *',
    () => {
      logDayChange();
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  📅 Day Change Log: Every day at 00:00 WIB');

  // ============================================
  // HEARTBEAT LOG - Every 6 hours (4x daily)
  // ============================================
  // Cron: "0 0,6,12,18 * * *" = At 00:00, 06:00, 12:00, 18:00 every day
  cron.schedule(
    '0 0,6,12,18 * * *',
    () => {
      logHeartbeat();
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log(
    '  💓 Heartbeat Log: Every 6 hours (00:00, 06:00, 12:00, 18:00 WIB)'
  );

  // ============================================
  // REMINDER ABSENSI - Every day at 07:00 WIB
  // ============================================
  // Cron: "0 7 * * *" = At 07:00 every day
  cron.schedule(
    '0 7 * * *',
    async () => {
      logReminder('Sending daily attendance reminder...');
      try {
        await sendDailyReminder(bot);
        logSuccess('Daily reminder sent to group');
      } catch (error) {
        logError('Error sending daily reminder: ' + error);
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
      logSchedule('Running scheduled rekap harian...');
      try {
        const result = await rekapHarian();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          logSuccess('Rekap harian sent to group');
        } else {
          logSchedule('No data for rekap harian today');
        }
      } catch (error) {
        logError('Error in scheduled rekap harian: ' + error);
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
      logSchedule('Running scheduled rekap mingguan...');
      try {
        const result = await rekapMingguan();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          logSuccess('Rekap mingguan sent to group');
        } else {
          logSchedule('No data for rekap mingguan this week');
        }
      } catch (error) {
        logError('Error in scheduled rekap mingguan: ' + error);
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
      logSchedule('Running scheduled rekap bulanan...');
      try {
        const result = await rekapBulanan();
        if (result && result.includes('•')) {
          await sendToGroup(bot, result);
          logSuccess('Rekap bulanan sent to group');
        } else {
          logSchedule('No data for rekap bulanan this month');
        }
      } catch (error) {
        logError('Error in scheduled rekap bulanan: ' + error);
      }
    },
    {
      timezone: 'Asia/Jakarta',
    }
  );
  console.log('  ✅ Rekap Bulanan: Every 15th at 17:10 WIB');

  console.log('🕐 All scheduled jobs are set up!');
}
