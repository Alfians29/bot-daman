import { randomUUID } from 'crypto';
import { prisma } from '../lib/prisma';
import { config } from '../config';
import {
  getNow,
  formatTanggal,
  formatJam,
  formatBulan,
  isLate,
  isLateByTime,
  getTodayStart,
  formatLogTimestamp,
} from '../utils/date';
import {
  appendAttendance,
  hasAttendedTodayInSheet,
  SheetAttendanceData,
} from './sheets';
import { ShiftType, AttendanceStatus, AttendanceSource } from '@prisma/client';

/**
 * Combined user data for bot (from User or TelegramUser table)
 */
export interface BotUserData {
  id: string; // User.id for Daman, TelegramUser.id for SDI
  usernameTelegram: string;
  nik: string;
  nama: string;
  unit: string; // "Daman" or "SDI"
  source: 'USER' | 'TELEGRAM_USER'; // Which table data came from
}

/**
 * TelegramCommand data with ShiftSetting info
 */
export interface TelegramCommandData {
  id: string;
  unit: string;
  command: string;
  // From ShiftSetting relation
  shiftName: string; // "Pagi", "Malam", etc
  startTime: string | null; // "07:30"
  endTime: string | null; // "16:30"
  lateAfter: string | null; // "07:35"
}

/**
 * Find user by Telegram username
 * First tries User table (for Daman), then TelegramUser table (for SDI)
 */
export async function findUserByTelegram(
  username: string,
): Promise<BotUserData | null> {
  // Normalize username (ensure it starts with @)
  const normalizedUsername = username.startsWith('@')
    ? username
    : `@${username}`;

  // First, try to find in User table (Daman users)
  const user = await prisma.user.findFirst({
    where: {
      usernameTelegram: normalizedUsername,
      isActive: true,
    },
  });

  if (user) {
    return {
      id: user.id,
      usernameTelegram: normalizedUsername,
      nik: user.nik,
      nama: user.name,
      unit: 'Daman', // Users in User table are Daman
      source: 'USER',
    };
  }

  // If not found, try TelegramUser table (SDI users)
  const telegramUser = await prisma.telegramUser.findUnique({
    where: { usernameTelegram: normalizedUsername },
  });

  if (telegramUser) {
    return {
      id: telegramUser.id,
      usernameTelegram: normalizedUsername,
      nik: telegramUser.nik,
      nama: telegramUser.nama,
      unit: telegramUser.unit,
      source: 'TELEGRAM_USER',
    };
  }

  return null;
}

/**
 * Get command/jadwal by unit and command (includes ShiftSetting data)
 */
export async function getCommandByUnitAndCommand(
  unit: string,
  command: string,
): Promise<TelegramCommandData | null> {
  const normalizedCmd = normalizeCommand(command);

  const cmd = await prisma.telegramCommand.findFirst({
    where: {
      unit: unit,
      command: normalizedCmd,
      isActive: true,
    },
    include: {
      shiftSetting: true,
    },
  });

  if (!cmd || !cmd.shiftSetting) return null;

  return {
    id: cmd.id,
    unit: cmd.unit,
    command: cmd.command,
    shiftName: cmd.shiftSetting.name,
    startTime: cmd.shiftSetting.startTime,
    endTime: cmd.shiftSetting.endTime,
    lateAfter: cmd.shiftSetting.lateAfter,
  };
}

/**
 * Get all valid commands for a unit
 */
export async function getValidCommandsForUnit(unit: string): Promise<string[]> {
  const commands = await prisma.telegramCommand.findMany({
    where: { unit, isActive: true },
    select: { command: true },
  });

  return commands.map((c) => c.command);
}

/**
 * Check if user has already attended today
 */
export async function hasAttendedToday(user: BotUserData): Promise<boolean> {
  const today = getTodayStart();
  const todayStr = formatTanggal(today);

  // For Daman users (from User table), check database
  if (user.source === 'USER') {
    const existing = await prisma.attendance.findFirst({
      where: {
        memberId: user.id,
        tanggal: today,
      },
    });
    return !!existing;
  }

  // For SDI users, check spreadsheet
  return await hasAttendedTodayInSheet(user.nik, todayStr);
}

/**
 * Normalize command for comparison
 */
export function normalizeCommand(cmd: string): string {
  return cmd
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/@\w+/g, '') // Remove @botname
    .replace('_', ''); // /piket_pagi -> /piketpagi
}

/**
 * Map command to ShiftType
 */
export function commandToShiftType(command: string): ShiftType {
  const cmd = normalizeCommand(command);

  switch (cmd) {
    case '/pagi':
      return ShiftType.PAGI;
    case '/malam':
      return ShiftType.MALAM;
    case '/piketpagi':
      return ShiftType.PIKET_PAGI;
    case '/piketmalam':
      return ShiftType.PIKET_MALAM;
    case '/piket':
      return ShiftType.PIKET_PAGI; // SDI piket
    case '/pagimalam':
      return ShiftType.PAGI_MALAM;
    case '/libur':
      return ShiftType.LIBUR;
    default:
      return ShiftType.PAGI;
  }
}

