/**
 * Get current time in Jakarta timezone
 */
export declare function getNow(): Date;
/**
 * Format date to Indonesian format: "18 Des 2025"
 */
export declare function formatTanggalIndo(date: Date): string;
/**
 * Format date to "dd/MM/yyyy"
 */
export declare function formatTanggal(date: Date): string;
/**
 * Format time to "HH:mm"
 */
export declare function formatJam(date: Date): string;
/**
 * Format timestamp for console logs: "[YYYY-MM-DD HH:mm:ss]"
 * Uses grey color to differentiate from message text
 */
export declare function formatLogTimestamp(date: Date): string;
/**
 * Format date to "MMMM yyyy" (month year)
 */
export declare function formatBulan(date: Date): string;
/**
 * Get today's date at midnight in Jakarta timezone (for PostgreSQL date storage)
 * Uses UTC noon to avoid timezone conversion shifting the date
 */
export declare function getTodayStart(): Date;
/**
 * Parse jadwal time string like "07.30-16.30 WIB" to get start time
 * Returns the deadline time with tolerance
 */
export declare function parseJadwalToDeadline(jadwal: string, toleranceMinutes?: number): Date;
/**
 * Check if check-in time is late based on jadwal
 */
export declare function isLate(checkInTime: Date, jadwal: string): boolean;
/**
 * Check if check-in time is late based on specific time string (HH:mm format)
 * Used for ShiftSetting.lateAfter field
 */
export declare function isLateByTime(checkInTime: Date, lateAfterTime: string): boolean;
/**
 * Format full date for display: "18 Desember 2025"
 */
export declare function formatTanggalFull(date: Date): string;
/**
 * Get week range (Saturday to Friday)
 */
export declare function getWeekRange(date: Date): {
    start: Date;
    end: Date;
};
/**
 * Get month range (16th to 15th)
 */
export declare function getMonthRange(date: Date): {
    start: Date;
    end: Date;
};
//# sourceMappingURL=date.d.ts.map