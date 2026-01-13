# Telegram Bot Absensi

Bot Telegram untuk manajemen absensi tim Daman & SDI.

**!!BOT_TOKEN dan GROUP_ID masih untuk production menggunakan grup dan bot di grup TestingBotAbsensiDaman‼️!!**

## Features

- ✅ Absensi dengan foto + command
- ✅ Cek absensi hari ini (`/cekabsen`)
- ✅ Validasi user berdasarkan username Telegram
- ✅ Dual storage: PostgreSQL (Daman) + Google Sheets (semua)
- ✅ Status Ontime/Telat otomatis
- ✅ Rekap harian, mingguan, bulanan otomatis
- ✅ Reminder absensi setiap pagi

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Setup environment

```bash
cp env.example.txt .env
```

Edit file `.env` dengan nilai yang sesuai (lihat section **Environment Variables** di bawah).

### 3. Setup database

```bash
npm run db:generate
npm run db:push
npx ts-node prisma/seed.ts
```

### 4. Run bot

```bash
npm run dev
```

---

## Environment Variables

| Variable                       | Keterangan                   |
| ------------------------------ | ---------------------------- |
| `BOT_TOKEN`                    | Token dari BotFather         |
| `GROUP_ID`                     | ID grup Telegram             |
| `DATABASE_URL`                 | Connection string PostgreSQL |
| `GOOGLE_SHEETS_ID`             | ID spreadsheet (dari URL)    |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Email service account Google |
| `GOOGLE_PRIVATE_KEY`           | Private key service account  |

### Cara Ganti Bot/Spreadsheet

1. **Ganti Bot**: Ubah `BOT_TOKEN` dengan token baru dari BotFather
2. **Ganti Spreadsheet**: Ubah `GOOGLE_SHEETS_ID` (ID ada di URL: `https://docs.google.com/spreadsheets/d/{ID}/edit`)
3. **Ganti Grup**: Ubah `GROUP_ID` dengan ID grup baru
4. Restart bot: `npm run dev`

> **Note**: Jika ganti spreadsheet, pastikan share ke email service account!

---

## Commands

### User Commands

| Command     | Fungsi                 |
| ----------- | ---------------------- |
| `/start`    | Mulai bot              |
| `/help`     | Panduan penggunaan     |
| `/cekabsen` | Lihat absensi hari ini |

### Absensi Commands (+ foto)

**DAMAN:**
| Command | Jadwal |
|---------|--------|
| `/pagi` | 07:30 - 16:30 WIB |
| `/malam` | 16:00 - 23:59 WIB |
| `/pagimalam` | 07:30 - 23:59 WIB |
| `/piketpagi` | 08:00 - 16:00 WIB |
| `/piketmalam` | 16:00 - 23:59 WIB |

**SDI:**
| Command | Jadwal |
|---------|--------|
| `/pagi` | 07:30 - 17:00 WIB |
| `/piket` | 07:30 - 17:00 WIB |

### Rekap Commands (Testing)

| Command          | Fungsi             |
| ---------------- | ------------------ |
| `/rekapharian`   | Rekap hari ini     |
| `/rekapmingguan` | Rekap minggu ini   |
| `/rekapbulanan`  | Rekap bulan ini    |
| `/testreminder`  | Test reminder pagi |

---

## Scheduled Tasks (Otomatis)

| Waktu                | Task                           |
| -------------------- | ------------------------------ |
| **07:00 WIB**        | Reminder absensi (GIF + pesan) |
| **17:30 WIB**        | Rekap harian otomatis          |
| **Jumat 17:35**      | Rekap mingguan otomatis        |
| **Tgl 15 jam 17:40** | Rekap bulanan otomatis         |

---

## Storage Logic

- **Unit Daman** → PostgreSQL + Google Sheets
- **Unit SDI** → Google Sheets only

---

## Project Structure

```
bot-daman/
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed data
├── src/
│   ├── commands/        # Command handlers
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── lib/             # Database client
│   ├── bot.ts           # Bot configuration
│   ├── config.ts        # Environment config
│   └── index.ts         # Entry point
├── .env                 # Environment variables
└── package.json
```
