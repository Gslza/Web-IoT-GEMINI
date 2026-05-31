# Dokumen Perencanaan Manajemen Proyek TIK (Siri-IoT ESP32)

Dokumen ini berisi metodologi pengembangan *Software Development Life Cycle* (SDLC), estimasi anggaran biaya, linimasa pengerjaan proyek (*timeline*), serta struktur sumber kode proyek **Siri-IoT ESP32 Smart Home System**.

---

## 1. Metodologi Manajemen Proyek TIK: Prototyping & Agile (Scrum)

Proyek pembangunan **Siri-IoT ESP32 Smart Home System** ini dikelola menggunakan pendekatan hibrida (*hybrid methodology*) yang mengombinasikan **Evolutionary Prototyping Model** dan kerangka kerja **Agile (Scrum)**. 

### A. Rasionalisasi Pemilihan Metode Hibrida
Proyek berbasis internet of things (IoT) memiliki kompleksitas tinggi karena melibatkan dua domain utama secara simultan: **rekayasa perangkat keras (hardware engineering)** dan **rekayasa perangkat lunak (software engineering)**. 

Kombinasi kedua metode ini memberikan keunggulan strategis:
1. **Physical Prototype Validation (Prototyping)**: Mengurangi risiko ketidakcocokan perangkat keras (misalnya *miswiring*, ketidakstabilan tegangan, atau konflik alokasi pin GPIO ESP32) dengan memvalidasi sirkuit fisik secara dini melalui model iterasi prototipe.
2. **Iterative & Incremental Delivery (Agile/Scrum)**: Komponen software (React Dashboard, REST API Server, dan fungsionalitas Telegram Bot) dapat didevelop secara bertahap dalam siklus pengerjaan pendek (*Sprints*), memungkinkan tim untuk merespons masukan pengguna (*user feedback*) secara adaptif tanpa mengganggu arsitektur utama.
3. **Tight Resource Constrain Handling**: ESP32 memiliki memori SRAM dan Flash yang sangat terbatas. Penggabungan metode ini mempermudah proses refaktorisasi dini saat ditemukan kendala performa mikrokomputer.

---

### B. Detail Alur Siklus Hidup Pengembangan Sistem (SDLC)

```text
       ┌────────────────────────┐         ┌────────────────────────┐
       │ 1. Analisis Kebutuhan  │ ──────> │   2. Desain & Skema    │
       └────────────────────────┘         └────────────────────────┘
                    ▲                                  │
                    │ Recalibration                    ▼
       ┌────────────────────────┐         ┌────────────────────────┐
       │ 6. Handover & Release  │         │  3. Konstruksi & Code   │
       └────────────────────────┘         └────────────────────────┘
                    ▲                                  │
                    │                                  ▼
       ┌────────────────────────┐         ┌────────────────────────┐
       │ 5. Refactor & Optimasi │ <────── │ 4. Integrasi & Testing │
       └────────────────────────┘         └────────────────────────┘
```

#### 1. Analisis Kebutuhan Sistem (Requirements Analysis)
Pada tahap awal, dilakukan elisitasi kebutuhan sistem secara detail mencakup aspek fungsionalitas dan non-fungsionalitas:
*   **Analisis Perangkat Keras**: Mengidentifikasi sensor (DHT11/DHT22) dan aktuator (Relay 4-Channel), serta ketersediaan pin GPIO ESP32 yang aman untuk digunakan saat boot (menghindari pin strapping yang bisa menyebabkan kegagalan booting).
*   **Analisis Protokol**: Menetapkan format payload JSON minimal guna mereduksi kebutuhan memori RAM dinamis pada unit pemroses ESP32.
*   **Analisis Keamanan**: Menggunakan koneksi HTTP aman (HTTPS) dan integrasi SSL/TLS sidik jari sidik jari (*insecure mode* opsional untuk redundansi) demi kelancaran integrasi.

#### 2. Desain Arsitektur & Pemodelan Sistem (System Design)
Desain diterjemahkan ke dalam dokumentasi teknis yang jelas sebelum konstruksi kode dimulai:
*   **Arsitektur Blok Diagram**: Memetakan interaksi aliran data dari layer sensor fisik ke Express.js API server di Cloud dan bermuara di sisi pengguna (React Web Dashboard & Telegram Bot).
*   **Arsitektur Sirkuit**: Pembuatan skema jalur perkabelan (*wiring layout*) untuk mencegah interferensi sinyal atau *ground loop*.
*   **Flowchart Sistem**: Menentukan alur logika non-blocking timer di firmware agar pembacaan sensor, polling Telegram, dan siklus sinkronisasi server tidak saling menginterupsi (*multitasking simulation* via `millis()`).

