"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.findUserByTelegram = findUserByTelegram;
exports.getCommandByUnitAndCommand = getCommandByUnitAndCommand;
exports.getValidCommandsForUnit = getValidCommandsForUnit;
exports.hasAttendedToday = hasAttendedToday;
exports.normalizeCommand = normalizeCommand;
exports.commandToShiftType = commandToShiftType;
exports.validateCommand = validateCommand;
exports.recordAttendance = recordAttendance;
exports.getTodayAttendance = getTodayAttendance;
const crypto_1 = require("crypto");
const prisma_1 = require("../lib/prisma");
const date_1 = require("../utils/date");
const sheets_1 = require("./sheets");
const client_1 = require("@prisma/client");
/**
 * Find user by Telegram username
 * First tries User table (for Daman), then TelegramUser table (for SDI)
 */
async function findUserByTelegram(username) {
    // Normalize username (ensure it starts with @)
    const normalizedUsername = username.startsWith('@')
        ? username
        : `@${username}`;
    // First, try to find in User table (Daman users)
    const user = await prisma_1.prisma.user.findFirst({
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
    const telegramUser = await prisma_1.prisma.telegramUser.findUnique({
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
 * For SDI: returns hardcoded schedule (no ShiftSetting relation)
 * For Daman: returns data from ShiftSetting relation
 */
async function getCommandByUnitAndCommand(unit, command) {
    const normalizedCmd = normalizeCommand(command);
    // For SDI: query without shiftSetting relation (shiftSettingId is NULL)
    // and return hardcoded schedule data
    if (unit === 'SDI') {
        const cmd = await prisma_1.prisma.telegramCommand.findFirst({
            where: {
                unit: unit,
                command: normalizedCmd,
                isActive: true,
            },
        });
        if (!cmd)
            return null;
        // SDI hardcoded schedules
        if (normalizedCmd === '/piket') {
            return {
                id: cmd.id,
                unit: cmd.unit,
                command: cmd.command,
                shiftName: 'Piket',
                startTime: '08:00',
                endTime: '17:00',
                lateAfter: '08:06',
            };
        }
        else {
            // /pagi
            return {
                id: cmd.id,
                unit: cmd.unit,
                command: cmd.command,
                shiftName: 'Pagi',
                startTime: '07:30',
                endTime: '17:00',
                lateAfter: '07:36',
            };
        }
    }
    // For Daman: query with shiftSetting relation
    const cmd = await prisma_1.prisma.telegramCommand.findFirst({
        where: {
            unit: unit,
            command: normalizedCmd,
            isActive: true,
        },
        include: {
            shiftSetting: true,
        },
    });
    if (!cmd || !cmd.shiftSetting)
        return null;
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
async function getValidCommandsForUnit(unit) {
    const commands = await prisma_1.prisma.telegramCommand.findMany({
        where: { unit, isActive: true },
        select: { command: true },
    });
    return commands.map((c) => c.command);
}
/**
 * Check if user has already attended today
 * Always uses spreadsheet as the source of truth for ALL users
 */
async function hasAttendedToday(user) {
    const now = (0, date_1.getNow)();
    const day = now.getDate();
    const month = now.getMonth() + 1; // getMonth() is 0-indexed, spreadsheet uses 1-indexed
    const year = now.getFullYear();
    // Always check spreadsheet for ALL users (spreadsheet is the source of truth)
    return await (0, sheets_1.hasAttendedTodayInSheet)(user.nik, day, month, year);
}
/**
 * Normalize command for comparison
 */
function normalizeCommand(cmd) {
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
function commandToShiftType(command) {
    const cmd = normalizeCommand(command);
    switch (cmd) {
        case '/pagi':
            return client_1.ShiftType.PAGI;
        case '/malam':
            return client_1.ShiftType.MALAM;
        case '/piketpagi':
            return client_1.ShiftType.PIKET_PAGI;
        case '/piketmalam':
            return client_1.ShiftType.PIKET_MALAM;
        case '/piket':
            return client_1.ShiftType.PIKET_PAGI; // SDI piket
        case '/pagimalam':
            return client_1.ShiftType.PAGI_MALAM;
        case '/libur':
            return client_1.ShiftType.LIBUR;
        default:
            return client_1.ShiftType.PAGI;
    }
}
/**
 * Validate if command is valid for user's unit
 */
async function validateCommand(user, command) {
    const validCommands = await getValidCommandsForUnit(user.unit);
    const normalizedInputCmd = normalizeCommand(command);
    return validCommands.some((cmd) => normalizeCommand(cmd) === normalizedInputCmd);
}
/**
 * Record attendance for a user
 */
async function recordAttendance(user, command, photoUrl, telegramMessageId, telegramChatId) {
    const now = (0, date_1.getNow)();
    const tanggalStr = (0, date_1.formatTanggal)(now);
    const jamAbsen = (0, date_1.formatJam)(now);
    const bulan = (0, date_1.formatBulan)(now);
    // Get command data from TelegramCommand table (includes ShiftSetting)
    const cmdData = await getCommandByUnitAndCommand(user.unit, command);
    const normalizedCmd = normalizeCommand(command);
    // SDI uses fixed schedule: 07:30-17:00 WIB for both /pagi and /piket
    // Daman uses ShiftSetting from database
    let startTime;
    let endTime;
    let lateAfter;
    let keterangan;
    if (user.unit === 'SDI') {
        // SDI fixed schedule - different for /pagi and /piket
        if (normalizedCmd === '/piket') {
            startTime = '08:00';
            endTime = '17:00';
            lateAfter = '08:06';
            keterangan = 'Piket';
        }
        else {
            // /pagi
            startTime = '07:30';
            endTime = '17:00';
            lateAfter = '07:36';
            keterangan = 'Pagi';
        }
    }
    else {
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
    const late = (0, date_1.isLateByTime)(now, lateAfter);
    const status = late ? 'Telat' : 'Ontime';
    // Sheet data (for all users)
    const sheetData = {
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
        await (0, sheets_1.appendAttendance)(sheetData);
        // Save to PostgreSQL (only for Daman users from User table)
        if (user.source === 'USER') {
            const today = (0, date_1.getTodayStart)();
            const shiftType = commandToShiftType(command);
            await prisma_1.prisma.attendance.upsert({
                where: {
                    memberId_tanggal: {
                        memberId: user.id,
                        tanggal: today,
                    },
                },
                update: {
                    jamAbsen: jamAbsen,
                    keterangan: shiftType,
                    status: late ? client_1.AttendanceStatus.TELAT : client_1.AttendanceStatus.ONTIME,
                    usernameTelegram: user.usernameTelegram,
                    source: client_1.AttendanceSource.TELEGRAM_BOT,
                    telegramMessageId: telegramMessageId,
                    telegramChatId: telegramChatId,
                    photoUrl: photoUrl,
                },
                create: {
                    id: (0, crypto_1.randomUUID)(),
                    memberId: user.id,
                    tanggal: today,
                    jamAbsen: jamAbsen,
                    keterangan: shiftType,
                    status: late ? client_1.AttendanceStatus.TELAT : client_1.AttendanceStatus.ONTIME,
                    usernameTelegram: user.usernameTelegram,
                    source: client_1.AttendanceSource.TELEGRAM_BOT,
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
    }
    catch (error) {
        console.error('❌ Error recording attendance:', error);
        return {
            success: false,
            message: '❌ <b>Gagal menyimpan absensi.</b> Silakan coba lagi.',
        };
    }
}
/**
 * Get today's attendance for a user (for /cekabsen)
 * Always uses spreadsheet as the source of truth for ALL users
 */
async function getTodayAttendance(user) {
    const now = (0, date_1.getNow)();
    const todayStr = (0, date_1.formatTanggal)(now);
    // Always use spreadsheet for ALL users (spreadsheet is the source of truth)
    const { getAttendanceRecords } = await Promise.resolve().then(() => __importStar(require('./sheets')));
    const records = await getAttendanceRecords();
    // Compare using date parts to avoid timezone issues
    const todayDay = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
    return (records.find((r) => {
        const recDate = r.waktu;
        return (r.nik === user.nik &&
            recDate.getDate() === todayDay &&
            recDate.getMonth() === todayMonth &&
            recDate.getFullYear() === todayYear);
    }) || null);
}
//# sourceMappingURL=attendance.js.map