"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
exports.validateConfig = validateConfig;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    // Telegram
    BOT_TOKEN: process.env.BOT_TOKEN || '',
    GROUP_ID: process.env.GROUP_ID || '',
    // Google Sheets
    GOOGLE_SHEETS_ID: process.env.GOOGLE_SHEETS_ID ||
        '15EpL-NI1TRw-81H3H00r-8aAgecsOnLVhrD8yfbLPCA',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || '',
    GOOGLE_PRIVATE_KEY: (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    // Timezone
    TIMEZONE: process.env.TZ || 'Asia/Jakarta',
    // Units
    UNIT_DAMAN: 'Daman',
    UNIT_SDI: 'SDI',
    // Tolerance for late calculation (in minutes)
    LATE_TOLERANCE_MINUTES: 5,
};
// Validate required config
function validateConfig() {
    if (!exports.config.BOT_TOKEN) {
        throw new Error('BOT_TOKEN is required');
    }
    if (!exports.config.GOOGLE_SERVICE_ACCOUNT_EMAIL || !exports.config.GOOGLE_PRIVATE_KEY) {
        console.warn('⚠️ Google Sheets credentials not configured. Sheets integration will be disabled.');
    }
}
//# sourceMappingURL=config.js.map