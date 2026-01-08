"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendDailyReminder = sendDailyReminder;
exports.setupScheduler = setupScheduler;
const node_cron_1 = __importDefault(require("node-cron"));
const config_1 = require("../config");
const rekap_1 = require("./rekap");
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
async function sendToGroup(bot, message) {
    try {
        await bot.api.sendMessage(config_1.config.GROUP_ID, message, {
            parse_mode: 'HTML',
        });
    }
    catch (error) {
        console.error('Failed to send scheduled message:', error);
    }
}
/**
 * Send daily reminder (exported for testing via command)
 */
async function sendDailyReminder(bot) {
    const gifUrl = 'https://media1.giphy.com/media/v1.Y2lkPTc5MGI3NjExcWtleHpjbnJpZGRlbTI0YjA2YmFsZDFnbnd2NWwxbWpia2YzMDBrdCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/UL7IwuaOrgN6NFfgio/giphy.gif';
    const caption = '😘 Jangan lupa absen hari ini!\n\n' +
        'Kirim foto dengan caption sesuai unit dan jadwal masing-masing yaa..';
    await bot.api.sendAnimation(config_1.config.GROUP_ID, gifUrl, {
        caption: caption,
    });
}
/**
 * Setup scheduled rekap jobs
 */
function setupScheduler(bot) {
    console.log('🕐 Setting up scheduled jobs...');
    // ============================================
    // REMINDER ABSENSI - Every day at 07:00 WIB
    // ============================================
    // Cron: "0 7 * * *" = At 07:00 every day
    node_cron_1.default.schedule('0 7 * * *', async () => {
        console.log('⏰ Sending daily attendance reminder...');
        try {
            await sendDailyReminder(bot);
            console.log('✅ Daily reminder sent to group');
        }
        catch (error) {
            console.error('❌ Error sending daily reminder:', error);
        }
    }, {
        timezone: 'Asia/Jakarta',
    });
    console.log('  ✅ Reminder Absensi: Every day at 07:00 WIB');
    // ============================================
    // REKAP HARIAN - Every day at 17:00 WIB
    // ============================================
    // Cron: "0 17 * * *" = At 17:00 every day
    node_cron_1.default.schedule('0 17 * * *', async () => {
        console.log('📊 Running scheduled rekap harian...');
        try {
            const result = await (0, rekap_1.rekapHarian)();
            if (result && result.includes('•')) {
                await sendToGroup(bot, result);
                console.log('✅ Rekap harian sent to group');
            }
            else {
                console.log('📭 No data for rekap harian today');
            }
        }
        catch (error) {
            console.error('❌ Error in scheduled rekap harian:', error);
        }
    }, {
        timezone: 'Asia/Jakarta',
    });
    console.log('  ✅ Rekap Harian: Every day at 17:00 WIB');
    // ============================================
    // REKAP MINGGUAN - Every Friday at 17:05 WIB
    // ============================================
    // Cron: "5 17 * * 5" = At 17:05 every Friday (5 = Friday)
    node_cron_1.default.schedule('5 17 * * 5', async () => {
        console.log('📊 Running scheduled rekap mingguan...');
        try {
            const result = await (0, rekap_1.rekapMingguan)();
            if (result && result.includes('•')) {
                await sendToGroup(bot, result);
                console.log('✅ Rekap mingguan sent to group');
            }
            else {
                console.log('📭 No data for rekap mingguan this week');
            }
        }
        catch (error) {
            console.error('❌ Error in scheduled rekap mingguan:', error);
        }
    }, {
        timezone: 'Asia/Jakarta',
    });
    console.log('  ✅ Rekap Mingguan: Every Friday at 17:05 WIB');
    // ============================================
    // REKAP BULANAN - Every 15th at 17:10 WIB
    // ============================================
    // Cron: "10 17 15 * *" = At 17:10 on the 15th of every month
    node_cron_1.default.schedule('10 17 15 * *', async () => {
        console.log('📊 Running scheduled rekap bulanan...');
        try {
            const result = await (0, rekap_1.rekapBulanan)();
            if (result && result.includes('•')) {
                await sendToGroup(bot, result);
                console.log('✅ Rekap bulanan sent to group');
            }
            else {
                console.log('📭 No data for rekap bulanan this month');
            }
        }
        catch (error) {
            console.error('❌ Error in scheduled rekap bulanan:', error);
        }
    }, {
        timezone: 'Asia/Jakarta',
    });
    console.log('  ✅ Rekap Bulanan: Every 15th at 17:10 WIB');
    console.log('🕐 All scheduled jobs are set up!');
}
//# sourceMappingURL=scheduler.js.map