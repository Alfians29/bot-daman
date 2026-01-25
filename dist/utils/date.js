"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNow = getNow;
exports.formatTanggalIndo = formatTanggalIndo;
exports.formatTanggal = formatTanggal;
exports.formatJam = formatJam;
exports.formatLogTimestamp = formatLogTimestamp;
exports.formatBulan = formatBulan;
exports.getTodayStart = getTodayStart;
exports.parseJadwalToDeadline = parseJadwalToDeadline;
exports.isLate = isLate;
exports.isLateByTime = isLateByTime;
exports.isLateByTimeString = isLateByTimeString;
exports.formatTanggalFull = formatTanggalFull;
exports.getWeekRange = getWeekRange;
exports.getMonthRange = getMonthRange;
const date_fns_1 = require("date-fns");
const date_fns_tz_1 = require("date-fns-tz");
const config_1 = require("../config");
const TIMEZONE = config_1.config.TIMEZONE;
/**
 * Get current time in Jakarta timezone
 */
function getNow() {
    return (0, date_fns_tz_1.toZonedTime)(new Date(), TIMEZONE);
}
/**
 * Format date to Indonesian format: "18 Des 2025"
 */
function formatTanggalIndo(date) {
    const bulan = [
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mei',
        'Jun',
        'Jul',
        'Agu',
        'Sep',
        'Okt',
        'Nov',
        'Des',
    ];
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}
/**
 * Format date to "dd/MM/yyyy"
 */
function formatTanggal(date) {
    return (0, date_fns_tz_1.formatInTimeZone)(date, TIMEZONE, 'dd/MM/yyyy');
}
/**
 * Format time to "HH:mm"
 */
function formatJam(date) {
    return (0, date_fns_tz_1.formatInTimeZone)(date, TIMEZONE, 'HH:mm');
}
/**
 * Format timestamp for console logs: "[YYYY-MM-DD HH:mm:ss]"
 * Uses grey color to differentiate from message text
 */
function formatLogTimestamp(date) {
    const timestamp = (0, date_fns_tz_1.formatInTimeZone)(date, TIMEZONE, '[yyyy-MM-dd HH:mm:ss]');
    // ANSI escape code: \x1b[90m = grey, \x1b[0m = reset
    return `\x1b[90m${timestamp}\x1b[0m`;
}
/**
 * Format date to "MMMM yyyy" (month year)
 */
function formatBulan(date) {
    return (0, date_fns_tz_1.formatInTimeZone)(date, TIMEZONE, 'MMMM yyyy');
}
/**
 * Get today's date at midnight in Jakarta timezone (for PostgreSQL date storage)
 * Uses UTC noon to avoid timezone conversion shifting the date
 */
function getTodayStart() {
    const now = getNow(); // Jakarta time
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    // Create date using UTC at noon to avoid day boundary issues
    return new Date(Date.UTC(year, month, day, 12, 0, 0, 0));
}
/**
 * Parse jadwal time string like "07.30-16.30 WIB" to get start time
 * Returns the deadline time with tolerance
 */
function parseJadwalToDeadline(jadwal, toleranceMinutes = 5) {
    const now = getNow();
    // Extract start time from "07.30-16.30 WIB" -> "07.30"
    const startTimeStr = jadwal.split('-')[0].trim();
    // Parse "07.30" -> { hour: 7, minute: 30 }
    const [hourStr, minuteStr] = startTimeStr.split('.');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || '0', 10);
    // Create deadline date
    const deadline = new Date(now);
    deadline.setHours(hour, minute, 0, 0);
    // Add tolerance
    return (0, date_fns_1.addMinutes)(deadline, toleranceMinutes);
}
/**
 * Check if check-in time is late based on jadwal
 */
function isLate(checkInTime, jadwal) {
    const deadline = parseJadwalToDeadline(jadwal, config_1.config.LATE_TOLERANCE_MINUTES);
    return (0, date_fns_1.isAfter)(checkInTime, deadline);
}
/**
 * Check if check-in time is late based on specific time string (HH:mm format)
 * Used for ShiftSetting.lateAfter field
 */
function isLateByTime(checkInTime, lateAfterTime) {
    const now = getNow();
    // Parse "07:35" or "07.35" -> { hour: 7, minute: 35 }
    const separator = lateAfterTime.includes(':') ? ':' : '.';
    const [hourStr, minuteStr] = lateAfterTime.split(separator);
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr || '0', 10);
    // Create deadline date
    const deadline = new Date(now);
    deadline.setHours(hour, minute, 0, 0);
    return (0, date_fns_1.isAfter)(checkInTime, deadline);
}
/**
 * Check if jam absen string is late compared to lateAfter time string
 * Used for recalculating status when editing attendance
 * @param jamAbsen - Check-in time string like "8:02" or "08:02"
 * @param lateAfterTime - Late threshold time string like "08:06"
 * @returns true if jamAbsen is at or after lateAfterTime
 */
function isLateByTimeString(jamAbsen, lateAfterTime) {
    // Parse jam absen (e.g., "8:02" or "08:02")
    const jamSeparator = jamAbsen.includes(':') ? ':' : '.';
    const [jamHourStr, jamMinuteStr] = jamAbsen.split(jamSeparator);
    const jamHour = parseInt(jamHourStr, 10);
    const jamMinute = parseInt(jamMinuteStr || '0', 10);
    // Parse lateAfter time (e.g., "08:06")
    const lateSeparator = lateAfterTime.includes(':') ? ':' : '.';
    const [lateHourStr, lateMinuteStr] = lateAfterTime.split(lateSeparator);
    const lateHour = parseInt(lateHourStr, 10);
    const lateMinute = parseInt(lateMinuteStr || '0', 10);
    // Convert to minutes for easy comparison
    const jamTotalMinutes = jamHour * 60 + jamMinute;
    const lateTotalMinutes = lateHour * 60 + lateMinute;
    // Late if jam absen is at or after lateAfter time
    return jamTotalMinutes >= lateTotalMinutes;
}
/**
 * Format full date for display: "18 Desember 2025"
 */
function formatTanggalFull(date) {
    const bulan = [
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
    return `${date.getDate()} ${bulan[date.getMonth()]} ${date.getFullYear()}`;
}
/**
 * Get week range (Saturday to Friday)
 */
function getWeekRange(date) {
    const day = date.getDay(); // Sunday=0, Saturday=6
    const offset = (day + 1) % 7; // If Saturday -> offset=0
    const start = new Date(date);
    start.setDate(date.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
/**
 * Get month range (16th to 15th)
 */
function getMonthRange(date) {
    let start;
    let end;
    if (date.getDate() >= 16) {
        start = new Date(date.getFullYear(), date.getMonth(), 16);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 15);
    }
    else {
        start = new Date(date.getFullYear(), date.getMonth() - 1, 16);
        end = new Date(date.getFullYear(), date.getMonth(), 15);
    }
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
}
//# sourceMappingURL=date.js.map