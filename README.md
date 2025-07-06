# Digital Signage System

Sistem digital signage untuk Android TV dengan manajemen konten terpusat.

## Teknologi

- **Frontend**: Next.js 15 dengan App Router, TypeScript, Tailwind CSS
- **Database**: Firebase Firestore dengan sub-collections
- **Storage**: Firebase Storage untuk file media
- **UI**: Custom components dengan Lucide React icons

## Fitur Utama

### 🎬 **Media Player yang Disempurnakan**
- **Auto-Advance**: Otomatis berpindah ke media berikutnya sesuai durasi yang ditetapkan
- **Support Video & Gambar**: Handle MIME types lengkap (image/jpeg, video/mp4, dll.)
- **Smart Timer**: Timer yang akurat untuk gambar, video menggunakan event natural
- **Progress Bar**: Visual progress dengan countdown timer
- **Keyboard Controls**: Space (play/pause), Arrow keys (navigate), F (fullscreen)

### ⏱️ **Edit Durasi Media**
- **Click-to-Edit**: Klik pada durasi media untuk mengedit langsung
- **Real-time Update**: Perubahan durasi langsung tersimpan ke database
- **Range Validation**: Durasi 1-300 detik dengan validasi input
- **UI Intuitif**: Save/Cancel buttons dengan visual feedback

### 📁 **Upload Media**
- **Multi-Format**: Support gambar (JPEG, PNG, GIF, WebP) dan video (MP4, WebM)
- **File Size Limit**: Maksimal 50MB per file
- **Kategori**: Head Office, Store, Promotion
- **Custom Duration**: Set durasi custom untuk setiap media

## Struktur Database (Sub-Collections)

### 1. Main Collections

#### `clients` (Collection)
```
clients/
├── {clientId}/
│   ├── name: string
│   ├── pin: string
│   ├── description?: string
│   ├── createdAt: timestamp
│   ├── updatedAt: timestamp
│   └── displays/ (Sub-collection)
│       └── {displayId}/
│           ├── name: string
│           ├── createdAt: timestamp
│           ├── updatedAt: timestamp
│           └── assignedMedia/ (Sub-collection)
│               └── {assignmentId}/
│                   ├── mediaId: string
│                   └── assignedAt: timestamp
```

#### `media` (Collection)
```
media/
└── {mediaId}/
    ├── name: string
    ├── type: string (MIME type: image/jpeg, video/mp4, etc.)
    ├── category: 'Head Office' | 'Store' | 'Promotion'
    ├── duration: number (seconds, editable)
    ├── url: string (Firebase Storage URL)
    ├── createdAt: timestamp
    └── updatedAt: timestamp
```

### 2. Keuntungan Struktur Sub-Collections

1. **Hierarki Jelas**: `clients` → `displays` → `assignedMedia`
2. **Skalabilitas**: Setiap level dapat berkembang independen
3. **Keamanan**: Firebase rules dapat diterapkan per level
4. **Performance**: Query lebih efisien untuk data terkait
5. **Konsistensi**: Relasi data terjaga secara natural

## API Endpoints

### Clients
- `GET /api/clients` - Daftar semua clients
- `POST /api/clients` - Buat client baru
- `GET /api/clients/[id]` - Detail client
- `PUT /api/clients/[id]` - Update client
- `DELETE /api/clients/[id]` - Hapus client (cascade ke displays)

### Displays (Sub-collection)
- `GET /api/clients/[id]/displays` - Daftar displays untuk client
- `POST /api/displays` - Buat display baru (perlu clientId)
- `GET /api/displays/[id]?clientId=xxx` - Detail display dengan media
- `PUT /api/displays/[id]` - Update display (perlu clientId)
- `DELETE /api/displays/[id]?clientId=xxx` - Hapus display
- `PATCH /api/displays/[id]` - Assign/remove media

### Media
- `GET /api/media` - Daftar semua media
- `POST /api/media/upload` - Upload file media baru
- `GET /api/media/[id]` - Detail media
- `PUT /api/media/[id]` - Update metadata media (termasuk durasi)
- `DELETE /api/media/[id]` - Hapus media

### Media Assignment (Sub-collection)
```javascript
// Assign media to display
PATCH /api/displays/[displayId]
{
  "clientId": "client123",
  "action": "assign",
  "mediaId": "media456"
}

// Remove media from display
PATCH /api/displays/[displayId]
{
  "clientId": "client123", 
  "action": "remove",
  "mediaId": "media456"
}
```

## Alur Kerja

### 1. Admin Dashboard
```
/admin → /admin/client/[id] → /admin/client/[id]/display/[displayId]
```

### 2. Store Access
```
/ (PIN login) → /store → /client/[clientId]/display/[displayId]
```

### 3. Media Management
```
/admin/media → Upload & organize media by category
```

### 4. Duration Editing
```
Display Management → Click on duration → Edit → Save
```

## Media Player Features

### 🎮 **Keyboard Controls**
- **Space**: Play/Pause slideshow
- **← →**: Navigate between media
- **F**: Toggle fullscreen
- **Esc**: Exit fullscreen
- **R**: Refresh/reload media

### 📊 **Visual Indicators**
- **Progress Bar**: Shows remaining time for current media
- **Media Info**: Name, category, duration, position
- **Slide Indicators**: Dots showing current position
- **Time Remaining**: Countdown timer

### 🔄 **Auto-Advance Logic**
- **Images**: Use custom duration setting
- **Videos**: Natural video end + fallback timer
- **Pause Support**: Timer stops when paused
- **Smooth Transitions**: No gaps between media

## Instalasi

1. Clone repository
2. Install dependencies: `npm install`
3. Setup Firebase:
   - Buat project Firebase baru
   - Enable Firestore dan Storage
   - Copy configuration ke `.env.local`
4. Jalankan development server: `npm run dev`

## Environment Variables

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

## Supported Media Formats

### 📷 **Images**
- JPEG (.jpg, .jpeg)
- PNG (.png)

### 🎥 **Videos**
- MP4 (.mp4)

**File Size Limits**: 
- Images: 10MB max
- Videos: 100MB max

## Changelog

### v2.0 - Enhanced Media Player
- ✅ **Auto-advance based on duration**: Timer yang akurat untuk setiap media
- ✅ **Video support improvement**: Handle video events dengan benar
- ✅ **Duration editing**: Edit durasi media langsung dari display management
- ✅ **MIME type support**: Full MIME type storage dan handling
- ✅ **Progress indicators**: Visual progress bar dengan countdown
- ✅ **Keyboard controls**: Comprehensive keyboard navigation

### v1.0 - Base System
- ✅ **Hierarchical Navigation**: Admin → Client → Display → Media
- ✅ **Sub-Collection Structure**: Optimal Firestore organization
- ✅ **Media Upload**: Firebase Storage integration
- ✅ **Real-time Slideshow**: Basic slideshow functionality
- ✅ **Responsive UI**: Modern design dengan Tailwind CSS
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **PWA Ready**: Manifest untuk Android TV

## Admin Access

- **Admin**: super@admin.com / admin123
- **Store Access**: Use client PIN (configured during client creation) 