#### 3. Konstruksi & Coding Terdistribusi (Implementation)
Konstruksi dibagi menjadi tiga alur parallel yang saling terintegrasi:
*   **Firmware Layer (C++)**: Penulisan skrip C++ native berbasis Arduino IDE yang efisien, berorientasi modular, dan menggunakan skema manajemen memori statis (`StaticJsonDocument` bukan `DynamicJsonDocument` untuk meminimalisasi fragmentasi HEAP).
*   **Backend Layer (TypeScript/Node.js)**: Pembuatan REST API dengan Express.js untuk menengahi sinkronisasi state pintu gerbang fisik dan dashboard secara *asynchronous*.
*   **Frontend Layer (React & Recharts)**: Perancangan antarmuka pengguna yang adaptif, bersih, ramah aksesibilitas, dilengkapi indikator telemetri interaktif dan konsol visualisasi log server tiruan.

#### 4. Integrasi, Pengujian, & QA Sistem (Integration Testing)
Pengujian dilakukan untuk menjamin reliabilitas operasi produk 24/7 tanpa hang:
*   **Unit Testing & Mocking**: Menguji performa API router menggunakan perkakas mock request, memastikan format JSON lolos validasi skema sebelum dikirim ke database atau ESP32.
*   **Integration Testing (Hardware-to-Cloud)**: Menghubungkan unit fisik luring ESP32 dengan dashboard REST API untuk menguji latensi tanggapan kontrol relay 4-kanal (diharapkan di bawah 500ms).
*   **Stress & Fallback Testing**: Melakukan tes stres pada sistem polling Telegram Bot dan penanganan koneksi jika Wi-Fi terputus di tengah jalan (*auto-rejoin routine*).

#### 5. Refaktorisasi & Optimalisasi Memori Mandatori (Refactoring)
Tahapan krusial untuk mengatasi keterbatasan fisik mikrokontroler:
*   **Incident Resolving**: Penemuan masalah boot loop fisik yang disebabkan oleh kesalahan dependensi inisialisasi hardware (`xQueueSemaphoreTake` queue panic). Solusi berupa perancangan scheduler booting aman (*boot scheduler*) dengan memisahkan instansiasi driver sensor dan inisialisasi Wi-Fi.
*   **Memory Footprint Optimization**: Membuang pustaka database berat (*Firebase_ESP_Client*) yang memakan penyimpanan flash ruang program lebih dari 70% dan menggantinya dengan pustaka bawaan `HTTPClient` yang super-ringan. Langkah ini sukses mereduksi ukuran binary program sebesar **hampir 40%**.

#### 6. Penyebaran & Serah Terima (Handover & Deployment)
*   **Dokumentasi Teknis**: Pembuatan panduan instalasi komprehensif, pemecahan masalah kesalahan kompilasi (*Troubleshooting Sketch Too Big*), skema wiring, dan berkas diagram sistem dalam format standar JSON (`flowchart.json` dan `block_diagram.json`).
*   **Deployment**: Penerapan container production Express.js di ekosistem Cloud Run dan build production aset statis React agar dapat diakses dari luar jaringan secara aman.

---

### C. Implementasi Agile (Scrum) dan Manajemen Sprints
Proyek diselesaikan dalam siklus pengerjaan pendek berdurasi **1 minggu per Sprint** untuk menjaga fokus dan kualitas:

1.  **Product Backlog Refinement**: Menyusun daftar seluruh fitur yang diminta (visualisasi grafik, kontrol relay, notifikasi Telegram, variasi sirkuit lampu).
2.  **Sprint Planning**: Di awal setiap pekan, tim memilih fungsionalitas prioritas tinggi dari backlog untuk diselesaikan dalam sprint tersebut.
3.  **Daily Standup (Tinjauan Harian)**: Sesi diskusi harian singkat (15 menit) untuk melaporkan:
    *   Apa yang telah dicapai kemarin?
    *   Apa yang akan dikerjakan hari ini?
    *   Apakah ada hambatan teknis (*blockers*)?
4.  **Sprint Review & Demo**: Mempresentasikan fungsionalitas prototipe IoT yang berhasil terintegrasi kepada pemangku kepentingan untuk memperoleh umpan balik langsung.
5.  **Sprint Retrospective**: Mengevaluasi performa tim, mendeteksi cacat alur pengerjaan, dan merumuskan langkah koreksi nyata untuk diterapkan pada Sprint berikutnya (seperti keputusan melepaskan integrasi SDK Firebase langsung demi efisiensi memori proyek).

---

---

