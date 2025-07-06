# 📺 Digital Signage Web App

## 🧩 Tech Stack
- **Frontend**: Next.js 15 (App Router)
- **Authentication**: Firebase Auth
- **Database & Storage**: Firebase Firestore & Firebase Storage
- **Media Caching**: Local Storage / IndexedDB

---

## 🎯 Tujuan
Aplikasi ini digunakan untuk mengelola dan menampilkan konten digital (gambar/video) ke TV atau monitor di store, dengan kontrol dari admin pusat.

---

## 👥 User Roles & Akses

### 1. Admin Login
- **Login via Firebase Email/Password**
- Fitur:
  - Buat **Client**
    - Fields: `name`, `description`
  - Buat banyak **Display** dalam 1 Client
  - Atur **Media** untuk tiap Display:
    - Bisa mengatur urutan, jenis (image/video), dan durasi tampil
  - Upload **Media**:
    - Fields: `name`, `category` (`Head Office`, `Store`, `Promotion`)
    - Bisa assign ke satu atau beberapa Display

---

### 2. Store Login
- **Login via 6-digit PIN**
- 1 Client = 1 Store Account
- Fitur:
  - Melihat daftar **Display** yang dimiliki
  - Tombol **View** untuk melihat slideshow konten dari Display
  - Saat akses Display:
    - Media hanya **diunduh saat akses/refresh**
    - Setelah itu **disimpan di local storage**
    - Tidak mengunduh ulang jika tidak direfresh

---

## 📁 Struktur Data (Firestore)

### Collection: `clients`
```json
{
  "id": "string",
  "name": "string",
  "description": "string",
  "pin": "string" // 6-digit PIN
}
```

### Collection: `displays`
```json
{
  "id": "string",
  "clientId": "string",
  "name": "string",
  "mediaItems": [MediaItem]
}
```

### Collection: `media`
```json
{
  "id": "string",
  "name": "string",
  "url": "string",
  "type": "image" | "video",
  "category": "Head Office" | "Store" | "Promotion",
  "duration": number // dalam detik
}
```

---

## ⚙️ Fitur Tambahan
- Preview media (thumbnail)
- Filter & sort media berdasarkan kategori
- Validasi upload (format, ukuran)
- Tampilan slideshow fullscreen di TV
- Dukungan cache offline (PWA-ready)

---

## 📱 Catatan Teknis
- Gunakan IndexedDB atau LocalStorage untuk caching media secara efisien.
- Media ditautkan ke `displayId` agar bisa dimuat dengan cepat.
- Gunakan mekanisme validasi cache (mis. timestamp) agar media tidak diunduh berulang-ulang.

---