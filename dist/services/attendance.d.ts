import { SheetAttendanceData } from './sheets';
import { ShiftType } from '@prisma/client';
/**
 * Combined user data for bot (from User or TelegramUser table)
 */
export interface BotUserData {
    id: string;
    usernameTelegram: string;
    nik: string;
    nama: string;
    unit: string;
    source: 'USER' | 'TELEGRAM_USER';
}
/**
 * TelegramCommand data with ShiftSetting info
 */
export interface TelegramCommandData {
    id: string;
    unit: string;
    command: string;
    shiftName: string;
    startTime: string | null;
    endTime: string | null;
    lateAfter: string | null;
}
/**
 * Find user by Telegram username
 * First tries User table (for Daman), then TelegramUser table (for SDI)
 */
export declare function findUserByTelegram(username: string): Promise<BotUserData | null>;
/**
 * Get command/jadwal by unit and command (includes ShiftSetting data)
 * For SDI: returns hardcoded schedule (no ShiftSetting relation)
 * For Daman: returns data from ShiftSetting relation
 */
export declare function getCommandByUnitAndCommand(unit: string, command: string): Promise<TelegramCommandData | null>;
/**
 * Get all valid commands for a unit
 */
export declare function getValidCommandsForUnit(unit: string): Promise<string[]>;
/**
 * Check if user has already attended today
 * Always uses spreadsheet as the source of truth for ALL users
 */
export declare function hasAttendedToday(user: BotUserData): Promise<boolean>;
/**
 * Normalize command for comparison
 */
export declare function normalizeCommand(cmd: string): string;
/**
 * Map command to ShiftType
 */
export declare function commandToShiftType(command: string): ShiftType;
/**
 * Validate if command is valid for user's unit
 */
export declare function validateCommand(user: BotUserData, command: string): Promise<boolean>;
/**
 * Record attendance result
 */
export interface AttendanceResult {
    success: boolean;
    message: string;
    data?: {
        nama: string;
        tanggal: string;
        jamAbsen: string;
        status: 'Ontime' | 'Telat';
    };
}
/**
 * Record attendance for a user
 */
export declare function recordAttendance(user: BotUserData, command: string, photoUrl: string, telegramMessageId?: string, telegramChatId?: string): Promise<AttendanceResult>;
/**
 * Get today's attendance for a user (for /cekabsen)
 * Always uses spreadsheet as the source of truth for ALL users
 */
export declare function getTodayAttendance(user: BotUserData): Promise<SheetAttendanceData | null>;
//# sourceMappingURL=attendance.d.ts.map