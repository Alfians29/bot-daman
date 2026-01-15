/**
 * Logging utility with colored output
 * Uses ANSI escape codes for terminal colors
 */

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
function getTimestamp(): string {
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
function formatTimestamp(): string {
  return `${colors.gray}[${getTimestamp()}]${colors.reset}`;
}

/**
 * Log success message (green checkmark)
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
export function logSuccess(message: string): void {
  console.log(`${formatTimestamp()} ✅ ${message}`);
}

/**
 * Log error message (red)
 * Example: [07:45] ❌ Error saving to Google Sheets
 */
export function logError(message: string): void {
  console.log(`${formatTimestamp()} ${colors.red}❌ ${message}${colors.reset}`);
}

/**
 * Log command usage
 * Example: [09:15] 📩 /cekabsen from @alfiyyann (ID: 123456789)
 */
export function logCommand(
  command: string,
  username?: string,
  userId?: number
): void {
  const userDisplay = username ? `@${username}` : `User`;
  const idDisplay = userId ? ` (ID: ${userId})` : '';
  console.log(
    `${formatTimestamp()} 📩 /${command} from ${userDisplay}${idDisplay}`
  );
}

/**
 * Log heartbeat/uptime
 * Example: [12:00] 💓 Bot running • Uptime: 12h 0m • Memory: 52MB
 */
export function logHeartbeat(uptime: string, memoryMB: number): void {
  console.log(
    `${formatTimestamp()} 💓 Bot running • Uptime: ${uptime} • Memory: ${memoryMB}MB`
  );
}

/**
 * Log scheduled task starting
 * Example: [17:00] 📊 Running scheduled rekap harian...
 */
export function logSchedule(message: string): void {
  console.log(`${formatTimestamp()} 📊 ${message}`);
}

/**
 * Log reminder/notification
 * Example: [07:00] ⏰ Sending daily attendance reminder...
 */
export function logReminder(message: string): void {
  console.log(`${formatTimestamp()} ⏰ ${message}`);
}

/**
 * Log warning message (yellow)
 * Example: [09:30] ⚠️ Warning: High memory usage
 */
export function logWarning(message: string): void {
  console.log(
    `${formatTimestamp()} ${colors.yellow}⚠️ ${message}${colors.reset}`
  );
}

/**
 * Log info message (general)
 * Example: [07:00] 📌 Listening for messages...
 */
export function logInfo(message: string): void {
  console.log(`${formatTimestamp()} 📌 ${message}`);
}

/**
 * Log attendance success
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
export function logAttendance(name: string): void {
  console.log(`${formatTimestamp()} ✅ ${name} berhasil absen`);
}
