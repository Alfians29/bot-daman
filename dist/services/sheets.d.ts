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
export declare function appendAttendance(data: SheetAttendanceData): Promise<void>;
/**
 * Check if user has already attended today (from Sheets)
 */
export declare function hasAttendedTodayInSheet(nik: string, tanggal: string): Promise<boolean>;
/**
 * Get attendance records for rekap
 */
export declare function getAttendanceRecords(): Promise<SheetAttendanceData[]>;
/**
 * Update attendance record in Google Sheets
 */
export declare function updateAttendanceInSheet(nik: string, tanggal: string, updates: {
    jadwalMasuk?: string;
    keterangan?: string;
}): Promise<boolean>;
//# sourceMappingURL=sheets.d.ts.map