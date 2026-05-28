import React from "react";
import { 
  Wifi, 
  WifiOff, 
  User, 
  Search, 
  Bell, 
  Clock, 
  AlertTriangle 
} from "lucide-react";
import { Esp32State } from "../types";

interface TopbarProps {
  esp32: Esp32State;
  isSimulated: boolean;
}

export default function Topbar({ esp32, isSimulated }: TopbarProps) {
  const isOnline = esp32.status === "online";
  
  // Format current UTC / local clock comfortably
  const d = new Date();
  const timeString = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

  return (
    <header id="top-bar-container" className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input Bar (Cosmetic) */}
      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 w-72 md:flex hidden">
        <Search size={16} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari perangkat, sensor, laporan..." 
          className="bg-transparent border-none text-xs text-slate-600 focus:outline-none w-full"
          disabled 
        />
      </div>
      <div className="md:hidden flex items-center">
        <h2 className="font-sans font-bold text-slate-800 text-sm">Siri-IoT Console</h2>
      </div>

      {/* Utilities Container */}
      <div className="flex items-center gap-4">
        {/* Realtime Clock Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-500 font-mono">
          <Clock size={13} className="text-blue-500" />
          <span>{timeString} WIB</span>
        </div>

        {/* ESP32 Status Badge */}
        <div className="flex items-center">
          {isOnline ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-xs rounded-full font-medium">
              <Wifi size={14} className="text-green-600 animate-pulse" />
              <span>
                ESP32 Connected{" "}
                <span className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded text-green-800 font-bold ml-1">
                  {esp32.wifi_signal}
                </span>
              </span>
              <span className="text-[10px] text-green-600 border-l border-green-200 pl-1.5 font-mono hidden sm:inline">
                {esp32.ip_address}
              </span>
              {isSimulated && (
                <span className="text-[8px] uppercase font-bold text-purple-600 bg-purple-50 tracking-wider px-1 border border-purple-200 rounded">
                  Simulated
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-200 text-red-600 text-xs rounded-full font-medium">
              <WifiOff size={14} className="text-red-500" />
              <span>ESP32 Offline</span>
              <span className="text-[8px] uppercase text-amber-600 bg-amber-50 px-1 rounded animate-pulse">
                Menunggu Sync
              </span>
            </div>
          )}
        </div>

        {/* Info Notification Icon Badge */}
        <button className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors relative cursor-pointer">
          <Bell size={18} />
          {!isOnline && (
            <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-amber-500 border-2 border-white rounded-full animate-bounce" />
          )}
        </button>

        {/* Student/User Avatar Profile */}
        <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold font-sans text-xs shadow-sm shadow-blue-500/20">
            UI
          </div>
          <div className="flex flex-col text-left leading-none hidden xl:flex">
            <span className="text-xs font-semibold text-slate-700">Quiz User</span>
            <span className="text-[9px] text-slate-400">NIM: SmartHome-IoT</span>
          </div>
        </div>
      </div>
    </header>
  );
}
