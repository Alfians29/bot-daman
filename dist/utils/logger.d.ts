/**
 * Logging utility with colored output
 * Uses ANSI escape codes for terminal colors
 */
/**
 * Log success message (green checkmark)
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
export declare function logSuccess(message: string): void;
/**
 * Log error message (red)
 * Example: [07:45] ❌ Error saving to Google Sheets
 */
export declare function logError(message: string): void;
/**
 * Log command usage
 * Example: [09:15] 📩 /cekabsen from @alfiyyann (ID: 123456789)
 */
export declare function logCommand(command: string, username?: string, userId?: number): void;
/**
 * Log heartbeat/uptime
 * Example: [12:00] 💓 Bot running • Uptime: 12h 0m • Memory: 52MB
 */
export declare function logHeartbeat(uptime: string, memoryMB: number): void;
/**
 * Log scheduled task starting
 * Example: [17:00] 📊 Running scheduled rekap harian...
 */
export declare function logSchedule(message: string): void;
/**
 * Log reminder/notification
 * Example: [07:00] ⏰ Sending daily attendance reminder...
 */
export declare function logReminder(message: string): void;
/**
 * Log warning message (yellow)
 * Example: [09:30] ⚠️ Warning: High memory usage
 */
export declare function logWarning(message: string): void;
/**
 * Log info message (general)
 * Example: [07:00] 📌 Listening for messages...
 */
export declare function logInfo(message: string): void;
/**
 * Log attendance success
 * Example: [07:15] ✅ Ahmad Fauzi berhasil absen
 */
export declare function logAttendance(name: string): void;
//# sourceMappingURL=logger.d.ts.map