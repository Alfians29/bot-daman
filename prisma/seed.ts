import { PrismaClient, ShiftType } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

/**
 * Seed ShiftSetting (if not exists) and TelegramCommand data
 */
async function main() {
  console.log('🌱 Seeding data...');

  // ============================================
  // SHIFT SETTINGS - Create if not exists
  // ============================================
  console.log('\n⏰ Checking ShiftSettings...');

  const shiftSettings = [
    {
      id: 'shift-pagi',
      shiftType: ShiftType.PAGI,
      name: 'Pagi',
      startTime: '07:30',
      endTime: '16:30',
      lateAfter: '07:35',
      telegramCommand: '/pagi',
      color: '#22c55e',
    },
    {
      id: 'shift-malam',
      shiftType: ShiftType.MALAM,
      name: 'Malam',
      startTime: '16:00',
      endTime: '23:59',
      lateAfter: '16:05',
      telegramCommand: '/malam',
      color: '#3b82f6',
    },
    {
      id: 'shift-piket-pagi',
      shiftType: ShiftType.PIKET_PAGI,
      name: 'Piket Pagi',
      startTime: '08:00',
      endTime: '16:00',
      lateAfter: '08:05',
      telegramCommand: '/piketpagi',
      color: '#f59e0b',
    },
    {
      id: 'shift-piket-malam',
      shiftType: ShiftType.PIKET_MALAM,
      name: 'Piket Malam',
      startTime: '16:00',
      endTime: '23:59',
      lateAfter: '16:05',
      telegramCommand: '/piketmalam',
      color: '#8b5cf6',
    },
    {
      id: 'shift-pagi-malam',
      shiftType: ShiftType.PAGI_MALAM,
      name: 'Pagi Malam',
      startTime: '07:30',
      endTime: '23:59',
      lateAfter: '07:35',
      telegramCommand: '/pagimalam',
      color: '#ec4899',
    },
    {
      id: 'shift-libur',
      shiftType: ShiftType.LIBUR,
      name: 'Libur',
      startTime: null,
      endTime: null,
      lateAfter: null,
      telegramCommand: '/libur',
      color: '#ef4444',
    },
  ];

  for (const shift of shiftSettings) {
    const existing = await prisma.shiftSetting.findUnique({
      where: { shiftType: shift.shiftType },
    });
    if (!existing) {
      await prisma.shiftSetting.create({ data: shift });
      console.log(`✅ Created ShiftSetting: ${shift.name}`);
    } else {
      console.log(`⏭️ ShiftSetting exists: ${shift.name}`);
    }
  }

  // Get ShiftSetting IDs for TelegramCommand
  const pagiSetting = await prisma.shiftSetting.findUnique({
    where: { shiftType: ShiftType.PAGI },
  });
  const malamSetting = await prisma.shiftSetting.findUnique({
    where: { shiftType: ShiftType.MALAM },
  });
  const piketPagiSetting = await prisma.shiftSetting.findUnique({
    where: { shiftType: ShiftType.PIKET_PAGI },
  });
  const piketMalamSetting = await prisma.shiftSetting.findUnique({
    where: { shiftType: ShiftType.PIKET_MALAM },
  });
  const pagiMalamSetting = await prisma.shiftSetting.findUnique({
    where: { shiftType: ShiftType.PAGI_MALAM },
  });

  if (
    !pagiSetting ||
    !malamSetting ||
    !piketPagiSetting ||
    !piketMalamSetting ||
    !pagiMalamSetting
  ) {
    throw new Error('ShiftSettings not found!');
  }

  // ============================================
  // TELEGRAM COMMANDS - Connected to ShiftSetting
  // ============================================
  console.log('\n📋 Seeding TelegramCommand...');

  const commands = [
    // DAMAN Commands
    { unit: 'Daman', command: '/pagi', shiftSettingId: pagiSetting.id },
    { unit: 'Daman', command: '/malam', shiftSettingId: malamSetting.id },
    {
      unit: 'Daman',
      command: '/piketpagi',
      shiftSettingId: piketPagiSetting.id,
    },
    {
      unit: 'Daman',
      command: '/piketmalam',
      shiftSettingId: piketMalamSetting.id,
    },
    {
      unit: 'Daman',
      command: '/pagimalam',
      shiftSettingId: pagiMalamSetting.id,
    },
    // SDI Commands
    { unit: 'SDI', command: '/pagi', shiftSettingId: pagiSetting.id },
    { unit: 'SDI', command: '/piket', shiftSettingId: piketPagiSetting.id },
  ];

  for (const cmd of commands) {
    await prisma.telegramCommand.upsert({
      where: { unit_command: { unit: cmd.unit, command: cmd.command } },
      update: { shiftSettingId: cmd.shiftSettingId },
      create: cmd,
    });
    console.log(`✅ Command: ${cmd.unit} - ${cmd.command}`);
  }

  // ============================================
  // TELEGRAM USERS - SDI only (Daman from User table)
  // ============================================
  console.log('\n👥 Seeding TelegramUser (SDI only)...');

  const sdiUsers = [
    {
      usernameTelegram: '@nanangagustian',
      nik: '20900289',
      nama: 'Nanang Agustian',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@ABCDEFGHIJ4NMCOK2345678910PQRSTU',
      nik: '20910514',
      nama: 'Achmad Vilda Pradianto',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@bunda_bella',
      nik: '20750004',
      nama: 'Barokah Indah',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@cimolzzz',
      nik: '20950745',
      nama: 'Tito Guntur Pradana',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@Adhitsatria',
      nik: '19870031',
      nama: 'Adhit Satria Harendro',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@Andinaay',
      nik: '925752',
      nama: 'Andina Ayu Hapsari',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@sihajzaarandi',
      nik: '22000009',
      nama: 'Mohammad Sihaj Zarrandi',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@rizkausman',
      nik: '20900376',
      nama: 'Rizka Agustia Usman',
      unit: 'SDI',
    },
    {
      usernameTelegram: '@DWSYXGQ',
      nik: '19950350',
      nama: 'Dimmas Wahyu Saputra',
      unit: 'SDI',
    },
  ];

  for (const user of sdiUsers) {
    await prisma.telegramUser.upsert({
      where: { usernameTelegram: user.usernameTelegram },
      update: user,
      create: user,
    });
    console.log(`✅ User: ${user.nama}`);
  }

  console.log(`\n🎉 Seeding complete!`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
