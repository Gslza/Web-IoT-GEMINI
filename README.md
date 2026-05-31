# Siri-IoT ESP32 Smart Home System

Siri-IoT adalah sistem otomasi rumah pintar (*Smart Home*) berbasis **ESP32** terintegrasi penuh yang menghubungkan kontrol fisik perangkat elektronik dengan **Visual Web Dashboard** modern (React/Vite) dan **Telegram Bot** untuk kontrol jarak jauh instan tanpa latensi.

Sistem ini didesain ringkas, efisien, dan ramah memori dengan menggantikan library berat (seperti Firebase Client yang rawan *Out of Memory* pada mikroprosesor) dan menggunakan sinkronisasi **REST API Gateway** berkecepatan tinggi yang berjalan secara *asynchronous*.

---

## 🚀 Fitur Utama

- **Real-Time Telemetry Dashboard**: Pemantauan suhu (Temperature) & kelembaban (Humidity) udara dari sensor DHT (DHT11/DHT22) dengan visualisasi grafik interaktif.
- **Bi-Directional 4-Channel Relay Control**: Kontrol 4 kanal relay secara dua arah melalui:
  1. Saklar Pintar di Web Dashboard
  2. Perintah Teks / Menu Telegram Bot
  3. Integrasi Tombol Fisik (opsional)
- **Ultra-Lightweight REST API Sync**: Sinkronisasi status relay dan telemetri sensor secara kontinu menggunakan metode `HTTP POST` JSON terbungkus tanpa memakan penyimpanan flash yang besar.
- **Instant Telegram Bot Integration**: Menerima laporan status sistem langsung ke smartphone Anda secara temporal dan eksekusi perintah instan (seperti `/r1_on`, `/r1_off`, `/status`, dan pola variasi lampu pintar).
- **Anti-Crash Initializer**: Proteksi sistem dari kegagalan booting (`SW_CPU_RESET / xQueueSemaphore` panic) dengan penanganan inisiasi driver perangkat yang aman sebelum koneksi jaringan/klien terhubung.

---

## 🔌 Skema Pin Jumper ESP32

Berikut adalah konfigurasi pemetaan pin GPIO ESP32 default yang disarankan pada firmware ini:

| Komponen Hardware | Pin GPIO ESP32 | Keterangan |
| :--- | :---: | :--- |
| **Sensor DHT** (Temp & Humid) | **GPIO 15** | Hubungkan dengan resistor pull-up 4.7k ke 3.3V |
| **Relay 1** (Lampu Utama) | **GPIO 12** | Output Digital (Kondisi Aktif: Low/High tergantung jenis modul) |
| **Relay 2** (AC / Kipas) | **GPIO 13** | Output Digital |
| **Relay 3** (Stopkontak Kerja) | **GPIO 14**| Output Digital |
| **Relay 4** (Sistem Cadangan) | **GPIO 27** | Output Digital |

---

## 🛠️ Panduan Persiapan & Perakitan

### 1. Kebutuhan Library Arduino IDE
Sebelum melakukan *upload* kode program ke ESP32, buka Arduino IDE kemudian masuk ke menu **Sketch** ➔ **Include Library** ➔ **Manage Libraries**. Cari dan instal library berikut:

* **UniversalTelegramBot** oleh *Brian Lough* (Versi Terkini)
* **ArduinoJson** oleh *Benoit Blanchon* (Disarankan versi **6.x** ke atas)
* **DHT sensor library** oleh *Adafruit* (Pastikan menginstal juga paket dependency *Adafruit Unified Sensor*)

---

### 2. Cara Mengatasi Error "Sketch Too Big" pada ESP32
Sistem ini **telah dioptimalkan secara mendalam** dengan memisahkan library Firebase ESP Client yang sangat berat, sehingga ukuran final sketch kini sangat bersahabat dan muat sempurna pada skema memori default. 

Namun, jika di masa depan Anda menambahkan fitur kustom tambahan dan menemui error kompilasi:
`Sketch uses X bytes (105%) of program storage space. Maximum is 1310720 bytes.`

**Langkah Penyelesaian 5 Detik di Arduino IDE:**
1. Klik menu **Tools** (Peralatan) pada bilah navigasi atas Arduino IDE.
2. Sorot opsi **Partition Scheme** (Skema Partisi).
3. Ubah pengaturannya dari opsi default `"Default (1.2MB APP/1.5MB SPIFFS)"` ke `"No OTA (2MB APP/2MB SPIFFS)"` atau `"Huge APP (3MB No OTA/1MB SPIFFS)"`.
4. Jalankan kembali **Verify / Compile**. ESP32 Anda secara fisik dibekali kapasitas flash 4MB sehingga skema baru ini akan menyediakan ruang instalasi program 2x lipat lebih besar dan menghilangkan error kompilasi selamanya!

---

## 🖥️ Menjalankan Dashboard Web App (Kontroler Pusat)

Aplikasi Web ini ditenagai oleh kerangka kerja modern **React v18**, **Vite**, **Tailwind CSS** untuk antarmuka yang dinamis dan responsif, serta **Express.js API Server** sebagai gerbang sinkronisasi pusat.

### Pengaturan Environment (`.env`)
Salin file `.env.example` menjadi `.env` di direktori utama, lalu isikan konfigurasi port jika dibutuhkan (secara default, program berjalan di port `3000`):
```env
PORT=3000
```

### Script Proyek
Jalankan perintah berikut di terminal Anda untuk menginstal paket dependencies dan memulai server pengembangan:

```bash
# 1. Install dependencies aplikasi
npm install

# 2. Jalankan aplikasi di mode Developer (Vite + Express API)
npm run dev

# 3. Compile aplikasi untuk Production
npm run build

# 4. Menjalankan Server Production yang telah di-compile
npm run start
```

Setelah server aktif, Anda dapat membuka visualisasi dashboard di browser melalui alamat:  
➔ **`http://localhost:3000`**

---

## 📋 Struktur Folder Proyek
```text
├── server.ts               # Express.js REST API server & middleware sinkronisasi ESP32
├── src/
│   ├── App.tsx             # Kode Utama Web Dashboard & Kode Sketch Arduino C++ (Terintegrasi di Tab Info)
│   ├── main.tsx            # Entrypoint Rendering React
│   └── index.css           # Konfigurasi Tailwind CSS & Font Antarmuka
├── package.json            # Informasi Dependensi & Script Proyek
├── .env.example            # Template Konfigurasi Environment Sistem
└── README.md               # Dokumentasi Panduan Penggunaan
```

---

## 🔒 Lisensi & Hak Cipta
Dibuat dengan dedikasi penuh untuk komunitas pengembang IoT *Smart Nest* Indonesia. Bebas dimodifikasi, diperluas, dan disebarluaskan untuk kebutuhan edukasi maupun komersial.

*Selamat Berkreasi dengan Siri-IoT! 🚀*
