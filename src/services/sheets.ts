import { google } from 'googleapis';
import { config } from '../config';
import {
  formatTanggal,
  formatJam,
  formatBulan,
  getNow,
  formatLogTimestamp,
} from '../utils/date';

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
  data: SheetAttendanceData
): Promise<void> {
  try {
    const now = getNow();
    const row = [
      formatTanggal(data.waktu) + ' ' + formatJam(data.waktu), // Waktu
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

    console.log(`${formatLogTimestamp(now)} ${data.nama} berhasil absen`);
  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error);
    throw error;
  }
}

/**
 * Check if user has already attended today (from Sheets)
 */
export async function hasAttendedTodayInSheet(
  nik: string,
  tanggal: string
): Promise<boolean> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Absensi!A:B', // Waktu and NIK columns
    });

    const rows = response.data.values || [];

    for (const row of rows) {
      const rowDate = row[0]?.toString().split(' ')[0]; // Get date part from "dd/MM/yyyy HH:mm"
      const rowNik = row[1]?.toString();

      if (rowDate === tanggal && rowNik === nik) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Error checking attendance in Sheets:', error);
    return false;
  }
}

/**
 * Get attendance records for rekap
 */
export async function getAttendanceRecords(): Promise<SheetAttendanceData[]> {
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
          /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/
        );

        if (parts) {
          waktu = new Date(
            parseInt(parts[3]), // year
            parseInt(parts[2]) - 1, // month (0-indexed)
            parseInt(parts[1]), // day
            parseInt(parts[4]), // hour
            parseInt(parts[5]), // minute
            parseInt(parts[6] || '0') // second (optional)
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

    return records;
  } catch (error) {
    console.error('Error fetching attendance records:', error);
    return [];
  }
}
