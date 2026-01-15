"use strict";
/**
 * Logging utility with colored output
 * Uses ANSI escape codes for terminal colors
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.logSuccess = logSuccess;
exports.logError = logError;
exports.logCommand = logCommand;
exports.logHeartbeat = logHeartbeat;
exports.logSchedule = logSchedule;
exports.logReminder = logReminder;
exports.logWarning = logWarning;
exports.logInfo = logInfo;
exports.logAttendance = logAttendance;
// ANSI Color codes
const colors = {
    reset: '\x1b[0m',
    gray: '\x1b[90m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};
/**
 * Get current time formatted as [HH:mm:ss]
 */
function getTimestamp() {
    const now = new Date();
    const time = now.toLocaleString('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    });
    return time;
}
/**
 * Format timestamp with gray color
 */
function formatTimestamp() {
    return `${colors.gray}[${getTimestamp()}]${colors.reset}`;
}
/**
 * Log success message (green checkmark)
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
function logSuccess(message) {
    console.log(`${formatTimestamp()} ✅ ${message}`);
}
/**
 * Log error message (red)
 * Example: [07:45] ❌ Error saving to Google Sheets
 */
function logError(message) {
    console.log(`${formatTimestamp()} ${colors.red}❌ ${message}${colors.reset}`);
}
/**
 * Log command usage
 * Example: [09:15] 📩 /cekabsen from @alfiyyann (ID: 123456789)
 */
function logCommand(command, username, userId) {
    const userDisplay = username ? `@${username}` : `User`;
    const idDisplay = userId ? ` (ID: ${userId})` : '';
    console.log(`${formatTimestamp()} 📩 /${command} from ${userDisplay}${idDisplay}`);
}
/**
 * Log heartbeat/uptime
 * Example: [12:00] 💓 Bot running • Uptime: 12h 0m • Memory: 52MB
 */
function logHeartbeat(uptime, memoryMB) {
    console.log(`${formatTimestamp()} 💓 Bot running • Uptime: ${uptime} • Memory: ${memoryMB}MB`);
}
/**
 * Log scheduled task starting
 * Example: [17:00] 📊 Running scheduled rekap harian...
 */
function logSchedule(message) {
    console.log(`${formatTimestamp()} 📊 ${message}`);
}
/**
 * Log reminder/notification
 * Example: [07:00] ⏰ Sending daily attendance reminder...
 */
function logReminder(message) {
    console.log(`${formatTimestamp()} ⏰ ${message}`);
}
/**
 * Log warning message (yellow)
 * Example: [09:30] ⚠️ Warning: High memory usage
 */
function logWarning(message) {
    console.log(`${formatTimestamp()} ${colors.yellow}⚠️ ${message}${colors.reset}`);
}
/**
 * Log info message (general)
 * Example: [07:00] 📌 Listening for messages...
 */
function logInfo(message) {
    console.log(`${formatTimestamp()} 📌 ${message}`);
}
/**
 * Log attendance success
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
function logAttendance(name) {
    console.log(`${formatTimestamp()} ✅ ${name} berhasil absen`);
}
//# sourceMappingURL=logger.js.map