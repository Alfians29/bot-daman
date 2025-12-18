import dotenv from 'dotenv';
dotenv.config();

import { createBot } from './bot';
import { prisma } from './lib/prisma';
import { setupScheduler } from './services/scheduler';

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

  // Create and start bot
  const bot = createBot();

  // Setup scheduled jobs for rekap reports
  setupScheduler(bot);

  // Start bot with long polling
  console.log('🤖 Bot starting...');
  await bot.start({
    onStart: (info) => {
      console.log(`✅ Bot @${info.username} started successfully!`);
      console.log('📌 Listening for messages...');
    },
  });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});

// Run the bot
main().catch(async (error) => {
  console.error('❌ Fatal error:', error);
  await prisma.$disconnect();
  process.exit(1);
});
