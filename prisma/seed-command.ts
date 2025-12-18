import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommand() {
  console.log('🌱 Seeding /pagimalam command...');

  // Find PAGI_MALAM shift setting
  const pagiMalam = await prisma.shiftSetting.findUnique({
    where: { shiftType: 'PAGI_MALAM' },
  });

  if (!pagiMalam) {
    console.log('❌ ShiftSetting PAGI_MALAM not found!');
    return;
  }

  // Upsert the command
  await prisma.telegramCommand.upsert({
    where: { unit_command: { unit: 'Daman', command: '/pagimalam' } },
    update: { shiftSettingId: pagiMalam.id },
    create: {
      unit: 'Daman',
      command: '/pagimalam',
      shiftSettingId: pagiMalam.id,
    },
  });

  console.log('✅ Command /pagimalam seeded!');
}

seedCommand()
  .catch((e) => console.error('❌ Error:', e))
  .finally(() => prisma.$disconnect());
