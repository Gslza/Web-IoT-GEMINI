import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  Lightbulb, 
  LineChart, 
  Cpu, 
  FileText, 
  Settings, 
  Wifi, 
  WifiOff, 
  Thermometer, 
  Droplets,
  Zap, 
  CornerDownLeft, 
  ExternalLink, 
  Printer, 
  AlertTriangle, 
  Plus, 
  Trash2, 
  RefreshCw,
  Sliders,
  Send,
  HelpCircle,
  Clock,
  Play,
  Square,
  Activity,
  CheckCircle,
  ChevronRight,
  ShieldAlert
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from "recharts";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import AiAssistant from "./components/AiAssistant";
import { SmartHomeState, RelayState, SensorState, Esp32State, ActivityLog } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  
  // App states synchronized with `/api/status`
  const [state, setState] = useState<SmartHomeState>({
    relay: {
      relay1: false,
      relay2: false,
      relay3: false,
      relay4: false,
    },
    sensor: {
      temperature: 27.5,
      humidity: 64.2,
      last_update: "",
    },
    esp32: {
      status: "offline",
      wifi_signal: "Good (-65 dBm)",
      ip_address: "192.168.1.120",
      last_ping: "",
    },
    command: {
      source: "system",
      last_command: "SISTEM_BOOT",
      updated_at: "",
    },
    activity_log: [],
    historical_data: [],
  });
  
  // Local state for ESP32 hardware simulator inputs
  const [simTemp, setSimTemp] = useState<number>(27.5);
  const [simHumidity, setSimHumidity] = useState<number>(64.2);
  const [simWifi, setSimWifi] = useState<string>("-65 dBm");
  const [simIP, setSimIP] = useState<string>("192.168.1.120");
  const [simRelay, setSimRelay] = useState<RelayState>({
    relay1: false,
    relay2: false,
    relay3: false,
    relay4: false,
  });

  // Report Form Inputs
  const [studentName, setStudentName] = useState<string>("Putri Naira Salsabila");
  const [studentNIM, setStudentNIM] = useState<string>("21051204088");
  const [studentClass, setStudentClass] = useState<string>("S1 Teknik Informatika B");

  // Fetch current state from REST API
  const fetchState = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setState(data);
      
      // Sync simulator dials when state changes
      if (!isSimulated) {
        setSimRelay(data.relay);
        setSimTemp(data.sensor.temperature);
        setSimHumidity(data.sensor.humidity);
      }
    } catch (err) {
      console.error("Gagal sinkronisasi data server:", err);
    }
  };

  // Perform a manual relay toggle
  const toggleRelay = async (relayId: string, val: boolean) => {
    try {
      const response = await fetch("/api/relay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relayId, value: val, source: "web" }),
      });
      const data = await response.json();
      if (data.success) {
        setState(data.state);
        if (isSimulated) {
          setSimRelay(data.state.relay);
        }
      }
    } catch (err) {
      console.error("Gagal toggle relay:", err);
    }
  };

  // Set Lamp Variation
  const triggerVariation = async (variationId: number) => {
    try {
      const response = await fetch("/api/variation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variationId, source: "web" }),
      });
      const data = await response.json();
      if (data.success) {
        setState(data.state);
      }
    } catch (err) {
      console.error("Gagal trigger variasi:", err);
    }
  };

  // Turn off all Relays
  const triggerAllOff = async () => {
    try {
      const response = await fetch("/api/all-off", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "web" }),
      });
      const data = await response.json();
      if (data.success) {
        setState(data.state);
        if (isSimulated) {
          setSimRelay(data.state.relay);
        }
      }
    } catch (err) {
      console.error("Gagal matikan semua relay:", err);
    }
  };

  // Dedicated simulator background sync ping to mimic real ESP32 sending metrics regularly
  useEffect(() => {
    if (!isSimulated) return;

    const interval = setInterval(async () => {
      try {
        const payload = {
          temperature: simTemp,
          humidity: simHumidity,
          wifi_signal: simWifi,
          ip_address: simIP,
          relay: simRelay,
          is_simulated: true,
        };

        const res = await fetch("/api/esp32/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          // Sync server commands back to virtual LEDs
          setSimRelay(data.target_relay);
          fetchState();
        }
      } catch (err) {
        console.warn("Simulator ping failed:", err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isSimulated, simTemp, simHumidity, simWifi, simIP, simRelay]);

  // Regular dashboard stats update poller (every 5 seconds)
  useEffect(() => {
    fetchState();
    const poller = setInterval(fetchState, 5000);
    return () => clearInterval(poller);
  }, []);

  // Quick helper to calculate active power estimation (simulating a real IoT device)
  const getPowerUsed = () => {
    let power = 0;
    if (state.relay.relay1) power += 15; // Lampu Teras 15 Watt
    if (state.relay.relay2) power += 10; // Lampu Kamar 10 Watt
    if (state.relay.relay3) power += 25; // Lampu Ruang Tamu 25 Watt
    if (state.relay.relay4) power += 40; // Kipas Angin 40 Watt
    return power;
  };

  // Print quiz report call
  const printReport = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        espStatus={state.esp32.status} 
      />

      {/* Main Container Grid offset by custom Navigation Bar width of 64 */}
      <div id="main-content-layout" className="flex-1 min-w-0 md:pl-64 flex flex-col min-h-screen">
        {/* Dynamic Topbar details */}
        <Topbar esp32={state.esp32} isSimulated={isSimulated} />

        {/* Dashboard Content Tabs Switcher */}
        <div id="scrollable-content-tab" className="p-4 md:p-6 flex-1 space-y-6">
          
          {/* Welcome Smart Banner Section */}
          <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] p-5 rounded-2xl text-white flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800 shadow-sm">
            <div className="space-y-1">
              <h1 className="text-xl md:text-2xl font-bold font-sans tracking-tight">
                Selamat Datang di Siri-IoT Smart Home
              </h1>
              <p className="text-xs text-slate-400">
                Pusat monitoring dan kontrol relay 4 channel via bot Telegram, web dashboard, dan asisten suara bahasa indonesia secara real-time.
              </p>
            </div>
            
            {/* Quick Online Status Action */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 border border-slate-700 rounded-xl p-2.5 flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-400">Simulator ESP32:</span>
                <button 
                  id="btn-simulator-toggle"
                  onClick={() => setIsSimulated(!isSimulated)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    isSimulated 
                      ? "bg-blue-600 text-white hover:bg-blue-500 shadow-sm" 
                      : "bg-slate-700 text-slate-300 hover:text-white"
                  }`}
                >
                  {isSimulated ? "AKTIF (Online)" : "NONAKTIF (Gunakan Alat Fisik)"}
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: OVERVIEW DASHBOARD */}
          {activeTab === "dashboard" && (
            <div id="tab-dashboard-overview" className="space-y-6">
              
              {/* Quick High Density Sensor Telemetry Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* Temperature Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Suhu Ruangan</span>
                    <div className="p-1.5 bg-orange-50 border border-orange-100 text-orange-600 rounded-lg">
                      <Thermometer size={16} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <p className="text-2xl md:text-3xl font-extrabold font-sans text-slate-900 tracking-tight">
                      {state.sensor.temperature.toFixed(1)}
                    </p>
                    <span className="text-sm font-semibold text-slate-400">°C</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Keadaan:</span>
                    <span className={`font-semibold ${state.sensor.temperature > 29 ? "text-orange-600" : "text-emerald-600"}`}>
                      {state.sensor.temperature > 29 ? "Hangat" : "Optimal (Suhu Nyaman)"}
                    </span>
                  </div>
                </div>

                {/* Humidity Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Kelembaban</span>
                    <div className="p-1.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-lg">
                      <Droplets size={16} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <p className="text-2xl md:text-3xl font-extrabold font-sans text-slate-900 tracking-tight">
                      {state.sensor.humidity.toFixed(1)}
                    </p>
                    <span className="text-sm font-semibold text-slate-400">% RH</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Kelembaban:</span>
                    <span className="text-emerald-600 font-semibold">Normal</span>
                  </div>
                </div>

                {/* Estimated Power Consumption Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 font-sans">Estimasi Beban</span>
                    <div className="p-1.5 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-lg animate-pulse">
                      <Zap size={16} />
                    </div>
                  </div>
                  <div className="mt-4 flex items-baseline gap-1">
                    <p className="text-2xl md:text-3xl font-extrabold font-sans text-slate-900 tracking-tight">
                      {getPowerUsed()}
                    </p>
                    <span className="text-sm font-semibold text-slate-400">Watt</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Sertifikasi:</span>
                    <span className="text-blue-500 font-semibold font-mono">Simulasi Beban</span>
                  </div>
                </div>

                {/* Gateway Connection Sync Card */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between select-none">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Terakhir Pembaruan</span>
                    <div className="p-1.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-lg">
                      <Clock size={16} />
                    </div>
                  </div>
                  <div className="mt-4 overflow-hidden text-ellipsis">
                    <p className="text-xs font-mono font-bold text-slate-800 leading-none">
                      {state.sensor.last_update ? state.sensor.last_update.split(" ")[1] || "—" : "Menunggu Sync"}
                    </p>
                    <span className="text-[9px] text-slate-400 mt-1 block">
                      {state.sensor.last_update ? state.sensor.last_update.split(" ")[0] : "Offline Gateways"}
                    </span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Status Server:</span>
                    <span className="text-green-600 font-semibold font-mono">Running</span>
                  </div>
                </div>

              </div>

              {/* Main Control Panel: Relay Control center & Intelligent Assistant Chat */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                
                {/* 4 Ch Relays Panel */}
                <div className="xl:col-span-7 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm uppercase font-extrabold tracking-wider text-slate-500">Saklar Relay IoT (Beban Lampu)</h2>
                      <p className="text-xs text-slate-400">Klik saklar bulat untuk me-toggle relay fisik atau simulasi</p>
                    </div>
                    
                    {/* Quick Command Header Sync Indicator */}
                    {state.command.last_command && (
                      <div className="text-right text-[10px] text-slate-400">
                        Perintah Terakhir:{" "}
                        <span className="font-mono bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-blue-600 font-bold uppercase">
                          {state.command.last_command}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 4 Channels Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Relay channel 1 */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      state.relay.relay1 
                        ? "bg-white border-green-200 shadow-sm" 
                        : "bg-white border-slate-200 opacity-80"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${state.relay.relay1 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          <Lightbulb size={20} className={state.relay.relay1 ? "animate-pulse" : ""} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-700">Relay 1 (Lampu Teras)</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${state.relay.relay1 ? "text-green-600" : "text-slate-400"}`}>
                            {state.relay.relay1 ? "● Menyala (ON)" : "● Mati (OFF)"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Checkbox Styled Slide Switcher */}
                      <button 
                        onClick={() => toggleRelay("relay1", !state.relay.relay1)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          state.relay.relay1 ? "bg-green-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                          state.relay.relay1 ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    {/* Relay channel 2 */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      state.relay.relay2 
                        ? "bg-white border-green-200 shadow-sm" 
                        : "bg-white border-slate-200 opacity-80"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${state.relay.relay2 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          <Lightbulb size={20} className={state.relay.relay2 ? "animate-pulse" : ""} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-700">Relay 2 (Lampu Kamar)</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${state.relay.relay2 ? "text-green-600" : "text-slate-400"}`}>
                            {state.relay.relay2 ? "● Menyala (ON)" : "● Mati (OFF)"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Checkbox Styled Slide Switcher */}
                      <button 
                        onClick={() => toggleRelay("relay2", !state.relay.relay2)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          state.relay.relay2 ? "bg-green-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                          state.relay.relay2 ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    {/* Relay channel 3 */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      state.relay.relay3 
                        ? "bg-white border-green-200 shadow-sm" 
                        : "bg-white border-slate-200 opacity-80"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${state.relay.relay3 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          <Lightbulb size={20} className={state.relay.relay3 ? "animate-pulse" : ""} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-700">Relay 3 (Lampu Tamu)</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${state.relay.relay3 ? "text-green-600" : "text-slate-400"}`}>
                            {state.relay.relay3 ? "● Menyala (ON)" : "● Mati (OFF)"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Checkbox Styled Slide Switcher */}
                      <button 
                        onClick={() => toggleRelay("relay3", !state.relay.relay3)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          state.relay.relay3 ? "bg-green-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                          state.relay.relay3 ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                    {/* Relay channel 4 */}
                    <div className={`p-4 rounded-xl border transition-all flex items-center justify-between ${
                      state.relay.relay4 
                        ? "bg-white border-green-200 shadow-sm" 
                        : "bg-white border-slate-200 opacity-80"
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-full ${state.relay.relay4 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                          <TvIcon className={state.relay.relay4 ? "animate-pulse" : ""} />
                        </div>
                        <div>
                          <h3 className="font-bold text-xs text-slate-700">Relay 4 (Kipas / AC)</h3>
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${state.relay.relay4 ? "text-green-600" : "text-slate-400"}`}>
                            {state.relay.relay4 ? "● Menyala (ON)" : "● Mati (OFF)"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Checkbox Styled Slide Switcher */}
                      <button 
                        onClick={() => toggleRelay("relay4", !state.relay.relay4)}
                        className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                          state.relay.relay4 ? "bg-green-500" : "bg-slate-200"
                        }`}
                      >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all shadow-sm ${
                          state.relay.relay4 ? "right-1" : "left-1"
                        }`} />
                      </button>
                    </div>

                  </div>

                  {/* Lamp Variations Action Bar */}
                  <div className="bg-[#1E293B] hover:bg-[#1E293B]/95 p-4 rounded-xl text-white space-y-3.5 border border-slate-800 shadow-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Pola Keberagaman Relay (Variasi Lampu)</span>
                      <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-wider">Delay Poling Millis</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        onClick={() => triggerVariation(1)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-xs font-bold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play size={13} />
                        Variasi 1
                      </button>
                      
                      <button 
                        onClick={() => triggerVariation(2)}
                        className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-xs font-bold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Play size={13} />
                        Variasi 2
                      </button>

                      <button 
                        onClick={triggerAllOff}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-500 active:scale-95 text-xs font-bold rounded-lg transition-all text-center cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Square size={13} />
                        ALL OFF
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-snug">
                      * <span className="font-bold text-white">Variasi 1:</span> Relay 1 sampai 4 menyala bergantian (Running LED) lalu mati. 
                      * <span className="font-bold text-white">Variasi 2:</span> Relay 1 & 3 berkedip bergantian dengan Relay 2 & 4 beberapa kali.
                    </p>
                  </div>

                  {/* Sensor Trends mini graph preview */}
                  {state.historical_data && state.historical_data.length > 0 && (
                    <div className="bg-white p-4 rounded-xl border border-slate-100 hover:shadow-md transition-all">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-sans font-bold text-slate-600">Grafik Trend Sensor Terkini</span>
                        <button 
                          onClick={() => setActiveTab("charts")}
                          className="text-[10px] text-blue-600 font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          Selengkapnya <ChevronRight size={12} />
                        </button>
                      </div>
                      
                      <div className="h-32 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={state.historical_data.slice(-8)}>
                            <defs>
                              <linearGradient id="prevTemp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="temp" name="Suhu (°C)" stroke="#f97316" fillOpacity={1} fill="url(#prevTemp)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                </div>

                {/* Siri-IoT AI Voice NLP Assistant (Interactive Chat Panel) */}
                <div className="xl:col-span-5 flex flex-col justify-between">
                  <div className="space-y-2 mb-4">
                    <h2 className="text-sm uppercase font-extrabold tracking-wider text-slate-500">Asisten Pintar Siri-IoT</h2>
                    <p className="text-xs text-slate-400">Kontrol relay dan tanyakan sensor dalam bahasa natural Indonesia</p>
                  </div>
                  <AiAssistant onRefresh={fetchState} apiConfigured={state.activity_log.length > 0} />
                </div>

              </div>

              {/* Second row elements: Recents Activities & Flow diagrams warnings */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Activity System Logs */}
                <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-100 flex flex-col justify-between shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800">Catatan Aktivitas Smart Home</h3>
                      <p className="text-xs text-slate-400">Log real-time aksi telegram bot, klik web dashboard dan respon AI</p>
                    </div>
                    <span className="text-[10px] font-mono bg-blue-50 border border-blue-200 rounded px-2 py-0.5 text-blue-700 font-bold animate-pulse">
                      LIVE STREAM
                    </span>
                  </div>

                  {/* Logs area */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {state.activity_log && state.activity_log.length > 0 ? (
                      state.activity_log.map((log) => (
                        <div key={log.id} className="flex gap-3 text-xs border-b border-slate-50 pb-2 items-start shrink-0">
                          <span className="text-[10px] font-mono text-slate-400 scale-95 shrink-0 pt-0.5">
                            {log.time.split(" ")[1] || log.time}
                          </span>
                          
                          <div className="flex-1">
                            <p className="font-medium text-slate-800">{log.event}</p>
                            <span className={`inline-block text-[8px] uppercase font-bold tracking-wider px-1 border rounded mt-1 ${
                              log.source === "telegram" ? "bg-blue-50 border-blue-100 text-blue-600" :
                              log.source === "voice" || log.source === "ai" ? "bg-indigo-50 border-indigo-100 text-indigo-600" :
                              log.source === "esp32" ? "bg-amber-50 border-amber-100 text-amber-600" :
                              log.source === "system" ? "bg-slate-50 border-slate-200 text-slate-500" :
                              "bg-purple-50 border-purple-100 text-purple-600"
                            }`}>
                              {log.source.toUpperCase()}
                            </span>
                          </div>

                          <span className={`text-[9px] font-bold ${
                            log.type === "success" ? "text-green-600" :
                            log.type === "danger" ? "text-red-500" :
                            log.type === "warning" ? "text-amber-500" :
                            "text-slate-400"
                          }`}>
                            {log.type === "success" ? "✔ OK" : log.type === "danger" ? "‼ FAIL" : "● SYNC"}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400 text-xs">
                        Belum ada aktivitas yang tercatat. Sambungkan ESP32 atau trigger asisten AI!
                      </div>
                    )}
                  </div>
                </div>

                {/* Practical Hardware warning card for Quiz assessment safety */}
                <div className="lg:col-span-5 bg-amber-50/70 border border-amber-200 rounded-2xl p-5 text-slate-800 space-y-4 shadow-sm flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-amber-700">
                      <ShieldAlert size={20} className="stroke-2 shrink-0" />
                      <h4 className="font-extrabold text-sm uppercase tracking-wide">Peringatan Keselamatan Elektro (AC 220V)</h4>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed md:h-28 overflow-y-auto">
                      Jika Anda menguji modul Relay 4 Channel ini menggunakan listrik bertegangan tinggi AC (220V PLN):
                      <br /><br />
                      1. <span className="font-bold">Dilarang Keras</span> memegang kabel tembaga terbuka, sekrup kontak terminal relay, atau bagian logam berarus saat adaptor dinyalakan.
                      <br />
                      2. Pastikan rangkaian berada di dalam <span className="font-bold">kotak mika plastik (Shield/box pelindung)</span> yang diisolasi dengan baik.
                      <br />
                      3. <span className="font-bold">Sangat Direkomendasikan</span> untuk demo quiz akademik kampus menggunakan <span className="font-bold">Lampu LED DC 5V</span> yang aman bagi pemula.
                    </p>
                  </div>

                  <div className="bg-white/80 p-3 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" />
                      <span className="font-bold text-amber-950">Aman untuk demo kelas.</span>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-800">5V DC Recommended</span>
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DEVICES CONTROL (DETAILED SWITCHES AND METRICS) */}
          {activeTab === "devices" && (
            <div id="tab-devices" className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Manajemen Perangkat IoT Lengkap</h2>
                  <p className="text-xs text-slate-400">Sesuaikan penamaan saklar dan pantau emisi daya listrik</p>
                </div>
                <button 
                  onClick={triggerAllOff}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Square size={13} />
                  Matikan Semua Perangkat (All OFF)
                </button>
              </div>

              {/* Grid detail */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: "relay1", title: "Lampu Teras Depan", spec: "Beban: Lampu LED 15 Watt • Pin ESP32 GPIO 16", desc: "Saklar kontrol relay 1. Memutus/menyambungkan jalur kelistrikan luar teras depan rumah." },
                  { id: "relay2", title: "Lampu Kamar Utama", spec: "Beban: Lampu Bohlam 10 Watt • Pin ESP32 GPIO 17", desc: "Saklar kontrol relay 2. Mengatur pencahayaan di area tidur utama secara online." },
                  { id: "relay3", title: "Lampu Ruang Tamu", spec: "Beban: Lampu Hias 25 Watt • Pin ESP32 GPIO 18", desc: "Saklar kontrol relay 3. Mempermudah kontrol lampu estetik ruang tamu via asisten telegram." },
                  { id: "relay4", title: "Kipas Angin / AC", spec: "Beban: Kipas Angin 40 Watt • Pin ESP32 GPIO 19", desc: "Saklar kontrol relay 4. Dapat disambungkan pada peralatan motor listrik kecil seperti kipas." },
                ].map((item) => {
                  const isActive = (state.relay as any)[item.id];
                  return (
                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-md transition-all flex flex-col justify-between gap-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="font-extrabold text-sm text-slate-800">{item.title}</h3>
                          <span className="text-[10px] font-mono text-blue-600 block bg-blue-50 border border-blue-100 rounded-md px-2 py-0.5 w-max">
                            {item.spec}
                          </span>
                        </div>
                        
                        <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${
                          isActive ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-200"
                        }`}>
                          {isActive ? "ACTIVE" : "INACTIVE"}
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 leading-relaxed font-sans">{item.desc}</p>

                      <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <span className="text-xs text-slate-400">Ubah Status:</span>
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleRelay(item.id, false)}
                            className={`px-3 py-1 text-xs font-bold rounded ${!isActive ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            OFF
                          </button>
                          <button 
                            onClick={() => toggleRelay(item.id, true)}
                            className={`px-3 py-1 text-xs font-bold rounded ${isActive ? "bg-green-600 text-white animate-pulse" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                          >
                            ON
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SENSOR ANALYTICS */}
          {activeTab === "charts" && (
            <div id="tab-analytics" className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Analisis Data Sensor DHT11/DHT22</h2>
                <p className="text-xs text-slate-400">Pantau pola fluktuasi temperatur dan kelembaban lingkungan secara mendalam</p>
              </div>

              {/* Sensor stats info panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                <div className="bg-white p-5 rounded-xl border border-slate-200 text-left">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Rata-rata Suhu harian</span>
                  <p className="text-3xl font-extrabold text-[#f97316] font-sans mt-2">
                    {state.sensor.temperature.toFixed(1)}°C
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Dianalisis menggunakan sensor DHT internal ESP32</p>
                </div>

                <div className="bg-white p-5 rounded-xl border border-slate-200 text-left">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Rata-rata Kelembaban</span>
                  <p className="text-3xl font-extrabold text-[#3b82f6] font-sans mt-2">
                    {state.sensor.humidity.toFixed(1)}%
                  </p>
                  <p className="text-xs text-slate-400 mt-2">Indeks nyaman untuk kesehatan keluarga dan ventilasi</p>
                </div>

                <div className="bg-[#1E293B] p-5 rounded-xl text-white text-left">
                  <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider font-sans">Estimasi Status Kamar</span>
                  <p className="text-xl font-bold font-sans text-green-400 mt-2">Sangat Sehat</p>
                  <p className="text-xs text-slate-400 mt-1">Suhu ideal & Beban kelistrikan ramah lingkungan</p>
                </div>

              </div>

              {/* Beautiful detailed Area Chart */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-800">Visualisasi Grafik Log Historis (24 Jam)</h3>
                    <p className="text-xs text-slate-400">Pembaharuan data otomatis dari Cloud IoT API Gateway</p>
                  </div>
                  
                  <div className="flex gap-4 text-xs font-semibold text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-orange-500 rounded-full" />
                      <span>Suhu (°C)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-blue-500 rounded-full" />
                      <span>Kelembaban (%)</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={state.historical_data}>
                      <defs>
                        <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f97316" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                      <XAxis dataKey="time" stroke="#94A3B8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <Area type="monotone" dataKey="temp" name="Suhu (°C)" stroke="#f97316" fillOpacity={1} fill="url(#colorTemp)" strokeWidth={2} />
                      <Area type="monotone" dataKey="humidity" name="Kelembaban (%)" stroke="#3b82f6" fillOpacity={1} fill="url(#colorHum)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ESP32 simulator visual component */}
          {activeTab === "simulator" && (
            <div id="tab-simulator-view" className="space-y-6">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-800 flex items-start gap-3">
                <AlertTriangle className="shrink-0 text-amber-600 mt-0.5" size={16} />
                <div className="space-y-1">
                  <h4 className="font-bold">Mode Simulasi Perangkat Keras Sedang Berjalan</h4>
                  <p>
                    Anda dapat memutar slider suhu, kelembaban, dan mengganti Wi-Fi RSSI di modul interaktif di bawah.
                    Setiap perubahan akan dikirimkan ke REST API gateway server cloud secara asinkron. Ini sangat cocok bagi dosen atau instruktur yang ingin mendemokan fungsionalitas software tanpa alat fisik ESP32.
                  </p>
                </div>
              </div>

              {/* Physical ESP32 Simulation Panel Card */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Visual Board Layout Representation */}
                <div className="lg:col-span-7 bg-[#0f172a] text-slate-200 p-6 rounded-2xl border-2 border-slate-700 shadow-xl font-mono relative overflow-hidden flex flex-col justify-between gap-6">
                  {/* Decorative circuit copper lines on board */}
                  <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-indigo-500" />
                  
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[9px] text-amber-500 font-bold uppercase tracking-widest block">IoT DEV BOARD</span>
                      <h3 className="text-sm font-sans font-extrabold text-white">ESP32 DevKit V1 (Siri-IoT Core)</h3>
                      <span className="text-[8px] text-slate-500 font-mono">MAC ADDRESS: 24:0A:C4:EA:1B:54</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] bg-slate-800 border border-slate-700 px-2 py-1 rounded">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
                      <span className="text-slate-300">WIFI SIGNAL: GOOD</span>
                    </div>
                  </div>

                  {/* Microcontroller core illustration */}
                  <div className="my-2 p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex justify-between items-center relative">
                    <div className="space-y-2">
                      <div className="text-[10px] text-indigo-400 font-bold">&lt;Core Chipset&gt;</div>
                      <div className="w-20 h-16 bg-[#2563eb]/20 border border-[#2563eb]/40 rounded-xl flex flex-col items-center justify-center font-sans">
                        <span className="text-[10px] font-bold text-blue-400">ESP-WROOM-32</span>
                        <span className="text-[7px] text-slate-500">Dual Core Tensilica</span>
                      </div>
                    </div>

                    {/* Sensor Virtual LEDs pins details */}
                    <div className="space-y-1.5 text-right font-sans">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Relay Channels Pins Monitor</span>
                      
                      <div className="flex gap-2 justify-end">
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono text-slate-500">G16</span>
                          <span className={`w-3.5 h-3.5 rounded-full border ${simRelay.relay1 ? "bg-green-500 border-green-300 animate-pulse" : "bg-slate-800 border-slate-700"}`} title="Relay 1" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono text-slate-500">G17</span>
                          <span className={`w-3.5 h-3.5 rounded-full border ${simRelay.relay2 ? "bg-green-500 border-green-300 animate-pulse" : "bg-slate-800 border-slate-700"}`} title="Relay 2" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono text-slate-500">G18</span>
                          <span className={`w-3.5 h-3.5 rounded-full border ${simRelay.relay3 ? "bg-green-500 border-green-300 animate-pulse" : "bg-slate-800 border-slate-700"}`} title="Relay 3" />
                        </div>
                        <div className="flex flex-col items-center">
                          <span className="text-[8px] font-mono text-slate-500">G19</span>
                          <span className={`w-3.5 h-3.5 rounded-full border ${simRelay.relay4 ? "bg-green-500 border-green-300 animate-pulse" : "bg-slate-800 border-slate-700"}`} title="Relay 4" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pin label grid decorations */}
                  <div className="text-[8px] text-slate-500 border-t border-slate-800 pt-3 flex justify-between">
                    <div>[GND][5V][3V3][RX2][TX2][G32][G33][G25][G26][G27][G14][G12]</div>
                    <div className="text-right">[EN][VP][VN][G34][G35][G32][G16][G17][G18][G19][G21][RXD]</div>
                  </div>
                </div>

                {/* Simulated hardware dials console */}
                <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
                  <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-wider">Kontrol Parameter Sensor (Dials)</h3>
                  
                  {/* Temperature dial */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Suhu DHT Sensor (°C):</span>
                      <span className="text-orange-500 font-mono">{simTemp.toFixed(1)}°C</span>
                    </div>
                    <input 
                      type="range" 
                      min="15" 
                      max="45" 
                      step="0.1"
                      value={simTemp}
                      onChange={(e) => setSimTemp(parseFloat(e.target.value))}
                      className="w-full accent-orange-500 cursor-pointer"
                    />
                  </div>

                  {/* Humidity dial */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-600">Kelembaban (% RH):</span>
                      <span className="text-blue-500 font-mono">{simHumidity.toFixed(1)}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="20" 
                      max="95" 
                      step="0.5"
                      value={simHumidity}
                      onChange={(e) => setSimHumidity(parseFloat(e.target.value))}
                      className="w-full accent-blue-500 cursor-pointer"
                    />
                  </div>

                  {/* IP address and wifi signal config fields */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs font-semibold text-slate-700">Telemetri Wi-Fi & Identitas:</div>
                    
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">WiFi RSSI Strength:</label>
                        <select 
                          value={simWifi} 
                          onChange={(e) => setSimWifi(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700"
                        >
                          <option value="Excellent (-45 dBm)">Excellent (-45 dBm)</option>
                          <option value="Good (-65 dBm)">Good (-65 dBm)</option>
                          <option value="Fair (-80 dBm)">Fair (-80 dBm)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-400 uppercase font-bold">IP Address ESP32:</label>
                        <input 
                          type="text" 
                          value={simIP} 
                          onChange={(e) => setSimIP(e.target.value)}
                          className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono text-[11px]" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Hardware simulation relay control fallback indicators */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                    <span className="font-bold text-slate-800 block">Status Relay yang terbaca Pin Out:</span>
                    <div className="grid grid-cols-4 gap-1.5 text-center text-[10px] font-mono">
                      <div className={`p-1 border rounded ${simRelay.relay1 ? "bg-green-100 border-green-300 text-green-800 font-bold" : "bg-slate-200 border-slate-300 text-slate-400"}`}>
                        R1: {simRelay.relay1 ? "ON" : "OFF"}
                      </div>
                      <div className={`p-1 border rounded ${simRelay.relay2 ? "bg-green-100 border-green-300 text-green-800 font-bold" : "bg-slate-200 border-slate-300 text-slate-400"}`}>
                        R2: {simRelay.relay2 ? "ON" : "OFF"}
                      </div>
                      <div className={`p-1 border rounded ${simRelay.relay3 ? "bg-green-100 border-green-300 text-green-800 font-bold" : "bg-slate-200 border-slate-300 text-slate-400"}`}>
                        R3: {simRelay.relay3 ? "ON" : "OFF"}
                      </div>
                      <div className={`p-1 border rounded ${simRelay.relay4 ? "bg-green-100 border-green-300 text-green-800 font-bold" : "bg-slate-200 border-slate-300 text-slate-400"}`}>
                        R4: {simRelay.relay4 ? "ON" : "OFF"}
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )}

          {/* TAB 5: ACADEMIC QUIZ REPORT PDF */}
          {activeTab === "report" && (
            <div id="tab-report-view" className="space-y-6">
              
              {/* Pre-export editor section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                  <div>
                    <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">Identitas Pengaju Laporan Akademis</h3>
                    <p className="text-xs text-slate-400">Lengkapi formulir di bawah ini untuk mengisi metadata Laporan secara otomatis sebelum diunduh.</p>
                  </div>
                  
                  {/* Action download triggers */}
                  <button 
                    onClick={printReport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm shadow-blue-500/20 active:scale-95 transition-all"
                  >
                    <Printer size={15} />
                    Cetak / Simpan PDF Laporan A4
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">Nama Mahasiswa:</label>
                    <input 
                      type="text" 
                      value={studentName} 
                      onChange={(e) => setStudentName(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-sans" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">NIM Mahasiswa:</label>
                    <input 
                      type="text" 
                      value={studentNIM} 
                      onChange={(e) => setStudentNIM(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-sans font-semibold" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 block">Kelas / Prodi:</label>
                    <input 
                      type="text" 
                      value={studentClass} 
                      onChange={(e) => setStudentClass(e.target.value)}
                      className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded font-sans" 
                    />
                  </div>
                </div>
              </div>

              {/* PDF Sheet Preview */}
              <div 
                id="academic-pdf-print-area" 
                className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-lg text-slate-800 leading-relaxed font-sans max-w-4xl mx-auto space-y-6 text-sm relative"
              >
                {/* Academic Header section */}
                <div className="text-center border-b-2 border-slate-800 pb-5 space-y-2 select-none">
                  <span className="text-xs uppercase tracking-widest font-black text-blue-600 block">LAPORAN KULIAH / TUGAS MANDIRI KAMPUS</span>
                  <h1 className="text-lg md:text-xl font-bold font-sans tracking-tight text-slate-900 uppercase">
                    Quis Sistem Smart Home Berbasis IoT Menggunakan ESP32, Telegram Bot, dan Web Dashboard
                  </h1>
                  <p className="text-xs text-slate-500 font-mono">Dibuat Menggunakan Siri-IoT Dynamic Engine Pro</p>
                </div>

                {/* Identity Block */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <p><span className="font-semibold text-slate-400">Penyusun Laporan:</span> {studentName}</p>
                    <p><span className="font-semibold text-slate-400">NIM Mahasiswa:</span> {studentNIM}</p>
                  </div>
                  <div>
                    <p><span className="font-semibold text-slate-400">Kelas Akademis:</span> {studentClass}</p>
                    <p><span className="font-semibold text-slate-400">Tanggal Quis:</span> 2026-05-27 (UTC+7)</p>
                  </div>
                </div>

                {/* Section 1: Flowchart sistem */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">1</span>
                    Flowchart Alur Sistem (Mermaid)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Flowchart di bawah ini menjelaskan alur mulainya ESP32 menginisiasi koneksi Wi-Fi, melakukan pembacaan sensor DHT11/22 berkala secara non-blocking menggunakan penanda waktu <span className="font-mono">millis()</span>, menerima paket perintah eksternal dari bot telegram atau web panel, hingga mendinginkan atau memanaskan status database.
                  </p>
                  
                  {/* Visual Mermaid Flow Chart */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 leading-snug">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase font-mono">Bagan Alir Logis</span>
                    <pre className="text-[10px] md:text-xs font-mono text-slate-700 bg-slate-900 text-green-400 p-4 rounded-lg overflow-x-auto text-left leading-tight">
{`graph TD
  A[Mulai Boot ESP32] --> B(Koneksi Wi-Fi & Telegram API)
  B --> C[Baca Sensor Temp & Hum DHT11/22]
  C --> D{Polling Data Baru?}
  D -- Telegram --Command--> E[Ubah State Relay Fisik]
  D -- Web Dashboard POST--> F[Gateway REST API Sync]
  E --> G[Sindir Notifikasi Telegram]
  F --> H[ESP32 Response Target Relay]
  G --> I[Update Telemetri ke Cloud Database]
  H --> I
  I --> J(Ulangi Loop)`}
                    </pre>
                  </div>
                </div>

                {/* Section 2: Blok Diagram */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">2</span>
                    Blok Diagram Sistem
                  </h3>
                  <p className="text-xs text-slate-600 font-sans">
                    Diagram blok arsitektur koneksi terdistribusi yang memperlihatkan ESP32 DevKit V1 sebagai pengendali sentral sirkuit listrik.
                  </p>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                    <pre className="text-[10px] md:text-xs font-mono text-slate-700 bg-slate-900 text-blue-400 p-4 rounded-lg overflow-x-auto text-left leading-tight">
{` +------------------+        Wi-Fi        +-----------------------+
 |  Telegram Bot    | <-----------------> |  Cloud REST Gateway   |
 |  Voice / Text    |                     |  (Firebase Realtime)  |
 +------------------+                     +-----------------------+
           ^                                          ^
           | WiFi Secure                              | HTTP POST Sinks
           v                                          v
 +----------------------------------------------------------------+
 |                  ESP32 DevKit V1 (Main Controller)             |
 +----------------------------------------------------------------+
           |                                          |
     (DHT Pin 4)                                (GPIO 16,17,18,19)
           v                                          v
 +------------------+                     +-----------------------+
 | Sensor DHT11/22  |                     |  Relay 4 Ch (Active L)|
 | (Suhu & Lembab)  |                     |  (Lampu & AC Fan)     |
 +------------------+                     +-----------------------+`}
                    </pre>
                  </div>
                </div>

                {/* Section 3: Project Management SDLC */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">3</span>
                    Metode Manajemen Proyek TIK (SDLC)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-sans">
                    Untuk menjamin penyelesaian sistem smart home yang tertata, metodologi yang digunakan adalah <span className="font-semibold text-slate-800">Software Development Life Cycle (SDLC)</span> dengan tahapan:
                  </p>
                  <ul className="list-decimal pl-5 text-xs text-slate-700 space-y-1 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <li><span className="font-bold">Analisis Kebutuhan:</span> Pengumpulan spesifikasi perangkat keras (ESP32, Relay, DHT) dan parameter bot Telegram serta UI Dashboard.</li>
                    <li><span className="font-bold">Desain Sistem:</span> Perancangan skema pengkabelan pin out, model database json, dan diagram alur response bot.</li>
                    <li><span className="font-bold">Implementasi (Coding):</span> Penulisan code Arduino IDE menggunakan library UniversalTelegramBot secara asinkron dan web Next.js dashboard.</li>
                    <li><span className="font-bold">Pengujian (Testing):</span> Kalibrasi waktu respon pemicu relay dari tombol web dan bot Telegram.</li>
                    <li><span className="font-bold">Deployment:</span> Mengunggah aplikasi dashboard ke Cloud Run / Vercel dan memprogram ESP32 fisik.</li>
                  </ul>
                </div>

                {/* Section 4: Estimasi Biaya */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">4</span>
                    Estimasi Anggaran Biaya Proyek (IDR)
                  </h3>
                  <p className="text-xs text-slate-600 font-sans">
                    Rincian anggaran pengeluaran belanja aset keras dan lunak untuk instalasi smart home 4 Relay modular:
                  </p>

                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-700">Nama Komponen / Lisensi</th>
                          <th className="p-2 font-bold text-slate-700">Estimasi Jumlah</th>
                          <th className="p-2 font-bold text-slate-700">Kisaran Harga (IDR)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">ESP32 DevKit WROOM V1</td>
                          <td className="p-2">1 Pcs</td>
                          <td className="p-2 font-mono">Rp 55.000</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Modul Relay 4 Channel 5V DC Active LOW</td>
                          <td className="p-2">1 Pcs</td>
                          <td className="p-2 font-mono">Rp 30.000</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Sensor Suhu & Kelembaban DHT11 / DHT22</td>
                          <td className="p-2">1 Pcs</td>
                          <td className="p-2 font-mono">Rp 25.000</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Kabel Jumper breadboard Dupont (F-F, M-F)</td>
                          <td className="p-2">1 Ribbon</td>
                          <td className="p-2 font-mono">Rp 12.000</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Kabel Micro USB Data adapter 5V</td>
                          <td className="p-2">1 Pcs</td>
                          <td className="p-2 font-mono">Rp 15.000</td>
                        </tr>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <td className="p-2 font-extrabold text-blue-600">TOTAL BELANJA ALAT (Kira-kira)</td>
                          <td className="p-2 font-extrabold text-blue-600">——</td>
                          <td className="p-2 font-extrabold text-blue-600 font-mono">Rp 137.000</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 5: Schedule */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">5</span>
                    Estimasi Jadwal Pengerjaan (Gantt)
                  </h3>
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-100 border-b border-slate-200">
                          <th className="p-2 font-bold text-slate-700">Tahap Kerja</th>
                          <th className="p-2 font-bold text-slate-700">Estimasi Waktu</th>
                          <th className="p-2 font-bold text-slate-700">Keterangan Luaran</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Perancangan Rangkaian & Belanja</td>
                          <td className="p-2">Hari 1 - 2</td>
                          <td className="p-2 text-slate-500">Komponen siap ter-kalibrasi</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Perakitan Pin Out & Solder</td>
                          <td className="p-2">Hari 3</td>
                          <td className="p-2 text-slate-500">Rangkaian kokoh bebas korslet</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Coding ESP32 Arduino & Bot Telegram</td>
                          <td className="p-2">Hari 4 - 5</td>
                          <td className="p-2 text-slate-500">Bot @Father aktif merespon relay</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Pembuatan Web Dashboard & API Sync</td>
                          <td className="p-2">Hari 6 - 8</td>
                          <td className="p-2 text-slate-500">Dashboard UI terintegrasi database</td>
                        </tr>
                        <tr className="border-b border-slate-100">
                          <td className="p-2 font-medium">Uji Coba & Penyusunan Dokumen</td>
                          <td className="p-2">Hari 9 - 10</td>
                          <td className="p-2 text-slate-500">Laporan Akademik Siap Cetak</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 6: Source Code reference block */}
                <div className="space-y-3">
                  <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <span className="p-1 px-2.5 bg-blue-100 text-blue-800 rounded-md font-mono text-xs">6</span>
                    Source Code ESP32 Arduino IDE (smart_home_telegram_web_esp32.ino)
                  </h3>
                  <p className="text-xs text-slate-600 font-sans">
                    Kode di bawah dapat disalin secara langsung ke Arduino IDE Anda untuk diprogram ke dalam ESP32.
                  </p>
                  
                  <div className="relative">
                    <pre className="text-[10px] md:text-xs font-mono text-slate-300 bg-slate-900 p-4 rounded-xl overflow-x-auto text-left max-h-96 leading-tight select-all">
{`/*
 * Smart Home IoT 4 Relay Telegram Bot and Web Dashboard
 * File: smart_home_telegram_web_esp32.ino
 * Board: ESP32 Dev Module
 * Author: ${studentName} - NIM ${studentNIM}
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <HTTPClient.h>

// === CONFIGURATION PLACEHOLDERS ===
#define WIFI_SSID "ISI_NAMA_WIFI"
#define WIFI_PASSWORD "ISI_PASSWORD_WIFI"
#define BOT_TOKEN "ISI_TOKEN_BOT_TELEGRAM"
#define CHAT_ID "ISI_CHAT_ID_TELEGRAM"

// Set URL Node Smart Home Server / Firebase
const char* host_sync_url = "https://ais-pre-grvenxxyltitg3ny5y7tgx-507450536974.asia-east1.run.app/api/esp32/sync";

// === PIN CONFIGURATION ===
#define DHT_PIN 4
#define DHT_TYPE DHT11

#define RELAY_1 16
#define RELAY_2 17
#define RELAY_3 18
#define RELAY_4 19

// Relay active LOW logic
#define RELAY_ON LOW
#define RELAY_OFF HIGH

DHT dht(DHT_PIN, DHT_TYPE);
WiFiClientSecure client;
UniversalTelegramBot bot(BOT_TOKEN, client);

unsigned long last_time_reading = 0;
const unsigned long dht_delay = 5000; // Baca sensor tiap 5 detik

unsigned long last_time_bot = 0;
const unsigned long bot_delay = 1000; // Polling pesan Telegram tiap 1 detik

unsigned long last_time_sync = 0;
const unsigned long sync_delay = 3000; // Sinkron server tiap 3 detik

float temperature = 0.0;
float humidity = 0.0;

bool r1_state = false;
bool r2_state = false;
bool r3_state = false;
bool r4_state = false;

void setup() {
  Serial.begin(115200);
  dht.begin();
  
  // Set Pin Modes
  pinMode(RELAY_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  pinMode(RELAY_3, OUTPUT);
  pinMode(RELAY_4, OUTPUT);
  
  // Matikan semua relay di awal
  allOff();
  
  // Koneksi ke WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Menghubungkan ke Wi-Fi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("Wi-Fi Terkoneksi!");
  Serial.print("Alamat IP ESP32: ");
  Serial.println(WiFi.localIP());

  client.setInsecure(); // Bypass cert checks demi latency tinggi
  
  // Kirim notifikasi bot start
  bot.sendMessage(CHAT_ID, "Sistem Smart Home Siri-IoT ESP32 Aktif Terkoneksi!", "");
}

void loop() {
  unsigned long current_millis = millis();
  
  // 1. MEMBACA SENSOR SUHU & KELEMBABAN BERKALA
  if (current_millis - last_time_reading > dht_delay) {
    float t = dht.readTemperature();
    float h = dht.readHumidity();
    
    if (!isnan(t) && !isnan(h)) {
      temperature = t;
      humidity = h;
      Serial.printf("Suhu: %.2fC, Lembab: %.2f%%\\n", temperature, humidity);
    }
    last_time_reading = current_millis;
  }

  // 2. POLLING INSTAN PESAN TELEGRAM
  if (current_millis - last_time_bot > bot_delay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    while (numNewMessages) {
      handleTelegramMessage(numNewMessages);
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
    last_time_bot = current_millis;
  }

  // 3. SINKRONISASI JALUR KEDUA VIA REST API CLOUD
  if (current_millis - last_time_sync > sync_delay) {
    syncWithServer();
    last_time_sync = current_millis;
  }
}

// FUNGSI PASOKAN KONTROL RELAY
void controlRelay(int pin, bool state) {
  digitalWrite(pin, state ? RELAY_ON : RELAY_OFF);
}

void allOff() {
  stateRelayAll(false, false, false, false);
  bot.sendMessage(CHAT_ID, "Semua relay berhasil dinonaktifkan.", "");
}

void stateRelayAll(bool s1, bool s2, bool s3, bool s4) {
  r1_state = s1;
  r2_state = s2;
  r3_state = s3;
  r4_state = s4;
  
  controlRelay(RELAY_1, r1_state);
  controlRelay(RELAY_2, r2_state);
  controlRelay(RELAY_3, r3_state);
  controlRelay(RELAY_4, r4_state);
}

// POLA VARIASI LAMPU 1 (Running Led)
void variation1() {
  Serial.println("Menjalankan variasi 1...");
  bot.sendMessage(CHAT_ID, "Menyalakan Variasi Jumper 1 (Running LED)...", "");
  
  stateRelayAll(true, false, false, false); delay(500);
  stateRelayAll(false, true, false, false); delay(500);
  stateRelayAll(false, false, true, false); delay(500);
  stateRelayAll(false, false, false, true); delay(500);
  stateRelayAll(false, false, false, false);
}

// POLA VARIASI LAMPU 2 (Kombinasi Blink)
void variation2() {
  Serial.println("Menjalankan variasi 2...");
  bot.sendMessage(CHAT_ID, "Menyalakan Variasi Jumper 2 (Kedip Kombinasi)...", "");
  
  for(int i=0; i<3; i++) {
    stateRelayAll(true, false, true, false); delay(400);
    stateRelayAll(false, true, false, true); delay(400);
  }
  stateRelayAll(false, false, false, false);
}

// PARSING PERINTAH TEXT DAN PESAN SUARA TELEGRAM TELEGRAM
void handleTelegramMessage(int numNewMessages) {
  for (int i = 0; i < numNewMessages; i++) {
    String chat_id = String(bot.messages[i].chat_id);
    if (chat_id != CHAT_ID) {
      bot.sendMessage(chat_id, "Akses Smart Home Ditolak! Hubungi @Admin", "");
      continue;
    }
    
    String text = bot.messages[i].text;
    text.toLowerCase();
    
    Serial.println("Pesan Telegram Diterima: " + text);

    if (text == "/start") {
      String menu = "=== MENU UTAMA SIRI-IOT ===\\n\\n";
      menu += "🔧 RELAY TOGGLES:\\n";
      menu += "/lampu1_on - Nyalakan Lampu Teras\\n";
      menu += "/lampu1_off - Matikan Lampu Teras\\n";
      menu += "/lampu2_on - Nyalakan Lampu Kamar\\n";
      menu += "/lampu2_off - Matikan Lampu Kamar\\n";
      menu += "/lampu3_on - Nyalakan Ruang Tamu\\n";
      menu += "/lampu3_off - Matikan Ruang Tamu\\n";
      menu += "/lampu4_on - Nyalakan Kipas / AC\\n";
      menu += "/lampu4_off - Matikan Kipas / AC\\n\\n";
      menu += "🕹 METRICS & PATTERNS:\\n";
      menu += "/sensor - Cek Sensor DHT11\\n";
      menu += "/status - Amati Status All Relay\\n";
      menu += "/all_on - Hidupkan Semua\\n";
      menu += "/all_off - Padamkan Semua\\n";
      menu += "/variasi1 - Jalankan Pola Running\\n";
      menu += "/variasi2 - Jalankan Pola Kombinasi\\n";
      bot.sendMessage(chat_id, menu, "");
    }
    else if (text == "/lampu1_on" || text == "nyalakan lampu 1" || text == "lampu 1 hidup") {
      r1_state = true;
      controlRelay(RELAY_1, r1_state);
      bot.sendMessage(chat_id, "Relay 1 (Lampu Teras) AKTIF", "");
    }
    else if (text == "/lampu1_off" || text == "matikan lampu 1" || text == "lampu 1 mati") {
      r1_state = false;
      controlRelay(RELAY_1, r1_state);
      bot.sendMessage(chat_id, "Relay 1 (Lampu Teras) NONAKTIF", "");
    }
    else if (text == "/lampu2_on" || text == "nyalakan lampu 2" || text == "lampu 2 hidup") {
      r2_state = true;
      controlRelay(RELAY_2, r2_state);
      bot.sendMessage(chat_id, "Relay 2 (Lampu Kamar) AKTIF", "");
    }
    else if (text == "/lampu2_off" || text == "matikan lampu 2" || text == "lampu 2 mati") {
      r2_state = false;
      controlRelay(RELAY_2, r2_state);
      bot.sendMessage(chat_id, "Relay 2 (Lampu Kamar) NONAKTIF", "");
    }
    else if (text == "/lampu3_on" || text == "nyalakan lampu 3") {
      r3_state = true;
      controlRelay(RELAY_3, r3_state);
      bot.sendMessage(chat_id, "Relay 3 (Lampu Ruang Tamu) AKTIF", "");
    }
    else if (text == "/lampu3_off" || text == "matikan lampu 3") {
      r3_state = false;
      controlRelay(RELAY_3, r3_state);
      bot.sendMessage(chat_id, "Relay 3 (Lampu Ruang Tamu) NONAKTIF", "");
    }
    else if (text == "/lampu4_on" || text == "nyalakan kipas" || text == "nyalakan ac") {
      r4_state = true;
      controlRelay(RELAY_4, r4_state);
      bot.sendMessage(chat_id, "Relay 4 (Kipas / AC) AKTIF", "");
    }
    else if (text == "/lampu4_off" || text == "matikan kipas" || text == "matikan ac") {
      r4_state = false;
      controlRelay(RELAY_4, r4_state);
      bot.sendMessage(chat_id, "Relay 4 (Kipas / AC) NONAKTIF", "");
    }
    else if (text == "/all_on" || text == "nyalakan semua lampu") {
      stateRelayAll(true, true, true, true);
      bot.sendMessage(chat_id, "Semua Relay dihidupkan.", "");
    }
    else if (text == "/all_off" || text == "matikan semua" || text == "matikan lampu") {
      allOff();
    }
    else if (text == "/variasi1" || text == "nyalakan variasi 1") {
      variation1();
    }
    else if (text == "/variasi2" || text == "nyalakan variasi 2") {
      variation2();
    }
    else if (text == "/sensor" || text == "berapa temperatur" || text == "berapa kelembapan") {
      String reply = "🌡 Suhu: " + String(temperature, 1) + "C\\n💧 Kelembaban: " + String(humidity, 1) + "%";
      bot.sendMessage(chat_id, reply, "");
    }
    else if (text == "/status") {
      String reply = "Status Kelistrikan Rumah:\\n";
      reply += "Relay 1 [Teras Depan]: " + String(r1_state ? "ON" : "OFF") + "\\n";
      reply += "Relay 2 [Kamar Tidur]: " + String(r2_state ? "ON" : "OFF") + "\\n";
      reply += "Relay 3 [Ruang Tamu]: " + String(r3_state ? "ON" : "OFF") + "\\n";
      reply += "Relay 4 [Kipas / AC]: " + String(r4_state ? "ON" : "OFF");
      bot.sendMessage(chat_id, reply, "");
    }
  }
}

// CLIENT SYNC UTAMA KE WEB API CLOUD
void syncWithServer() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(host_sync_url);
    http.addHeader("Content-Type", "application/json");

    // Persiapkan JSON Payload
    StaticJsonDocument<200> doc;
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;
    doc["ip_address"] = WiFi.localIP().toString();
    doc["wifi_signal"] = String(WiFi.RSSI()) + " dBm";
    
    JsonObject relay = doc.createNestedObject("relay");
    relay["relay1"] = r1_state;
    relay["relay2"] = r2_state;
    relay["relay3"] = r3_state;
    relay["relay4"] = r4_state;

    String json_payload;
    serializeJson(doc, json_payload);
    
    int httpResponseCode = http.POST(json_payload);
    if (httpResponseCode > 0) {
      String response = http.getString();
      
      // Parse targets dikomando dari Web Dashboard
      StaticJsonDocument<300> resDoc;
      deserializeJson(resDoc, response);
      
      if (resDoc["success"] == true) {
        // Bandingkan perubahan relay dari web dashboard untuk dieksekusi pin fisik
        bool target_r1 = resDoc["target_relay"]["relay1"];
        bool target_r2 = resDoc["target_relay"]["relay2"];
        bool target_r3 = resDoc["target_relay"]["relay3"];
        bool target_r4 = resDoc["target_relay"]["relay4"];
        
        if (target_r1 != r1_state) {
          r1_state = target_r1;
          controlRelay(RELAY_1, r1_state);
        }
        if (target_r2 != r2_state) {
          r2_state = target_r2;
          controlRelay(RELAY_2, r2_state);
        }
        if (target_r3 != r3_state) {
          r3_state = target_r3;
          controlRelay(RELAY_3, r3_state);
        }
        if (target_r4 != r4_state) {
          r4_state = target_r4;
          controlRelay(RELAY_4, r4_state);
        }
        
        // Cek jika ada perintah variasi dari web
        String last_cmd = resDoc["command"]["last_command"];
        if (last_cmd == "VARIASI_1") {
          variation1();
        } else if (last_cmd == "VARIASI_2") {
          variation2();
        }
      }
    }
    http.end();
  }
}`}
                    </pre>
                  </div>
                </div>

                {/* Score breakdown alignment details */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-300 space-y-3 print:hidden">
                  <span className="text-xs uppercase tracking-widest font-extrabold text-blue-600 block">Metode Penilaian Akademik (Quis Alignment)</span>
                  
                  <div className="grid grid-cols-5 gap-2 text-center text-xs">
                    <div className="p-2 border border-slate-200 bg-white rounded">
                      <p className="font-bold">20%</p>
                      <p className="text-[10px] text-slate-400">Mermaid Diagram</p>
                    </div>
                    <div className="p-2 border border-slate-200 bg-white rounded">
                      <p className="font-bold">20%</p>
                      <p className="text-[10px] text-slate-400">Telegram Bot</p>
                    </div>
                    <div className="p-2 border border-slate-200 bg-white rounded">
                      <p className="font-bold">20%</p>
                      <p className="text-[10px] text-slate-400">Web Dashboard</p>
                    </div>
                    <div className="p-2 border border-slate-200 bg-white rounded">
                      <p className="font-bold">20%</p>
                      <p className="text-[10px] text-slate-400">Opsi Variasi</p>
                    </div>
                    <div className="p-2 border border-slate-200 bg-white rounded">
                      <p className="font-bold">20%</p>
                      <p className="text-[10px] text-slate-400">Dokumentasi</p>
                    </div>
                  </div>
                </div>

                {/* Footer sign section for signatures */}
                <div className="pt-8 border-t border-slate-200 flex justify-between text-xs select-none">
                  <div>
                    <p className="font-bold text-slate-500">Mengetahui, Dosen Penguji</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-800 underline">NIP. ____________________</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-500">Mahasiswa Pengaju</p>
                    <div className="h-16" />
                    <p className="font-bold text-slate-800 underline">{studentName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">NIM. {studentNIM}</p>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 6: BOT & TELEGRAM SETUP GUIDE */}
          {activeTab === "settings" && (
            <div id="tab-documentation-setup" className="space-y-6 max-w-4xl">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Panduan Setup & Integrasi Telegram Bot</h2>
                <p className="text-xs text-slate-400">Ikuti langkah-langkah di bawah untuk menghubungkan ESP32 fisik Anda dengan cloud gateway</p>
              </div>

              {/* Step cards */}
              <div className="space-y-4">
                
                {/* Step 1: Create bot */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    1
                  </div>
                  <div className="space-y-2 text-xs">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Membuat Bot Telegram Melalui BotFather</h3>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      Buka aplikasi Telegram, lalu cari akun resmi <span className="font-semibold text-blue-600 font-sans">@BotFather</span> (pastikan ada centang biru resmi verifikasi).
                      Kirim perintah <span className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-800">/newbot</span> untuk memulai pembuatan.
                      Ikuti petunjuk pengisian nama bot (bebas, contoh: "SmartHome Relays") dan username bot yang unik (harus diakhiri kata "_bot", contoh: "siri_smarthome_relay_bot").
                      Setelah berhasil, BotFather akan mengirimkan <span className="font-semibold text-slate-800">BOT TOKEN API</span> berbayang rahasia (contoh: <span className="font-mono">75314059:AAEdg_G...</span>). Salin token tersebut dan simpan.
                    </p>
                  </div>
                </div>

                {/* Step 2: Chat ID */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    2
                  </div>
                  <div className="space-y-2 text-xs">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Mendapatkan Telegram CHAT_ID Anda</h3>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      Untuk memastikan hanya akun Telegram Anda yang bisa mengontol saklar beban rumah, Anda memerlukan CHAT ID pribadi Anda.
                      Cari bot pembantu <span className="font-semibold text-indigo-600">@myidbot</span> atau <span className="font-semibold text-indigo-600">@IDBot</span> di Telegram.
                      Klik tombol mulai atau ketik perintah <span className="font-mono bg-slate-100 border border-slate-200 px-1 py-0.5 rounded text-slate-800">/getid</span>.
                      Bot tersebut akan langsung membalas dalam deretan angka ID numerik unik Anda (contoh: <span className="font-mono font-bold text-red-600">51203088</span>). Salin ID ini untuk diisikan di konfigurasi Arduino.
                    </p>
                  </div>
                </div>

                {/* Step 3: Firebase setup details */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    3
                  </div>
                  <div className="space-y-2 text-xs">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Menghubungkan ke Firebase Realtime Database (Alternatif Direct)</h3>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      Jika Anda ingin menggunakan database cloud langsung dibanding gateway REST internal kami:
                      <br /><br />
                      1. Masuk ke Google Firebase Console milik Anda sendiri. Buat project baru dan klik "Realtime Database" di menu kiri.
                      <br />
                      2. Buat database di wilayah terdekat (contoh: Singapore) dan buat aturan keamanan (Rules) menjadi true untuk pembacaan / penulisan:
                      <br />
                      <span className="font-mono text-slate-600 bg-slate-50 px-2.5 py-1 rounded block my-1">
                        {`{ "rules": { ".read": true, ".write": true } }`}
                      </span>
                      3. Salin URL database firebase Anda, sertakan token autentikasi di dalam library <span className="font-semibold font-mono">Firebase_ESP_Client</span> untuk komunikasi data solid.
                    </p>
                  </div>
                </div>

                {/* Step 4: Arduino IDE package installation */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    4
                  </div>
                  <div className="space-y-2 text-xs">
                    <h3 className="font-extrabold text-sm text-slate-800 uppercase tracking-tight">Pengaturan Arduino IDE & Library</h3>
                    <p className="text-slate-500 leading-relaxed font-sans">
                      Pasang Board Definition ESP32 di menu file Preferences Arduino IDE dengan memasukkan link board manager:
                      <br />
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded block my-1">
                        https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
                      </span>
                      Masuk ke Sketch → Include Library → Manage Libraries, lalu cari dan instal library berikut satu per satu:
                      <br />
                      * <span className="font-bold text-slate-700">UniversalTelegramBot by Brian Lough</span> (Versi Terkini)
                      <br />
                      * <span className="font-bold text-slate-700">ArduinoJson by Benoit Blanchon</span>
                      <br />
                      * <span className="font-bold text-slate-700">DHT Sensor Library by Adafruit</span>
                    </p>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// Custom Tooltip component for Recharts Area
function CustomTooltip({ active, payload }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-white font-mono text-[11px] shadow-md">
        <p className="text-blue-400 mb-1">Pukul: {payload[0].payload.time}</p>
        {payload.map((item: any, idx: number) => (
          <p key={idx} style={{ color: item.color }}>
            {item.name}: <span className="font-bold">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// Custom inline TV / Kipas / Motor icon for Relay 4
function TvIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={`w-5 h-5 ${className}`} 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" 
      />
    </svg>
  );
}
