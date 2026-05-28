import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Sparkles, AlertCircle, Bot, CornerDownLeft, Power } from "lucide-react";
import { ChatMessage } from "../types";

interface AiAssistantProps {
  onRefresh: () => void;
  apiConfigured: boolean;
}

export default function AiAssistant({ onRefresh, apiConfigured }: AiAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-ai",
      sender: "ai",
      text: "Halo! Saya adalah Siri-IoT, asisten kecerdasan buatan rumah pintar Anda. \n\nSaya bisa membantu Anda mengontrol semua perangkat listrik dan mengamati sensor suhu melalui ketikan teks ataupun ketikan perintah suara. \n\nCobalah ketik semacam:\n* 'Nyalakan Lampu Teras (Lampu 1)'\n* 'Matikan semua perangkat'\n* 'Berapa suhu rumah saat ini?'\n* 'Mulai variasi lampu 2'",
      timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.reply,
        timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }),
        actionExecuted: data.commandExecuted,
      };

      setMessages((prev) => [...prev, aiMsg]);
      
      // If a state command was executed, trigger parent refresh fast
      if (data.commandExecuted && data.commandExecuted.type !== "none") {
        onRefresh();
      }
    } catch (err) {
      console.error("Gagal melakukan chat AI:", err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: "Maaf, sistem tidak dapat menghubungi server smart gateway. Pastikan server dev berjalan dengan normal.",
        timestamp: new Date().toLocaleTimeString("id", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="ai-assistant-container" className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col h-[520px] overflow-hidden text-white">
      {/* AI Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/30 border border-indigo-500/40 rounded-xl text-indigo-400">
            <Sparkles size={18} className="animate-spin-slow" />
          </div>
          <div>
            <h3 className="font-sans font-semibold text-sm leading-none flex items-center gap-1.5">
              Siri-IoT Assistant
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-ping" />
            </h3>
            <span className="text-[10px] text-indigo-300">Aktif bertenaga Gemini 3.5 AI</span>
          </div>
        </div>
        
        {/* API Warning Token Badge if needed */}
        {!apiConfigured && (
          <div className="flex items-center gap-1 text-[9px] bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded px-2 py-0.5 animate-pulse">
            <AlertCircle size={10} />
            <span>Mode NLP Offline</span>
          </div>
        )}
      </div>

      {/* Messages Logs Area */}
      <div id="ai-chat-history" className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col max-w-[85%] ${
              msg.sender === "user" ? "ml-auto items-end" : "mr-auto items-start"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              {msg.sender === "ai" ? (
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  <Bot size={12} className="text-indigo-400" />
                  <span>Siri-IoT AI</span>
                </div>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">Anda (Text/Voice)</span>
              )}
              <span className="text-[8px] text-slate-500">{msg.timestamp}</span>
            </div>

            <div
              className={`p-3 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed border ${
                msg.sender === "user"
                  ? "bg-indigo-600 text-white border-indigo-500 rounded-tr-none"
                  : "bg-slate-950/80 text-slate-100 border-slate-800 rounded-tl-none font-sans"
              }`}
            >
              {msg.text}

              {/* Action Badge feedback */}
              {msg.actionExecuted && msg.actionExecuted.type !== "none" && (
                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-1.5 text-[10px] text-indigo-300 font-semibold">
                  <Power size={11} className="text-green-400 animate-pulse" />
                  <span>
                    Aksi Terdeteksi: Toggle {msg.actionExecuted.target || "relay"} → {msg.actionExecuted.value ? "ON" : "OFF"}{" "}
                    {msg.actionExecuted.variation && `(Variasi ${msg.actionExecuted.variation})`}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 mr-auto bg-slate-950/40 p-3 border border-slate-800/40 rounded-2xl rounded-tl-none">
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-100" />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-200" />
            <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-300" />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800/80 bg-slate-950/40 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={loading ? "Siri-IoT memikirkan perintah..." : "Tulis instruksi lampu teras nyala..."}
          disabled={loading}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/40 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 rounded-xl transition-colors cursor-pointer group flex items-center justify-center text-white"
        >
          <Send size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </button>
      </form>
    </div>
  );
}