## 2. Estimasi Biaya Proyek (Project Cost Estimation)

Berikut adalah perkiraan kebutuhan anggaran dana untuk pengembangan 1 (satu) unit sistem komplit Smart Home **Siri-IoT ESP32** skala rumah tangga/edu:

| Kategori | Nama Komponen / Layanan | Volume | Harga Satuan (IDR) | Total Harga (IDR) |
| :--- | :--- | :---: | :---: | :---: |
| **Hardware** | ESP32 NodeMCU Development Board v1 | 1 Unit | Rp 65.000 | Rp 65.000 |
| **Hardware** | Sensor Suhu & Kelembaban DHT22 (High Precision) | 1 Unit | Rp 35.000 | Rp 35.000 |
| **Hardware** | Modul Relay 4-Channel dengan Optocoupler isolation | 1 Unit | Rp 40.000 | Rp 40.000 |
| **Hardware** | Adaptor Daya 5V 2A + Kabel Micro USB (Power Source) | 1 Unit | Rp 45.000 | Rp 45.000|
| **Hardware** | Kabel Jumper (Dupont Wire F-F / M-F) & Breadboard | 1 Set | Rp 20.000 | Rp 20.000 |
| **Hardware** | Akrilik Enclosure custom (Box Sasis Pelindung) | 1 Unit | Rp 75.000 | Rp 75.000 |
| **Operasional** | Layanan Server Cloud Run (Hosting Dashboard REST API) | 1 Bln | Rp 50.000 | Rp 50.000 |
| **SDM** | Jasa Desain Sirkuit, UI Web, & Program Firmware | 1 Proyek | Rp 1.500.000 | Rp 1.500.000 |
| **Lain-lain** | Cadangan tak terduga & Uji Kelayakan Board | - | Rp 100.000 | Rp 100.000 |
| **TOTAL** | **Estimasi Seluruh Kebutuhan Anggaran** | | | **Rp 1.930.000** |

---

## 3. Estimasi Lama Pengerjaan (Project Timeline)

Proyek ini dirancang untuk selesai dalam jangka waktu efektif **4 Minggu (1 Bulan)** dengan alokasi pengerjaan sebagai berikut:

| Tahapan Aktivitas | Minggu 1 | Minggu 2 | Minggu 3 | Minggu 4 |
| :--- | :---: | :---: | :---: | :---: |
| **Studi Kelayakan, Analisis GPIO, & Pengadaan Hardware** | 🟩🟩🟩 | | | |
| **Wiring Hardware & Debugging Program C++ Lokal (Offline)** | | 🟩🟩🟩 | | |
| **Pembuatan Platform Dashboard React, Express API, & Integrasi Cloud** | | 🟩🟩🟩 | 🟩🟩🟩 | |
| **Siklus Uji Coba Integrasi (ESP32 <-> REST API, Polling Telegram, QA)** | | | | 🟩🟩🟩 |
| **Optimalisasi Memori (Melepas Firebase, HTTPClient), & Penyelesaian** | | | | 🟩🟩🟩 |

---

## 4. Struktur & Jalur Berkas Utama Proyek (Source Code Navigation)

Aplikasi utamanya dikoordinasikan secara penuh di bawah infrastruktur **AI Studio** dan **Arduino IDE** dengan lokasi berkas penting sebagai berikut:

### 1. File Source Code Dashboard Web (AI Studio)
- **`/server.ts`**: Merupakan pengendali sisi backend ExpressJS yang menangani endpoint sinkronisasi REST API `/api/esp32/sync` guna memperbarui kondisi data sensor sirkuit dan menyalurkan konfigurasi switch relay.
- **`/src/App.tsx`**: File komprehensif penampil aplikasi frontend visual sora, grafik analisis Recharts, kontrol interaktif 4 relay, log terminal replika, dan menyimpan kode template firmware sketch ESP32 sehingga pengguna dapat mengunduhnya langsung dari dashboard web.

### 2. File Source Code C++ (Arduino IDE)
Source code firmware ESP32 ter-integrasi langsung pada UI Dashboard web (Tab Dokumentasi/Sketch) agar serasi dengan perubahan topologi pin yang Anda pilih di antarmuka Web UI.
- **Pustaka Utama**: `#include <HTTPClient.h>`, `#include <UniversalTelegramBot.h>`, `#include <ArduinoJson.h>`, `#include <DHT.h>`.
- **Logika Loop Utama**: Memisahkan antrian delay non-blocking untuk:
  - Pembacaan DHT (5 Detik)
  - Polling Telegram Bot (1 Detik)
  - Sinkronisasi REST Server via `HTTPClient` POST (3 Detik)
