"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRekapHarian = handleRekapHarian;
exports.handleRekapMingguan = handleRekapMingguan;
exports.handleRekapBulanan = handleRekapBulanan;
const rekap_1 = require("../services/rekap");
const config_1 = require("../config");
// Admin username yang diizinkan
const ADMIN_USERNAME = 'alfiyyann';
/**
 * Check if user is admin
 */
function isAdmin(ctx) {
    const username = ctx.from?.username?.toLowerCase();
    return username === ADMIN_USERNAME;
}
/**
 * Send unauthorized message
 */
async function sendUnauthorized(ctx) {
    await ctx.reply('Aku gamau respon kamu. 😒', {
        parse_mode: 'HTML',
    });
}
/**
 * Handle /rekapharian command
 */
async function handleRekapHarian(ctx) {
    const chatId = ctx.chat?.id;
    // Only allow in configured group
    if (chatId?.toString() !== config_1.config.GROUP_ID) {
        return;
    }
    // Only allow admin
    if (!isAdmin(ctx)) {
        await sendUnauthorized(ctx);
        return;
    }
    try {
        const result = await (0, rekap_1.rekapHarian)();
        if (!result ||
            (result.includes('📊 REKAP HARIAN') && !result.includes('•'))) {
            await ctx.reply('📭 <b>Belum ada data absensi hari ini.</b>', {
                parse_mode: 'HTML',
            });
            return;
        }
        await ctx.reply(result, { parse_mode: 'HTML' });
    }
    catch (error) {
        console.error('Error getting rekap harian:', error);
        await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap harian.');
    }
}
/**
 * Handle /rekapmingguan command
 */
async function handleRekapMingguan(ctx) {
    const chatId = ctx.chat?.id;
    // Only allow in configured group
    if (chatId?.toString() !== config_1.config.GROUP_ID) {
        return;
    }
    // Only allow admin
    if (!isAdmin(ctx)) {
        await sendUnauthorized(ctx);
        return;
    }
    try {
        const result = await (0, rekap_1.rekapMingguan)();
        if (!result ||
            (result.includes('📊 REKAP MINGGUAN') && !result.includes('•'))) {
            await ctx.reply('📭 <b>Belum ada data absensi minggu ini.</b>', {
                parse_mode: 'HTML',
            });
            return;
        }
        await ctx.reply(result, { parse_mode: 'HTML' });
    }
    catch (error) {
        console.error('Error getting rekap mingguan:', error);
        await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap mingguan.');
    }
}
/**
 * Handle /rekapbulanan command
 */
async function handleRekapBulanan(ctx) {
    const chatId = ctx.chat?.id;
    // Only allow in configured group
    if (chatId?.toString() !== config_1.config.GROUP_ID) {
        return;
    }
    // Only allow admin
    if (!isAdmin(ctx)) {
        await sendUnauthorized(ctx);
        return;
    }
    try {
        const result = await (0, rekap_1.rekapBulanan)();
        if (!result ||
            (result.includes('📊 REKAP BULANAN') && !result.includes('•'))) {
            await ctx.reply('📭 <b>Belum ada data absensi bulan ini.</b>', {
                parse_mode: 'HTML',
            });
            return;
        }
        await ctx.reply(result, { parse_mode: 'HTML' });
    }
    catch (error) {
        console.error('Error getting rekap bulanan:', error);
        await ctx.reply('❌ Terjadi kesalahan saat mengambil rekap bulanan.');
    }
}
//# sourceMappingURL=rekap.js.map