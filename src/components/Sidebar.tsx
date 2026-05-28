import React from "react";
import { 
  LayoutDashboard, 
  Cpu, 
  LineChart, 
  FileText, 
  Settings, 
  HelpCircle,
  Activity,
  Lightbulb,
  Code
} from "lucide-react";
import { motion } from "motion/react";

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  espStatus: "online" | "offline";
}

export default function Sidebar({ activeTab, setActiveTab, espStatus }: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "devices", label: "Devices Control", icon: Lightbulb },
    { id: "charts", label: "Sensor Analytics", icon: LineChart },
    { id: "simulator", label: "ESP32 Simulator", icon: Cpu },
    { id: "report", label: "Arduino IDE Code", icon: Code },
    { id: "settings", label: "IoT Guide & Setup", icon: Settings },
  ];

  return (
    <div id="side-nav-container" className="fixed top-0 left-0 h-screen w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 z-30 transition-transform duration-300 md:translate-x-0 -translate-x-full">
      {/* Sidebar Header */}
      <div>
        <div id="sidebar-header" className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg tracking-tight leading-none text-white">Siri-IoT</h1>
            <span className="text-xs text-slate-400">Smart Relay System</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav id="sidebar-menu" className="p-4 space-y-1.5 flex-1">
          <span className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">Main Controls</span>
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`btn-nav-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer text-left relative ${
                  isActive 
                    ? "text-blue-400 bg-slate-800/80 font-semibold" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/30"
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator" 
                    className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-blue-500 rounded-r"
                  />
                )}
                <IconComponent size={18} className={isActive ? "text-blue-400" : "text-slate-400"} />
                {item.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer -- ESP Info status */}
      <div id="sidebar-footer" className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900 border border-slate-800">
          <div className="flex items-center gap-2">
            <Activity size={14} className={espStatus === "online" ? "text-green-400 animate-pulse" : "text-slate-500"} />
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-medium">ESP32 Status</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${espStatus === "online" ? "text-green-400" : "text-red-400"}`}>
                {espStatus === "online" ? "● Online" : "● Offline"}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono text-slate-500">v1.1</span>
        </div>
      </div>
    </div>
  );
}
