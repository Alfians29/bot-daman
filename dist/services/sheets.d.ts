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
 * Uses date parts comparison to avoid timezone/format issues
 */
export declare function hasAttendedTodayInSheet(nik: string, day: number, month: number, year: number): Promise<boolean>;
/**
 * Invalidate cache (call after new attendance is added)
 */
export declare function invalidateAttendanceCache(): void;
/**
 * Get attendance records for rekap (with caching)
 */
export declare function getAttendanceRecords(): Promise<SheetAttendanceData[]>;
/**
 * Update attendance record in Google Sheets
 */
export declare function updateAttendanceInSheet(nik: string, tanggal: string, updates: {
    jadwalMasuk?: string;
    keterangan?: string;
    status?: string;
}): Promise<boolean>;
//# sourceMappingURL=sheets.d.ts.map