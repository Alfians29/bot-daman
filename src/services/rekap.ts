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
 * Group attendance data by filter function
 */
async function groupAbsensi(
  filterFn: (date: Date) => boolean
): Promise<RekapData> {
  const records = await getAttendanceRecords();
  const grouped: RekapData = {};

  for (const record of records) {
    const date = new Date(record.waktu);
    date.setHours(0, 0, 0, 0);

    if (filterFn(date)) {
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
  today.setHours(0, 0, 0, 0);
  const todayStr = formatTanggalIndo(today);

  const grouped = await groupAbsensi((d) => {
    const dd = new Date(d);
    dd.setHours(0, 0, 0, 0);
    return dd.getTime() === today.getTime();
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

  const grouped = await groupAbsensi((d) => d >= start && d <= end);

  return formatRekap('Rekap Mingguan', rangeStr, grouped, false);
}

/**
 * Get monthly rekap (16th to 15th)
 */
export async function rekapBulanan(): Promise<string> {
  const today = getNow();
  const { start, end } = getMonthRange(today);
  const rangeStr = `${formatTanggalIndo(start)} - ${formatTanggalIndo(end)}`;

  const grouped = await groupAbsensi((d) => d >= start && d <= end);

  return formatRekap('Rekap Bulanan', rangeStr, grouped, false);
}
