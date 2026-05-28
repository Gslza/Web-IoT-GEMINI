import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { SmartHomeState, ActivityLog, RelayState, HistoricalData } from "./src/types";

// Load environment variables
dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

// Middleware for parsing body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to get formatted local time (Indonesian UTC+7 style or standard)
const getFormattedTime = () => {
  const now = new Date();
  return now.toISOString().replace("T", " ").substring(0, 19);
};

// Generate initial 24 hours of simulated sensor data
const generateHistoricalData = (): HistoricalData[] => {
  const data: HistoricalData[] = [];
  const baseTemp = 26.5;
  const baseHumidity = 60.0;
  
  for (let i = 23; i >= 0; i--) {
    const time = new Date();
    time.setHours(time.getHours() - i);
    const hourStr = time.getHours().toString().padStart(2, "0") + ":00";
    
    // Simulate natural ambient changes (warmer in afternoon, cooler at night)
    const hour = time.getHours();
    const tempOffset = hour >= 11 && hour <= 16 ? 3.5 : hour >= 1 && hour <= 6 ? -2.0 : 0;
    const humOffset = hour >= 11 && hour <= 16 ? -8.0 : hour >= 1 && hour <= 6 ? 6.0 : 0;
    
    // Random fluctuation
    const randTemp = (Math.random() - 0.5) * 0.8;
    const randHum = (Math.random() - 0.5) * 3;

    data.push({
      time: hourStr,
      temp: parseFloat((baseTemp + tempOffset + randTemp).toFixed(1)),
      humidity: parseFloat((baseHumidity + humOffset + randHum).toFixed(1)),
    });
  }
  return data;
};

// In-Memory Database State
const state: SmartHomeState = {
  relay: {
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  },
  sensor: {
    temperature: 27.5,
    humidity: 64.2,
    last_update: getFormattedTime(),
  },
  esp32: {
    status: "offline",
    wifi_signal: "Tidak Terkoneksi",
    ip_address: "0.0.0.0",
    last_ping: "",
  },
  command: {
    source: "system",
    last_command: "SISTEM_BOOT",
    updated_at: getFormattedTime(),
  },
  activity_log: [
    {
      id: "1",
      time: getFormattedTime(),
      event: "Dashboard Smart Home diaktifkan (Sistem Cloud Ready)",
      source: "system",
      type: "info"
    },
    {
      id: "2",
      time: getFormattedTime(),
      event: "Menunggu koneksi dari perangkat kontroler ESP32...",
      source: "system",
      type: "warning"
    }
  ],
  historical_data: generateHistoricalData(),
};

// Helper to push to log
const addLog = (event: string, source: "web" | "telegram" | "voice" | "ai" | "system" | "esp32", type: "info" | "success" | "warning" | "danger" = "info") => {
  const newLog: ActivityLog = {
    id: generateId(),
    time: getFormattedTime(),
    event,
    source,
    type,
  };
  state.activity_log.unshift(newLog); // Prepend to show most recent first
  // Max logs limit logic
  if (state.activity_log.length > 50) {
    state.activity_log.pop();
  }
};

// Periodic self-checker for offline status of ESP32 (if no ping in 8 seconds)
setInterval(() => {
  if (state.esp32.status === "online" && state.esp32.last_ping) {
    const lastPingTime = new Date(state.esp32.last_ping.replace(" ", "T") + "Z").getTime();
    // Use local time check or simple timeout block
    const elapsedSeconds = (Date.now() - lastPingTime) / 1000;
    
    // If elapsed is longer than 15 seconds, mark offline
    if (elapsedSeconds > 15) {
      state.esp32.status = "offline";
      state.esp32.wifi_signal = "Terputus";
      addLog("ESP32 dinyatakan Offline karena putus koneksi (Timeout ping)", "system", "danger");
    }
  }
}, 5000);