/**
 * Validate if command is valid for user's unit
 */
export async function validateCommand(
  user: BotUserData,
  command: string,
): Promise<boolean> {
  const validCommands = await getValidCommandsForUnit(user.unit);
  const normalizedInputCmd = normalizeCommand(command);

  return validCommands.some(
    (cmd) => normalizeCommand(cmd) === normalizedInputCmd,
  );
}

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
export async function recordAttendance(
  user: BotUserData,
  command: string,
  photoUrl: string,
  telegramMessageId?: string,
  telegramChatId?: string,
): Promise<AttendanceResult> {
  const now = getNow();
  const tanggalStr = formatTanggal(now);
  const jamAbsen = formatJam(now);
  const bulan = formatBulan(now);

  // Get command data from TelegramCommand table (includes ShiftSetting)
  const cmdData = await getCommandByUnitAndCommand(user.unit, command);
  const normalizedCmd = normalizeCommand(command);

  // SDI uses fixed schedule: 07:30-17:00 WIB for both /pagi and /piket
  // Daman uses ShiftSetting from database
  let startTime: string;
  let endTime: string;
  let lateAfter: string;
  let keterangan: string;

  if (user.unit === 'SDI') {
    // SDI fixed schedule - different for /pagi and /piket
    if (normalizedCmd === '/piket') {
      startTime = '08:00';
      endTime = '17:00';
      lateAfter = '08:06';
      keterangan = 'Piket';
    } else {
      // /pagi
      startTime = '07:30';
      endTime = '17:00';
      lateAfter = '07:36';
      keterangan = 'Pagi';
    }
  } else {
    // Daman from ShiftSetting
    startTime = cmdData?.startTime || '07:30';
    endTime = cmdData?.endTime || '16:30';
    lateAfter = cmdData?.lateAfter || startTime;
    keterangan = cmdData?.shiftName || 'Pagi';
  }

  const jadwal = `${startTime}-${endTime} WIB`;

  // For spreadsheet: use 'Pagi' for /pagimalam command
  const sheetKeterangan = normalizedCmd === '/pagimalam' ? 'Pagi' : keterangan;

  // Calculate status using lateAfter time
  const late = isLateByTime(now, lateAfter);
  const status = late ? 'Telat' : 'Ontime';

  // Sheet data (for all users)
  const sheetData: SheetAttendanceData = {
    waktu: now,
    nik: user.nik,
    nama: user.nama,
    jadwalMasuk: jadwal,
    keterangan: sheetKeterangan,
    linkFoto: photoUrl,
    jamAbsen: jamAbsen,
    status: status,
    unit: user.unit,
    bulan: bulan,
  };

  try {
    // Save to Google Sheets (for all users)
    await appendAttendance(sheetData);

    // Save to PostgreSQL (only for Daman users from User table)
    if (user.source === 'USER') {
      const today = getTodayStart();
      const shiftType = commandToShiftType(command);

      await prisma.attendance.create({
        data: {
          id: randomUUID(),
          memberId: user.id, // This is the User.id from User table
          tanggal: today,
          jamAbsen: jamAbsen,
          keterangan: shiftType,
          status: late ? AttendanceStatus.TELAT : AttendanceStatus.ONTIME,
          usernameTelegram: user.usernameTelegram,
          source: AttendanceSource.TELEGRAM_BOT,
          telegramMessageId: telegramMessageId,
          telegramChatId: telegramChatId,
          photoUrl: photoUrl,
        },
      });
    }

    return {
      success: true,
      message: '✅ <b>Absensi Berhasil!</b>',
      data: {
        nama: user.nama,
        tanggal: tanggalStr,
        jamAbsen: jamAbsen,
        status: status,
      },
    };
  } catch (error) {
    console.error('❌ Error recording attendance:', error);
    return {
      success: false,
      message: '❌ <b>Gagal menyimpan absensi.</b> Silakan coba lagi.',
    };
  }
}

/**
 * Get today's attendance for a user (for /cekabsen)
 */
export async function getTodayAttendance(
  user: BotUserData,
): Promise<SheetAttendanceData | null> {
  const today = getTodayStart();
  const todayStr = formatTanggal(today);

  // For Daman users, check database first
  if (user.source === 'USER') {
    const record = await prisma.attendance.findFirst({
      where: {
        memberId: user.id,
        tanggal: today,
      },
    });

    if (record) {
      return {
        waktu: record.createdAt,
        nik: user.nik,
        nama: user.nama,
        jadwalMasuk: '07.30-16.30 WIB', // Default
        keterangan: record.keterangan,
        linkFoto: record.photoUrl || '',
        jamAbsen: record.jamAbsen,
        status: record.status === 'ONTIME' ? 'Ontime' : 'Telat',
        unit: user.unit,
        bulan: formatBulan(record.tanggal),
      };
    }
  }

  // For SDI users or if not found in DB, check spreadsheet
  const { getAttendanceRecords } = await import('./sheets');
  const records = await getAttendanceRecords();

  return (
    records.find(
      (r) => r.nik === user.nik && formatTanggal(r.waktu) === todayStr,
    ) || null
  );
}
