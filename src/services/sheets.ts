import { google } from 'googleapis';
import { formatInTimeZone } from 'date-fns-tz';
import { config } from '../config';
import { formatTanggal } from '../utils/date';
import { logAttendance, logError } from '../utils/logger';

// Google Sheets API setup
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: config.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: config.GOOGLE_PRIVATE_KEY,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });
const SPREADSHEET_ID = config.GOOGLE_SHEETS_ID;

/**
 * Attendance data for spreadsheet
 */
export interface SheetAttendanceData {
  waktu: Date;
  nik: string;
  nama: string;
  jadwalMasuk: string;
  keterangan: string;
  linkFoto: string;
  jamAbsen: string;
  status: string;
  unit: string;
  bulan: string;
}

/**
 * Append attendance record to Google Sheets
 */
export async function appendAttendance(
  data: SheetAttendanceData,
): Promise<void> {
  try {
    const row = [
      formatTanggal(data.waktu) +
        ' ' +
        formatInTimeZone(data.waktu, 'Asia/Jakarta', 'H:mm:ss'), // Waktu with seconds
      data.nik, // NIK
      data.nama, // Nama
      data.jadwalMasuk, // Jadwal Masuk
      data.keterangan, // Keterangan
      data.linkFoto, // Link Foto
      data.jamAbsen, // Jam Absen
      data.status, // Status
      data.unit, // Unit
      data.bulan, // Bulan
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    // Invalidate cache after adding new attendance
    invalidateAttendanceCache();

    logAttendance(data.nama);
  } catch (error) {
    logError('Error saving to Google Sheets: ' + error);
    throw error;
  }
}

/**
 * Check if user has already attended today (from Sheets)
 * Uses date parts comparison to avoid timezone/format issues
 */
export async function hasAttendedTodayInSheet(
  nik: string,
  day: number,
  month: number,
  year: number,
): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:B', // Waktu and NIK columns
    });

    const rows = response.data.values || [];

    for (const row of rows) {
      const rowNik = row[1]?.toString();
      if (rowNik !== nik) continue;

      // Parse date from "dd/MM/yyyy HH:mm" format
      const waktuStr = row[0]?.toString() || '';
      const dateParts = waktuStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);

      if (dateParts) {
        const rowDay = parseInt(dateParts[1], 10);
        const rowMonth = parseInt(dateParts[2], 10);
        const rowYear = parseInt(dateParts[3], 10);

        if (rowDay === day && rowMonth === month && rowYear === year) {
          return true;
        }
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking attendance in Sheets:', error);
    return false;
  }
}

// ============================================
// CACHE MECHANISM
// ============================================

interface CacheData {
  records: SheetAttendanceData[];
  timestamp: number;
}

// Simple in-memory cache (3 minutes TTL)
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes
let attendanceCache: CacheData | null = null;

/**
 * Invalidate cache (call after new attendance is added)
 */
export function invalidateAttendanceCache(): void {
  attendanceCache = null;
}

/**
 * Get attendance records for rekap (with caching)
 */
export async function getAttendanceRecords(): Promise<SheetAttendanceData[]> {
  // Check if cache is valid
  if (
    attendanceCache &&
    Date.now() - attendanceCache.timestamp < CACHE_TTL_MS
  ) {
    return attendanceCache.records;
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:J',
    });

    const rows = response.data.values || [];
    const records: SheetAttendanceData[] = [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length < 9) continue;

      // Parse date - ALWAYS parse DD/MM/YYYY format explicitly
      // Note: new Date("06/01/2026") wrongly interprets as June 1 (MM/DD) instead of Jan 6 (DD/MM)
      let waktu: Date;
      try {
        const waktuStr = row[0]?.toString() || '';

        // Try DD/MM/YYYY HH:mm:ss or DD/MM/YYYY HH:mm format first
        const parts = waktuStr.match(
          /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/,
        );

        if (parts) {
          waktu = new Date(
            parseInt(parts[3]), // year
            parseInt(parts[2]) - 1, // month (0-indexed)
            parseInt(parts[1]), // day
            parseInt(parts[4]), // hour
            parseInt(parts[5]), // minute
            parseInt(parts[6] || '0'), // second (optional)
          );
        } else {
          // Fallback for ISO format (YYYY-MM-DD)
          waktu = new Date(waktuStr);
        }
      } catch {
        continue;
      }

      if (isNaN(waktu.getTime())) continue;

      records.push({
        waktu,
        nik: row[1] || '',
        nama: row[2] || '',
        jadwalMasuk: row[3] || '',
        keterangan: row[4] || '',
        linkFoto: row[5] || '',
        jamAbsen: row[6] || '',
        status: row[7] || '',
        unit: row[8] || '',
        bulan: row[9] || '',
      });
    }

    // Update cache
    attendanceCache = {
      records,
      timestamp: Date.now(),
    };

    return records;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
}

/**
 * Update attendance record in Google Sheets
 */
export async function updateAttendanceInSheet(
  nik: string,
  tanggal: string,
  updates: { jadwalMasuk?: string; keterangan?: string; status?: string },
): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:J',
    });

    const rows = response.data.values || [];
    let rowIndex = -1;

    // Find the row with matching NIK and date
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      const rowDate = row[0]?.toString().split(' ')[0]; // Get date part
      const rowNik = row[1]?.toString();

      if (rowDate === tanggal && rowNik === nik) {
        rowIndex = i + 1; // +1 because sheets are 1-indexed
        break;
      }
    }

    if (rowIndex === -1) {
      console.error('Row not found for update');
      return false;
    }

    // Prepare update data
    const updateData: any[][] = [];
    const updateRanges: string[] = [];

    if (updates.jadwalMasuk) {
      updateRanges.push(`Absensi!D${rowIndex}`);
      updateData.push([[updates.jadwalMasuk]]);
    }

    if (updates.keterangan) {
      updateRanges.push(`Absensi!E${rowIndex}`);
      updateData.push([[updates.keterangan]]);
    }

    if (updates.status) {
      updateRanges.push(`Absensi!H${rowIndex}`);
      updateData.push([[updates.status]]);
    }

    // Batch update
    for (let i = 0; i < updateRanges.length; i++) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: updateRanges[i],
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: updateData[i],
        },
      });
    }

    // Invalidate cache after update so /cekabsen reads fresh data
    invalidateAttendanceCache();

    return true;
  } catch (error) {
    console.error('Error updating attendance in Sheets:', error);
    return false;
  }
}