// Initialize Gemini API Client
let geminiClient: GoogleGenAI | null = null;
const initGemini = () => {
  if (!geminiClient) {
    const api_key = process.env.GEMINI_API_KEY;
    if (api_key && api_key !== "MY_GEMINI_API_KEY") {
      geminiClient = new GoogleGenAI({
        apiKey: api_key,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("Gemini Client successfully initialized.");
    }
  }
  return geminiClient;
};

// --- CORE REST API ENDPOINTS ---

// GET /api/status - Get current Smart Home state
app.get("/api/status", (req, res) => {
  res.json(state);
});

// POST /api/relay - Set relay state
app.post("/api/relay", (req, res) => {
  const { relayId, value, source = "web" } = req.body;
  const commandSource = source as any;

  if (relayId === "all") {
    state.relay.relay1 = !!value;
    state.relay.relay2 = !!value;
    state.relay.relay3 = !!value;
    state.relay.relay4 = !!value;
    
    state.command = {
      source: commandSource,
      last_command: value ? "ALL_ON" : "ALL_OFF",
      updated_at: getFormattedTime(),
    };
    
    const statusText = value ? "AKTIF" : "NONAKTIF";
    addLog(`Semua Relay (${statusText}) dikomando melalui ${commandSource.toUpperCase()}`, commandSource, value ? "success" : "warning");
    return res.json({ success: true, state });
  }

  if (state.relay[relayId] !== undefined) {
    state.relay[relayId] = !!value;
    
    state.command = {
      source: commandSource,
      last_command: `${relayId.toUpperCase()}_${value ? "ON" : "OFF"}`,
      updated_at: getFormattedTime(),
    };
    
    const deviceNames: Record<string, string> = {
      relay1: "Relay 1 (Lampu Teras)",
      relay2: "Relay 2 (Lampu Kamar)",
      relay3: "Relay 3 (Lampu Ruang Tamu)",
      relay4: "Relay 4 (Kipas Angin / AC)",
    };
    
    const deviceLabel = deviceNames[relayId] || relayId;
    const actionText = value ? "Dinyalakan" : "Dimatikan";
    addLog(`${deviceLabel} ${actionText} via ${commandSource.toUpperCase()}`, commandSource, value ? "success" : "warning");
    
    return res.json({ success: true, state });
  }

  res.status(400).json({ error: "relayId tida valid atau hilang" });
});

// POST /api/variation - Set Lamp Variation command
app.post("/api/variation", (req, res) => {
  const { variationId, source = "web" } = req.body;
  const commandSource = source as any;

  if (variationId === 1 || variationId === 2) {
    state.command = {
      source: commandSource,
      last_command: `VARIASI_${variationId}`,
      updated_at: getFormattedTime(),
    };
    
    addLog(`Memulai pola Variasi Lampu ${variationId} melalui ${commandSource.toUpperCase()}`, commandSource, "info");
    return res.json({ success: true, state });
  }

  res.status(400).json({ error: "variationId tidak valid" });
});

// POST /api/all-off - Turn all relays off
app.post("/api/all-off", (req, res) => {
  const { source = "web" } = req.body;
  const commandSource = source as any;

  state.relay.relay1 = false;
  state.relay.relay2 = false;
  state.relay.relay3 = false;
  state.relay.relay4 = false;

  state.command = {
    source: commandSource,
    last_command: "ALL_OFF",
    updated_at: getFormattedTime(),
  };

  addLog(`Semua Relay DIMATIKAN melalui ${commandSource.toUpperCase()}`, commandSource, "warning");
  res.json({ success: true, state });
});

// POST /api/esp32/sync - Synchronization endpoint for physical / simulated ESP32
app.post("/api/esp32/sync", (req, res) => {
  const { temperature, humidity, wifi_signal, ip_address, relay, is_simulated } = req.body;
  
  // Set ESP32 status variables
  state.esp32.status = "online";
  state.esp32.wifi_signal = wifi_signal || "-60 dBm";
  state.esp32.ip_address = ip_address || "192.168.1.100";
  state.esp32.last_ping = getFormattedTime();
  
  // Log telemetry connection
  const prevSyncStatus = state.esp32.status;
  
  // Update sensors
  if (temperature !== undefined) {
    state.sensor.temperature = parseFloat(temperature);
  }
  if (humidity !== undefined) {
    state.sensor.humidity = parseFloat(humidity);
  }
  state.sensor.last_update = getFormattedTime();

  // If ESP32 reports its active relay statuses, synchronize them with server unless override command is newer
  if (relay) {
    // If the last command was from Telegram or ESP32 itself, let ESP32 state override server master relay state
    if (state.command.source === "telegram" || state.command.source === "system" || is_simulated) {
      if (relay.relay1 !== undefined) state.relay.relay1 = !!relay.relay1;
      if (relay.relay2 !== undefined) state.relay.relay2 = !!relay.relay2;
      if (relay.relay3 !== undefined) state.relay.relay3 = !!relay.relay3;
      if (relay.relay4 !== undefined) state.relay.relay4 = !!relay.relay4;
    }
  }

  // If simulated, sometimes feed random variations to chart
  if (is_simulated) {
    // Modify current temp/humidity slightly on server for animation demonstration
    state.sensor.temperature = parseFloat((state.sensor.temperature + (Math.random() - 0.5) * 0.2).toFixed(1));
    state.sensor.humidity = parseFloat((state.sensor.humidity + (Math.random() - 0.5) * 0.5).toFixed(1));
    
    // Periodically (10% chance) add a telemetry logging point to chart array
    if (Math.random() < 0.1) {
      const now = new Date();
      const hourStr = now.getHours().toString().padStart(2, "0") + ":" + now.getMinutes().toString().padStart(2, "0");
      
      state.historical_data.push({
        time: hourStr,
        temp: state.sensor.temperature,
        humidity: state.sensor.humidity,
      });

      if (state.historical_data.length > 24) {
        state.historical_data.shift(); // Keep max 24
      }
    }
  }

  // Returns the current target relay state and commands back to the ESP32
  res.json({
    success: true,
    target_relay: state.relay,
    command: state.command
  });
});

// POST /api/chat - AI Home Assistant voice control translation and chat handling based on Gemini 3.5 Flash
app.post("/api/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: "Pesan tidak boleh kosong." });
  }

  const client = initGemini();
  const currentStatusString = `
    Status Rumah Pintar Saat Ini (Waktu ${getFormattedTime()}):
    - Temp: ${state.sensor.temperature}°C, Humidity: ${state.sensor.humidity}%
    - Lampu 1 (Relay 1): ${state.relay.relay1 ? "ON / MENYALA" : "OFF / MATI"}
    - Lampu 2 (Relay 2): ${state.relay.relay2 ? "ON / MENYALA" : "OFF / MATI"}
    - Lampu 3 (Relay 3): ${state.relay.relay3 ? "ON / MENYALA" : "OFF / MATI"}
    - Lampu 4 (Relay 4 / Kipas): ${state.relay.relay4 ? "ON / MENYALA" : "OFF / MATI"}
    - Status ESP32: ${state.esp32.status}
  `;

  // Fallback Rule: If no API key, do intelligent NLP based on text parsing
  if (!client) {
    // Native keyword mapper for offline mode
    const msgLower = message.toLowerCase();
    let reply = "Saya siap membantu mengontrol rumah Anda! Silakan masukkan kunci API Gemini di tab Settings jika ingin menguji kecerdasan buatan penuh. ";
    let commandExecuted = null;

    if (msgLower.includes("nyalakan lampu 1") || msgLower.includes("lampu 1 on") || msgLower.includes("lampu 1 hidup")) {
      state.relay.relay1 = true;
      state.command = { source: "ai", last_command: "RELAY1_ON", updated_at: getFormattedTime() };
      reply = "Baik, saya telah memproses perintah Anda: Lampu Teras (Relay 1) telah dinyalakan.";
      commandExecuted = { type: "control_relay", target: "relay1", value: true };
      addLog("Lampu Teras Dinyalakan lewat pintasan asisten AI (Pencocokan Keyword)", "ai", "success");
    } else if (msgLower.includes("matikan lampu 1") || msgLower.includes("lampu 1 off") || msgLower.includes("lampu 1 mati")) {
      state.relay.relay1 = false;
      state.command = { source: "ai", last_command: "RELAY1_OFF", updated_at: getFormattedTime() };
      reply = "Baik, saya telah memproses perintah Anda: Lampu Teras (Relay 1) telah dimatikan.";
      commandExecuted = { type: "control_relay", target: "relay1", value: false };
      addLog("Lampu Teras Dimatikan lewat asisten AI", "ai", "warning");
    } else if (msgLower.includes("nyalakan lampu 2") || msgLower.includes("lampu 2 on") || msgLower.includes("lampu 2 hidup")) {
      state.relay.relay2 = true;
      state.command = { source: "ai", last_command: "RELAY2_ON", updated_at: getFormattedTime() };
      reply = "Perintah dipahami. Lampu Kamar (Relay 2) sekarang menyala.";
      commandExecuted = { type: "control_relay", target: "relay2", value: true };
      addLog("Lampu Kamar Dinyalakan via Asisten AI", "ai", "success");
    } else if (msgLower.includes("matikan lampu 2") || msgLower.includes("lampu 2 off") || msgLower.includes("lampu 2 mati")) {
      state.relay.relay2 = false;
      state.command = { source: "ai", last_command: "RELAY2_OFF", updated_at: getFormattedTime() };
      reply = "Baik, Lampu Kamar (Relay 2) telah dipadamkan.";
      commandExecuted = { type: "control_relay", target: "relay2", value: false };
      addLog("Lampu Kamar Dimatikan via Asisten AI", "ai", "warning");
    } else if (msgLower.includes("nyalakan lampu 3") || msgLower.includes("lampu 3 on") || msgLower.includes("lampu 3 hidup")) {
      state.relay.relay3 = true;
      state.command = { source: "ai", last_command: "RELAY3_ON", updated_at: getFormattedTime() };
      reply = "Lampu Ruang Tamu (Relay 3) sekarang dalam kondisi menyala aktif.";
      commandExecuted = { type: "control_relay", target: "relay3", value: true };
      addLog("Lampu Ruang Tamu Dinyalakan via Asisten AI", "ai", "success");
    } else if (msgLower.includes("matikan lampu 3") || msgLower.includes("lampu 3 off") || msgLower.includes("lampu 3 mati")) {
      state.relay.relay3 = false;
      state.command = { source: "ai", last_command: "RELAY3_OFF", updated_at: getFormattedTime() };
      reply = "Lampu Ruang Tamu (Relay 3) berhasil dimatikan.";
      commandExecuted = { type: "control_relay", target: "relay3", value: false };
      addLog("Lampu Ruang Tamu Dimatikan via Asisten AI", "ai", "warning");
    } else if (msgLower.includes("nyalakan kipas") || msgLower.includes("nyalakan ac") || msgLower.includes("nyalakan lampu 4") || msgLower.includes("lampu 4 on")) {
      state.relay.relay4 = true;
      state.command = { source: "ai", last_command: "RELAY4_ON", updated_at: getFormattedTime() };
      reply = "Ok, Relay 4 (Kipas Angin / AC) telah dinyalakan untuk Anda.";
      commandExecuted = { type: "control_relay", target: "relay4", value: true };
      addLog("Lampu 4/AC Dinyalakan via Asisten AI", "ai", "success");
    } else if (msgLower.includes("matikan kipas") || msgLower.includes("matikan ac") || msgLower.includes("matikan lampu 4") || msgLower.includes("lampu 4 off")) {
      state.relay.relay4 = false;
      state.command = { source: "ai", last_command: "RELAY4_OFF", updated_at: getFormattedTime() };
      reply = "Ok, Relay 4 (Kipas Angin / AC) telah ditiadakan aliran dayanya (OFF).";
      commandExecuted = { type: "control_relay", target: "relay4", value: false };
      addLog("Lampu 4/AC Dimatikan via Asisten AI", "ai", "warning");
    } else if (msgLower.includes("semua lampu mati") || msgLower.includes("matikan semua") || msgLower.includes("all off")) {
      state.relay.relay1 = false;
      state.relay.relay2 = false;
      state.relay.relay3 = false;
      state.relay.relay4 = false;
      state.command = { source: "ai", last_command: "ALL_OFF", updated_at: getFormattedTime() };
      reply = "Pemadaman total disetujui! Semua relay berhasil diputus.";
      commandExecuted = { type: "all_off" };
      addLog("Sistem mematikan semua lampu via AI", "ai", "warning");
    } else if (msgLower.includes("semua lampu hidup") || msgLower.includes("nyalakan semua") || msgLower.includes("all on")) {
      state.relay.relay1 = true;
      state.relay.relay2 = true;
      state.relay.relay3 = true;
      state.relay.relay4 = true;
      state.command = { source: "ai", last_command: "ALL_ON", updated_at: getFormattedTime() };
      reply = "Mengaktifkan seluruh perangkat listrik. Tetap amati daya beban listrik Anda!";
      commandExecuted = { type: "all_on" };
      addLog("Sistem menyalakan semua lampu via AI", "ai", "success");
    } else if (msgLower.includes("variasi 1") || msgLower.includes("pola 1")) {
      state.command = { source: "ai", last_command: "VARIASI_1", updated_at: getFormattedTime() };
      reply = "Memulai pola variasi running led 1 pada rangkaian relay.";
      commandExecuted = { type: "variation", variation: 1 };
      addLog("Variasi 1 diaktifkan via AI", "ai", "info");
    } else if (msgLower.includes("variasi 2") || msgLower.includes("pola 2")) {
      state.command = { source: "ai", last_command: "VARIASI_2", updated_at: getFormattedTime() };
      reply = "Memulai pola flashing led 2 pada rangkaian relay.";
      commandExecuted = { type: "variation", variation: 2 };
      addLog("Variasi 2 diaktifkan via AI", "ai", "info");
    } else if (msgLower.includes("suhu") || msgLower.includes("temperatur") || msgLower.includes("kelembapan") || msgLower.includes("sensor")) {
      reply = `Tentu! Pembacaan DHT sensor saat ini adalah:\n🌡️ Suhu: **${state.sensor.temperature}°C**\n💧 Kelembapan: **${state.sensor.humidity}%**\nTerakhir disinkronkan pada ${state.sensor.last_update}.`;
    } else {
      reply = `Halo! Saya asisten IoT Anda. Saya melihat Anda mengajukan pertanyaan: "${message}". Untuk saat ini, Anda bisa mencoba kontrol NLP offline seperti "nyalakan lampu 1", "matikan lampu 2", "cek suhu", atau "matikan semua". Ingin menguji asisten bertenaga Gemini yang sesungguhnya? Konfigurasikan API Key Anda di Settings!`;
    }
    
    return res.json({ reply, commandExecuted });
  }

  try {
    const sysInstruction = `
      Anda adalah asisten AI perorangan untuk Smart Home IoT bernama "Siri-Iot" (Bahasa Indonesia).
      Tugas utama Anda adalah:
      1. Memahami percakapan pengguna mengenai status sensor atau mengontrol relay 4 channel.
      2. Menganalisis ucapan (yang berasal dari ketikan suara Telegram atau input teks dashboard) dan menghasilkan JSON response yang terstruktur dengan format ketat.
      
      Struktur status instrumen saat ini diberikan dalam deskripsi prompt.
      Dinasikan perintah Anda sesuai daftar berikut:
      - Relay 1: Lampu Teras
      - Relay 2: Lampu Kamar
      - Relay 3: Lampu Ruang Tamu
      - Relay 4: Kipas Angin / AC
      
      Tipe aksi yang diperbolehkan di 'command':
      - 'control_relay': Ubah status relay individu. Harus menentukan properti 'relay' ('relay1', 'relay2', 'relay3', 'relay4') dan 'value' (true/false).
      - 'all_off': Mematikan semua relay.
      - 'all_on': Menyalakan semua relay.
      - 'variation': Menjalankan variasi pola relay. Harus menyertakan properti 'variation' (1 atau 2).
      - 'none': Jika tidak ada perintah kontrol (misal hanya bertanya kabar, mengobrol, atau menanyakan suhu tanpa tindakan mengubah state).
      
      Anda WAJIB memberikan respon sesuai responseSchema JSON yang diminta. Berikan jawaban yang bersahabat, sopan dan optimis dalam Bahasa Indonesia yang singkat.
    `;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: `${currentStatusString}\nUser Input: "${message}"`,
      config: {
        systemInstruction: sysInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: "Tanggapan asisten robot yang ramah menjelaskan apa yang ia lakukan untuk melayani perintah dalam Bahasa Indonesia."
            },
            command: {
              type: Type.OBJECT,
              properties: {
                type: {
                  type: Type.STRING,
                  description: "Nama aksi: 'control_relay', 'all_off', 'all_on', 'variation', atau 'none'"
                },
                relay: {
                  type: Type.STRING,
                  description: "Target relay jika kontrol individual: 'relay1', 'relay2', 'relay3', 'relay4'. Selain itu set 'none'."
                },
                value: {
                  type: Type.BOOLEAN,
                  description: "Nilai toggle relay jika individu atau keseluruhan (true menyala, false mati)."
                },
                variation: {
                  type: Type.INTEGER,
                  description: "Nomor pola variasi jika tipe aksi adalah 'variation': 1 atau 2. Selain itu set ke 0."
                }
              },
              required: ["type"]
            }
          },
          required: ["reply", "command"]
        }
      }
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    const parsedCommand = parsedResponse.command || { type: "none" };

    let commandExecuted = null;

    // Apply parsed commands to our real state!
    if (parsedCommand.type === "control_relay" && parsedCommand.relay && parsedCommand.relay !== "none") {
      const rId = parsedCommand.relay;
      const bVal = parsedCommand.value !== undefined ? parsedCommand.value : true;
      state.relay[rId] = bVal;
      state.command = {
        source: "ai",
        last_command: `${rId.toUpperCase()}_${bVal ? "ON" : "OFF"}`,
        updated_at: getFormattedTime()
      };
      commandExecuted = { type: "control_relay", target: rId, value: bVal };
      
      const deviceNames: Record<string, string> = {
        relay1: "Lampu Teras",
        relay2: "Lampu Kamar",
        relay3: "Lampu Ruang Tamu",
        relay4: "Kipas/AC",
      };
      addLog(`${deviceNames[rId] || rId} diatur ke ${bVal ? "ON" : "OFF"} via AI Voice Command`, "ai", bVal ? "success" : "warning");
    } else if (parsedCommand.type === "all_off") {
      state.relay.relay1 = false;
      state.relay.relay2 = false;
      state.relay.relay3 = false;
      state.relay.relay4 = false;
      state.command = {
        source: "ai",
        last_command: "ALL_OFF",
        updated_at: getFormattedTime()
      };
      commandExecuted = { type: "all_off" };
      addLog("Memadamkan seluruh lampu atas rekomendasi asisten AI", "ai", "warning");
    } else if (parsedCommand.type === "all_on") {
      state.relay.relay1 = true;
      state.relay.relay2 = true;
      state.relay.relay3 = true;
      state.relay.relay4 = true;
      state.command = {
        source: "ai",
        last_command: "ALL_ON",
        updated_at: getFormattedTime()
      };
      commandExecuted = { type: "all_on" };
      addLog("Mengaktifkan seluruh lampu atas rekomendasi asisten AI", "ai", "success");
    } else if (parsedCommand.type === "variation" && (parsedCommand.variation === 1 || parsedCommand.variation === 2)) {
      const vId = parsedCommand.variation;
      state.command = {
        source: "ai",
        last_command: `VARIASI_${vId}`,
        updated_at: getFormattedTime()
      };
      commandExecuted = { type: "variation", variation: vId };
      addLog(`Menjalankan Variasi ${vId} via Komando AI`, "ai", "info");
    }

    res.json({
      reply: parsedResponse.reply || "Perintah berhasil diproses oleh Asisten Pintar.",
      commandExecuted
    });
  } catch (error: any) {
    console.error("Gemini text analysis failure:", error);
    res.json({
      reply: `Maaf, saya mengalami disfungsi kognitif sejenak saat memproses kalimat Anda. Namun status rumah Anda: Suhu ${state.sensor.temperature}°C, Lampu 1:${state.relay.relay1?'ON':'OFF'}, Kipas:${state.relay.relay4?'ON':'OFF'}.`,
      error: error.message
    });
  }
});


// Start server using Vite middleware integration
async function startServer() {
  // Vite Server Middleware context integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Home System Server running on http://localhost:${PORT}`);
  });
}

startServer();
