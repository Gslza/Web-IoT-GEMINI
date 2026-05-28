export interface RelayState {
  relay1: boolean;
  relay2: boolean;
  relay3: boolean;
  relay4: boolean;
  [key: string]: boolean; // Allow index access
}

export interface SensorState {
  temperature: number;
  humidity: number;
  last_update: string;
}

export interface Esp32State {
  status: "online" | "offline";
  wifi_signal: string;
  ip_address: string;
  last_ping?: string;
}

export interface CommandState {
  source: "web" | "telegram" | "voice" | "ai" | "system";
  last_command: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  time: string;
  event: string;
  source: "web" | "telegram" | "voice" | "ai" | "system" | "esp32";
  type: "info" | "success" | "warning" | "danger";
}

export interface HistoricalData {
  time: string;
  temp: number;
  humidity: number;
}

export interface SmartHomeState {
  relay: RelayState;
  sensor: SensorState;
  esp32: Esp32State;
  command: CommandState;
  activity_log: ActivityLog[];
  historical_data: HistoricalData[];
}

export interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: string;
    target?: string;
    value?: boolean;
    variation?: number;
  } | null;
}
