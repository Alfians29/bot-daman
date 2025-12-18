# Telegram Bot Absensi

Bot Telegram untuk manajemen absensi tim Daman & SDI.

## Features

- ✅ Absensi dengan foto + command (`/pagi`, `/malam`, `/piketpagi`, `/piketmalam`, `/libur`)
- ✅ Cek absensi hari ini (`/cekabsen`)
- ✅ Validasi user berdasarkan username Telegram
- ✅ Dual storage: PostgreSQL (Daman) + Google Sheets (semua)
- ✅ Status Ontime/Telat otomatis

## Setup

### 1. Install dependencies

```bash
cd bot
npm install
```

### 2. Setup environment

```bash
# Copy template
cp env.example.txt .env

# Edit .env with your values:
# - BOT_TOKEN (from BotFather)
# - GROUP_ID (your Telegram group)
# - DATABASE_URL (PostgreSQL connection)
# - GOOGLE_SHEETS_ID
# - GOOGLE_SERVICE_ACCOUNT_EMAIL
# - GOOGLE_PRIVATE_KEY
```

### 3. Setup database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial user data
npx ts-node prisma/seed.ts
```

### 4. Run bot

```bash
npm run dev
```

## Commands

| Command       | Fungsi                     |
| ------------- | -------------------------- |
| `/start`      | Mulai bot                  |
| `/help`       | Panduan penggunaan         |
| `/cekabsen`   | Lihat absensi hari ini     |
| `/pagi`       | Absen shift pagi (+ foto)  |
| `/malam`      | Absen shift malam (+ foto) |
| `/piketpagi`  | Absen piket pagi (+ foto)  |
| `/piketmalam` | Absen piket malam (+ foto) |

## Storage Logic

- **Unit Daman** → PostgreSQL + Google Sheets
- **Unit SDI** → Google Sheets only
