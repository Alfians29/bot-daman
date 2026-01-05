import { config } from '../config';
import { getAttendanceRecords, SheetAttendanceData } from './sheets';
import {
  formatTanggalIndo,
  getNow,
  getWeekRange,
  getMonthRange,
  formatTanggal,
} from '../utils/date';

interface RekapData {
  [unit: string]: {
    [nama: string]: {
      nama: string;
      ontime: number;
      telat: number;
    };
  };
}

/**
 * Helper to get date string in YYYY-MM-DD format for comparison
 * This avoids timezone issues by comparing date strings instead of timestamps
 */
function getDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Group attendance data by filter function
 * Uses string-based date comparison to avoid timezone issues
 */
async function groupAbsensi(
  filterFn: (dateStr: string, date: Date) => boolean
): Promise<RekapData> {
  const records = await getAttendanceRecords();
  const grouped: RekapData = {};

  for (const record of records) {
    const date = new Date(record.waktu);
    const dateStr = getDateString(date);

    if (filterFn(dateStr, date)) {
      const unit = record.unit;
      if (!grouped[unit]) grouped[unit] = {};
      if (!grouped[unit][record.nama]) {
        grouped[unit][record.nama] = { nama: record.nama, ontime: 0, telat: 0 };
      }

      if (record.status === 'Ontime') grouped[unit][record.nama].ontime++;
      if (record.status === 'Telat') grouped[unit][record.nama].telat++;
    }
  }

  return grouped;
}

/**
 * Format rekap message
 */
function formatRekap(
  title: string,
  dateStr: string,
  data: RekapData,
  isHarian: boolean
): string {
  let result = `<b>📊 ${title.toUpperCase()} (${dateStr})</b>\n\n`;

  const units = Object.keys(data).sort();

  for (const unit of units) {
    const users = Object.values(data[unit]).sort((a, b) =>
      a.nama.localeCompare(b.nama)
    );
    result += `🏷️ <b>${unit.toUpperCase()}</b>\n`;

    for (const user of users) {
      if (isHarian) {
        result += `• ${user.nama}\n`;
      } else {
        const detail: string[] = [];
        if (user.ontime > 0) detail.push(`Ontime: ${user.ontime}`);
        if (user.telat > 0) detail.push(`Telat: ${user.telat}`);
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
export async function rekapHarian(): Promise<string> {
  const today = getNow();
  const todayDateStr = getDateString(today);
  const todayStr = formatTanggalIndo(today);

  const grouped = await groupAbsensi((dateStr) => {
    return dateStr === todayDateStr;
  });

  return formatRekap('Rekap Harian', todayStr, grouped, true);
}

/**
 * Get weekly rekap (Saturday to Friday)
 */
export async function rekapMingguan(): Promise<string> {
  const today = getNow();
  const { start, end } = getWeekRange(today);
  const rangeStr = `${formatTanggalIndo(start)} - ${formatTanggalIndo(end)}`;
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
export async function rekapBulanan(): Promise<string> {
  const today = getNow();
  const { start, end } = getMonthRange(today);
  const rangeStr = `${formatTanggalIndo(start)} - ${formatTanggalIndo(end)}`;
  const startStr = getDateString(start);
  const endStr = getDateString(end);

  const grouped = await groupAbsensi((dateStr) => {
    return dateStr >= startStr && dateStr <= endStr;
  });

  return formatRekap('Rekap Bulanan', rangeStr, grouped, false);
}
