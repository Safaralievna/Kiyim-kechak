# Kiyim-Kechak Ulgurji Savdo Platformasi (ERP/CRM/WMS)

Ushbu platforma kiyim-kechak ulgurji savdo kompaniyasi uchun ishlab chiqilgan to'liq fullstack ERP/CRM/WMS tizimidir. Platforma AWS infratuzilmasiga deploy qilishga tayyor holda yaratilgan.

## 🗂️ Loyiha Strukturasi
```
/project-root
  /backend        → Node.js + Express + TypeScript (API)
  /frontend       → React + TypeScript + Vite (Client)
  /docker         → Dockerfiles va docker-compose konfiguratsiyalari
  README.md
```

---

## ⚙️ Loyihani Ishga Tushirish Tartibi

Quyidagi bosqichlarni ketma-ketlikda bajaring:

### 1. Loyihani yuklab olish (Clone)
```bash
git clone <loyiha-repository-url>
cd Kiyim_kechak
```

### 2. Backend muhitini sozlash (Environment Variables)
1. `/backend` papkasiga o'ting.
2. `.env` faylini yarating va `.env.example` dan nusxa oling:
   ```bash
   cp backend/.env.example backend/.env
   ```
3. `DATABASE_URL` o'zgaruvchisiga o'zingizning Render yoki AWS RDS PostgreSQL ulanish satrini (Connection String) yozing:
   ```env
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?sslmode=require
   ```

### 3. Frontend muhitini sozlash
1. `/frontend` papkasiga o'ting.
2. `.env` faylini yarating va `.env.example` dan nusxa oling:
   ```bash
   cp frontend/.env.example frontend/.env
   ```

### 4. Ma'lumotlar bazasini yaratish, migratsiya qilish va demo ma'lumotlarni yuklash (Seeding)
Terminalda quyidagi buyruqlarni ishga tushiring:
```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma db seed
```

### 5. Backend Serverni ishga tushirish
```bash
npm run dev
```
Server sukut bo'yicha `http://localhost:5000` portida ishga tushadi.

### 6. Frontend Clientni ishga tushirish
Boshqa terminal oynasida quyidagilarni bajaring:
```bash
cd ../frontend
npm install
npm run dev
```
Frontend ilovangiz `http://localhost:5173` manzilida ochiladi.

---

## 🔐 Sinov (Demo) Foydalanuvchi Ma'lumotlari

Tizimga kirish uchun quyidagi login va parollardan foydalanishingiz mumkin (yoki login sahifasidagi auto-fill tugmalarini bosing):

*   **ADMIN** roli (To'liq tizim va foydalanuvchilar boshqaruvi, hisobotlar):
    *   **Login:** `admin@company.uz`
    *   **Parol:** `Admin123!`
*   **MANAGER** roli (Mahsulotlar va buyurtmalar tahriri, ombor harakatlari):
    *   **Login:** `manager@company.uz`
    *   **Parol:** `Manager123!`
*   **USER** roli (Mijoz sifatida faqat o'z buyurtmalarini ko'rish):
    *   **Login:** `user@company.uz`
    *   **Parol:** `User123!`

---

## 🐳 Docker orqali ishga tushirish (Local Stack)

Butun tizimni (Database + Backend + Frontend) bir vaqtda ishga tushirish uchun docker-compose dan foydalaning:
```bash
docker-compose up --build
```
*   **Frontend:** `http://localhost` (Nginx serve)
*   **Backend API:** `http://localhost:5000`
*   **PostgreSQL:** `localhost:5432`

---

## 🚀 AWS ga deploy qilish uchun tayyorlik

*   **Backend:** AWS EC2 yoki ECS (Fargate) uchun ko'p bosqichli Dockerfile tayyor.
*   **Frontend:** AWS S3 + CloudFront da joylashtirish uchun `npm run build` komandasi orqali static build fayllar chiqaradi.
*   **Health Check:** Liveness tekshiruvlari uchun AWS Load Balancer so'rovlariga GET `/api/health` orqali `{ status: "ok", timestamp }` qaytaradi.
