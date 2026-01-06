import { format, parse, isAfter, addMinutes } from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { config } from '../config';

const TIMEZONE = config.TIMEZONE;

/**
 * Get current time in Jakarta timezone
 */
export function getNow(): Date {
  return toZonedTime(new Date(), TIMEZONE);
}

/**
 * Format date to Indonesian format: "18 Des 2025"
 */
export function formatTanggalIndo(date: Date): string {
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
export function formatTanggal(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'dd/MM/yyyy');
}

/**
 * Format time to "HH:mm"
 */
export function formatJam(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'HH:mm');
}

/**
 * Format timestamp for console logs: "[YYYY-MM-DD HH:mm:ss]"
 */
export function formatLogTimestamp(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, '[yyyy-MM-dd HH:mm:ss]');
}

/**
 * Format date to "MMMM yyyy" (month year)
 */
export function formatBulan(date: Date): string {
  return formatInTimeZone(date, TIMEZONE, 'MMMM yyyy');
}

/**
 * Get today's date at midnight in Jakarta timezone (for PostgreSQL date storage)
 * Uses UTC noon to avoid timezone conversion shifting the date
 */
export function getTodayStart(): Date {
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
export function parseJadwalToDeadline(
  jadwal: string,
  toleranceMinutes: number = 5
): Date {
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
  return addMinutes(deadline, toleranceMinutes);
}

/**
 * Check if check-in time is late based on jadwal
 */
export function isLate(checkInTime: Date, jadwal: string): boolean {
  const deadline = parseJadwalToDeadline(jadwal, config.LATE_TOLERANCE_MINUTES);
  return isAfter(checkInTime, deadline);
}

/**
 * Check if check-in time is late based on specific time string (HH:mm format)
 * Used for ShiftSetting.lateAfter field
 */
export function isLateByTime(
  checkInTime: Date,
  lateAfterTime: string
): boolean {
  const now = getNow();

  // Parse "07:35" or "07.35" -> { hour: 7, minute: 35 }
  const separator = lateAfterTime.includes(':') ? ':' : '.';
  const [hourStr, minuteStr] = lateAfterTime.split(separator);
  const hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr || '0', 10);

  // Create deadline date
  const deadline = new Date(now);
  deadline.setHours(hour, minute, 0, 0);

  return isAfter(checkInTime, deadline);
}

/**
 * Format full date for display: "18 Desember 2025"
 */
export function formatTanggalFull(date: Date): string {
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
export function getWeekRange(date: Date): { start: Date; end: Date } {
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
export function getMonthRange(date: Date): { start: Date; end: Date } {
  let start: Date;
  let end: Date;

  if (date.getDate() >= 16) {
    start = new Date(date.getFullYear(), date.getMonth(), 16);
    end = new Date(date.getFullYear(), date.getMonth() + 1, 15);
  } else {
    start = new Date(date.getFullYear(), date.getMonth() - 1, 16);
    end = new Date(date.getFullYear(), date.getMonth(), 15);
  }

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return { start, end };
}
