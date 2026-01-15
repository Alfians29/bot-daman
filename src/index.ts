import dotenv from 'dotenv';
dotenv.config();

import { createBot } from './bot';
import { prisma } from './lib/prisma';
import { setupScheduler, setBotStartTime } from './services/scheduler';
import { loadQueue, processQueue, saveQueue } from './utils/messageQueue';

async function main() {
  console.log('🚀 Starting Telegram Bot Absensi...');

  // Test database connection
  try {
    await prisma.$connect();
    console.log('✅ Database connected');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  // Load pending message queue
  loadQueue();

  // Create and start bot
  const bot = createBot();

  // Setup scheduled jobs for rekap reports
  setupScheduler(bot);

  // Start bot with long polling
  console.log('🤖 Bot starting...');
  await bot.start({
    onStart: async (info) => {
      setBotStartTime();
      console.log(`✅ Bot @${info.username} started successfully!`);
      console.log('📌 Listening for messages...');

      // Process any pending messages from queue
      await processQueue(bot);
    },
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  saveQueue(); // Save any pending messages
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  saveQueue(); // Save any pending messages
  await prisma.$disconnect();
  process.exit(0);
});

// Run the bot
main().catch(async (error) => {
  console.error('❌ Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
