"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bot_1 = require("./bot");
const prisma_1 = require("./lib/prisma");
const scheduler_1 = require("./services/scheduler");
const messageQueue_1 = require("./utils/messageQueue");
async function main() {
    console.log('🚀 Starting Telegram Bot Absensi...');
    // Test database connection
    try {
        await prisma_1.prisma.$connect();
        console.log('✅ Database connected');
    }
    catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
    // Load pending message queue
    (0, messageQueue_1.loadQueue)();
    // Create and start bot
    const bot = (0, bot_1.createBot)();
    // Setup scheduled jobs for rekap reports
    (0, scheduler_1.setupScheduler)(bot);
    // Start bot with long polling
    console.log('🤖 Bot starting...');
    await bot.start({
        onStart: async (info) => {
            (0, scheduler_1.setBotStartTime)();
            console.log(`✅ Bot @${info.username} started successfully!`);
            console.log('📌 Listening for messages...');
            // Process any pending messages from queue
            await (0, messageQueue_1.processQueue)(bot);
        },
    });
}
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    (0, messageQueue_1.saveQueue)(); // Save any pending messages
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('\n🛑 Shutting down...');
    (0, messageQueue_1.saveQueue)(); // Save any pending messages
    await prisma_1.prisma.$disconnect();
    process.exit(0);
});
// Run the bot
main().catch(async (error) => {
    console.error('❌ Fatal error:', error);
    await prisma_1.prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=index.js.map