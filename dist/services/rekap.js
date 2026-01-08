"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rekapHarian = rekapHarian;
exports.rekapMingguan = rekapMingguan;
exports.rekapBulanan = rekapBulanan;
const sheets_1 = require("./sheets");
const date_1 = require("../utils/date");
/**
 * Helper to get date string in YYYY-MM-DD format for comparison
 * This avoids timezone issues by comparing date strings instead of timestamps
 */
function getDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
/**
 * Group attendance data by filter function
 * Uses string-based date comparison to avoid timezone issues
 */
async function groupAbsensi(filterFn) {
    const records = await (0, sheets_1.getAttendanceRecords)();
    const grouped = {};
    for (const record of records) {
        const date = new Date(record.waktu);
        const dateStr = getDateString(date);
        if (filterFn(dateStr, date)) {
            const unit = record.unit;
            if (!grouped[unit])
                grouped[unit] = {};
            if (!grouped[unit][record.nama]) {
                grouped[unit][record.nama] = { nama: record.nama, ontime: 0, telat: 0 };
            }
            if (record.status === 'Ontime')
                grouped[unit][record.nama].ontime++;
            if (record.status === 'Telat')
                grouped[unit][record.nama].telat++;
        }
    }
    return grouped;
}
/**
 * Format rekap message
 */
function formatRekap(title, dateStr, data, isHarian) {
    let result = `<b>📊 ${title.toUpperCase()} (${dateStr})</b>\n\n`;
    const units = Object.keys(data).sort();
    for (const unit of units) {
        const users = Object.values(data[unit]).sort((a, b) => a.nama.localeCompare(b.nama));
        result += `🏷️ <b>${unit.toUpperCase()}</b>\n`;
        for (const user of users) {
            if (isHarian) {
                result += `• ${user.nama}\n`;
            }
            else {
                const detail = [];
                if (user.ontime > 0)
                    detail.push(`Ontime: ${user.ontime}`);
                if (user.telat > 0)
                    detail.push(`Telat: ${user.telat}`);
                detail.push(`Total: ${user.ontime + user.telat}`);
                result += `• <b>${user.nama}</b>\n  ${detail.join(' | ')}\n`;
            }
        }
        result += '\n';
    }
    return result.trim();
}
/**
 * Get daily rekap
 */
async function rekapHarian() {
    const today = (0, date_1.getNow)();
    const todayDateStr = getDateString(today);
    const todayStr = (0, date_1.formatTanggalIndo)(today);
    const grouped = await groupAbsensi((dateStr) => {
        return dateStr === todayDateStr;
    });
    return formatRekap('Rekap Harian', todayStr, grouped, true);
}
/**
 * Get weekly rekap (Saturday to Friday)
 */
async function rekapMingguan() {
    const today = (0, date_1.getNow)();
    const { start, end } = (0, date_1.getWeekRange)(today);
    const rangeStr = `${(0, date_1.formatTanggalIndo)(start)} - ${(0, date_1.formatTanggalIndo)(end)}`;
    const startStr = getDateString(start);
    const endStr = getDateString(end);
    const grouped = await groupAbsensi((dateStr) => {
        return dateStr >= startStr && dateStr <= endStr;
    });
    return formatRekap('Rekap Mingguan', rangeStr, grouped, false);
}
/**
 * Get monthly rekap (16th to 15th)
 */
async function rekapBulanan() {
    const today = (0, date_1.getNow)();
    const { start, end } = (0, date_1.getMonthRange)(today);
    const rangeStr = `${(0, date_1.formatTanggalIndo)(start)} - ${(0, date_1.formatTanggalIndo)(end)}`;
    const startStr = getDateString(start);
    const endStr = getDateString(end);
    const grouped = await groupAbsensi((dateStr) => {
        return dateStr >= startStr && dateStr <= endStr;
    });
    return formatRekap('Rekap Bulanan', rangeStr, grouped, false);
}
//# sourceMappingURL=rekap.js.map