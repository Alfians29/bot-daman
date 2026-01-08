"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAbsensi = handleAbsensi;
exports.extractCommand = extractCommand;
const config_1 = require("../config");
const attendance_1 = require("../services/attendance");
const retry_1 = require("../utils/retry");
const messageQueue_1 = require("../utils/messageQueue");
/**
 * Handle attendance commands: /pagi, /malam, /piketpagi, /piketmalam, /libur
 */
async function handleAbsensi(ctx, command) {
    const chatId = ctx.chat?.id;
    const username = ctx.from?.username;
    const message = ctx.message;
    if (!chatId || !username) {
        await (0, retry_1.replyWithRetry)(ctx, '⚠️ <b>Tidak dapat mengidentifikasi user.</b>', {
            parse_mode: 'HTML',
        });
        return;
    }
    // Check if message has photo
    const photo = message?.photo;
    if (!photo || photo.length === 0) {
        await (0, retry_1.replyWithRetry)(ctx, '⚠️ <b>Absen harus menyertakan foto dengan caption sesuai jadwal.</b>', { parse_mode: 'HTML' });
        return;
    }
    // Find user in database
    const user = await (0, attendance_1.findUserByTelegram)(`@${username}`);
    if (!user) {
        await (0, retry_1.replyWithRetry)(ctx, '⚠️ <b>Username tidak terdaftar di database.</b>\n\nHubungi admin untuk didaftarkan.', { parse_mode: 'HTML' });
        return;
    }
    // Validate command matches user's allowed commands for their unit
    const isValidCommand = await (0, attendance_1.validateCommand)(user, command);
    if (!isValidCommand) {
        // Show valid commands based on unit
        const validCommandsMsg = user.unit === 'SDI'
            ? '• /pagi\n• /piket'
            : '• /pagi\n• /malam\n• /pagimalam\n• /piketpagi\n• /piketmalam';
        await (0, retry_1.replyWithRetry)(ctx, `⚠️ <b>Command tidak dikenali!</b>\n\n` +
            `Kamu mengirim: <code>${command || 'tidak ada command'}</code>\n\n` +
            `Command yang tersedia untuk <b>${user.unit}</b>:\n${validCommandsMsg}\n\n` +
            `💡 <i>Pastikan penulisan command sudah benar.</i>`, { parse_mode: 'HTML' });
        return;
    }
    // Check if already attended today
    const alreadyAttended = await (0, attendance_1.hasAttendedToday)(user);
    if (alreadyAttended) {
        await (0, retry_1.replyWithRetry)(ctx, '⚠️ <b>Kamu sudah melakukan absen!</b>\n' +
            'Hanya diperbolehkan <b>1x absen per hari</b>, atau hubungi admin jika ada kendala yaa.', { parse_mode: 'HTML' });
        return;
    }
    // Get photo URL from Telegram
    const fileId = photo[photo.length - 1].file_id;
    let photoUrl = '';
    try {
        const file = await ctx.api.getFile(fileId);
        photoUrl = `https://api.telegram.org/file/bot${config_1.config.BOT_TOKEN}/${file.file_path}`;
    }
    catch (error) {
        console.error('Error getting file URL:', error);
        photoUrl = fileId; // Fallback to file_id
    }
    // Record attendance
    const result = await (0, attendance_1.recordAttendance)(user, command, photoUrl, message?.message_id?.toString(), chatId.toString());
    if (result.success && result.data) {
        const statusEmoji = result.data.status === 'Ontime' ? '🟢' : '🔴';
        const notif = `✅ <b>Absensi Berhasil!</b>\n\n` +
            `👤 ${result.data.nama}\n` +
            `🗓️ ${result.data.tanggal} • ${result.data.jamAbsen} WIB\n` +
            `📌 Status: ${statusEmoji} <b>${result.data.status}</b>`;
        // Try to send with retry, queue if all retries fail
        const sent = await (0, retry_1.replyWithRetry)(ctx, notif, { parse_mode: 'HTML' });
        if (!sent) {
            // Data already saved, queue the notification for later
            (0, messageQueue_1.queueMessage)(chatId.toString(), notif, 'HTML');
        }
    }
    else {
        await (0, retry_1.replyWithRetry)(ctx, result.message, { parse_mode: 'HTML' });
    }
}
/**
 * Get command from message caption
 */
function extractCommand(caption) {
    if (!caption)
        return null;
    const text = caption.trim().toLowerCase();
    // List of valid attendance commands
    // IMPORTANT: Order matters! Longer commands must come first to avoid prefix matching issues
    // (e.g., /pagimalam must be checked before /pagi)
    const validCommands = [
        // Daman commands
        '/pagimalam',
        '/pagi_malam',
        '/piketpagi',
        '/piket_pagi',
        '/piketmalam',
        '/piket_malam',
        '/pagi',
        '/malam',
        '/libur',
        // SDI commands
        '/piket',
    ];
    for (const cmd of validCommands) {
        if (text.startsWith(cmd)) {
            return cmd;
        }
    }
    return null;
}
//# sourceMappingURL=absensi.js.map