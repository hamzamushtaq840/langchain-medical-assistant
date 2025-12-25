"use client";
import { useState, useEffect, useRef, JSX } from "react";
import {
  Send,
  Activity,
  Pill,
  Brain,
  Microscope,
  Copy,
  RefreshCw,
  Check,
  CircleAlert,
  Stethoscope,
} from "lucide-react";
import {
  AIAvatar,
  UserAvatar,
  WaveLoader,
  Header,
  DeleteModal,
} from "@/component/ui";
import Markdown from "@/component/markdown";

// Import extracted components

// -------------------------
// Configuration
// -------------------------
const API_BASE = "https://hamzamushtaq840-ai-doctor.hf.space";

// -------------------------
// Types & Interfaces
// -------------------------
type Role = "user" | "assistant";

interface SuggestedPrompt {
  icon: JSX.Element;
  title: string;
  prompt: string;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  streaming?: boolean;
}

interface BackendMessage {
  id: string | number;
  role: string;
  content: string;
}

interface HistoryResponse {
  messages: BackendMessage[];
}

interface StreamData {
  delta?: string;
  done?: boolean;
  error?: string;
}

// -------------------------
// Data
// -------------------------
const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    icon: <Activity size={20} className="text-rose-400" />,
    title: "Interpret ECG Results",
    prompt:
      "My ECG shows ST elevation in leads V1-V4. What does this indicate?",
  },
  {
    icon: <Pill size={20} className="text-blue-400" />,
    title: "Interaction Check",
    prompt: "Is it safe to take Amoxicillin with Atorvastatin?",
  },
  {
    icon: <Microscope size={20} className="text-purple-400" />,
    title: "Lab Analysis",
    prompt: "Explain high ALT and AST levels with normal Bilirubin.",
  },
  {
    icon: <Brain size={20} className="text-amber-400" />,
    title: "Symptom Check",
    prompt: "Patient has unilateral headache with photophobia and nausea.",
  },
];

const generateUUID = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
};

// -------------------------
// Main App Component
// -------------------------
export default function App(): JSX.Element | null {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [mounted, setMounted] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let storedSession = localStorage.getItem("medichat_session_id");
    if (!storedSession) {
      storedSession = generateUUID();
      localStorage.setItem("medichat_session_id", storedSession);
    }
    setSessionId(storedSession);
    fetchHistory(storedSession);
  }, [mounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const fetchHistory = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE}/history/${sid}`);
      if (!res.ok) throw new Error("Failed to load history");
      const data: HistoryResponse = await res.json();
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(
          data.messages.map((m) => ({
            id: generateUUID(),
            role: m.role as Role,
            content: m.content,
          }))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const confirmClearChat = async () => {
    setIsDeleteModalOpen(false); // Close modal first
    if (!sessionId) return;
    try {
      await fetch(`${API_BASE}/clear/${sessionId}`, { method: "POST" });
      setMessages([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    const userMsg: Message = {
      id: generateUUID(),
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    const assistantMsgId = generateUUID();
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: "assistant", content: "", streaming: true },
    ]);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          stream: true,
        }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error("Network error");
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.replace("data: ", "").trim();
            if (jsonStr === "[DONE]") break;
            try {
              const data: StreamData = JSON.parse(jsonStr);
              if (data.delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: m.content + data.delta! }
                      : m
                  )
                );
              }
              if (data.done) setIsTyping(false);
            } catch (e) {
              console.log(e);
            }
          }
        }
      }
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m
        )
      );
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                streaming: false,
                content: m.content + "\n\n**[Connection Error]**",
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (!mounted) return null;

  return (
    // Changed h-screen to h-[100dvh] for mobile viewport fix
    <div className="flex h-dvh flex-col bg-slate-950 font-sans text-slate-100 overflow-hidden relative">
      <style>{`
        @keyframes wave-dot {
          0%, 100% { transform: translateY(0); opacity: 0.3; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* --- DIMMED ORIGINAL BACKGROUND --- */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.4]"
        style={{
          backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          backgroundColor: "#020617",
        }}
      />
      {/* Subtle overlay to dim it further */}
      <div className="fixed inset-0 z-1  pointer-events-none" />

      {/* --- CONTENT LAYER --- */}
      <main className="flex-1 flex flex-col relative z-10 w-full overflow-hidden">
        {/* Header - Fixed to top via flex layout */}
        <Header onClearClick={() => setIsDeleteModalOpen(true)} />

        {/* Chat Area - Takes available space and scrolls internally */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 scrollbar-hide">
          <div className="max-w-4xl mx-auto space-y-8 pb-4">
            {messages.length === 0 && (
              <div className="mt-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-slate-900/80 border border-slate-800 mb-6 shadow-2xl backdrop-blur-md">
                  <Stethoscope size={32} className="text-cyan-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  Clinical Assistant
                </h2>
                <p className="text-slate-500 mb-12 text-sm max-w-sm mx-auto font-medium">
                  Evidence-based RAG support for healthcare.
                </p>
                <div className="grid grid-cols-1 sm:mx-4 mx-0 sm:grid-cols-2 gap-4">
                  {SUGGESTED_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(item.prompt)}
                      className="flex cursor-pointer flex-col items-start p-5 bg-slate-900/40 border border-white/5 rounded-2xl hover:border-cyan-500/30 hover:bg-slate-800/60 transition-all group text-left backdrop-blur-sm"
                    >
                      <div className="mb-3 text-slate-500 group-hover:text-cyan-400 transition-colors">
                        {item.icon}
                      </div>
                      <span className="text-sm font-bold text-slate-200 mb-1">
                        {item.title}
                      </span>
                      <span className="text-xs text-slate-500 leading-relaxed font-medium">
                        {item.prompt}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${
                  msg.role === "user"
                    ? "justify-end"
                    : "justify-start animate-in fade-in slide-in-from-left-2 duration-300"
                }`}
              >
                <div
                  className={`flex max-w-[95%] sm:max-w-[85%] gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  <div className="mt-1 shrink-0">
                    {msg.role === "user" ? <UserAvatar /> : <AIAvatar />}
                  </div>
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div
                      className={`p-4 rounded-2xl text-[15px] leading-relaxed shadow-lg ${
                        msg.role === "user"
                          ? "bg-cyan-600 text-white rounded-tr-none shadow-cyan-950/20"
                          : "bg-slate-900/70 text-slate-200 border border-white/5 rounded-tl-none backdrop-blur-md"
                      }`}
                    >
                      {/* <ReactMarkdown>{msg.content}</ReactMarkdown> */}
                      <Markdown content={msg.content} />
                      {msg.streaming && !msg.content && <WaveLoader />}
                    </div>
                    {msg.role === "assistant" &&
                      !msg.streaming &&
                      msg.content && (
                        <div className="flex items-center gap-2 pl-1 animate-in fade-in duration-700">
                          <button
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="p-1.5 text-slate-600 hover:text-cyan-400 transition-colors"
                            title="Copy"
                          >
                            {copiedId === msg.id ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={14} />
                            )}
                          </button>
                          <button
                            onClick={() =>
                              handleSend(
                                messages[messages.indexOf(msg) - 1]?.content ||
                                  ""
                              )
                            }
                            className="p-1.5 text-slate-600 hover:text-slate-400 transition-colors"
                            title="Regenerate"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area - Fixed at bottom via flex layout */}
        <div className="shrink-0 px-6 pb-6 pt-2 bg-linear-to-t from-slate-950 via-slate-950/90 to-transparent z-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end  backdrop-blur-2xl border border-white/60 rounded-[24px] transition-all duration-300 shadow-2xl bg-slate-900/20">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  !e.shiftKey &&
                  (e.preventDefault(), handleSend(inputValue))
                }
                placeholder="Ask clinical queries..."
                className="w-full py-4 pl-6 pr-14 bg-transparent border-none rounded-[24px] outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-0 text-slate-200 placeholder-slate-500 resize-none max-h-32 min-h-[56px] text-[15px] font-medium"
                rows={1}
              />
              <div className="absolute right-2.5 bottom-2.5">
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-2.5 rounded-xl transition-all duration-300 ${
                    inputValue.trim() && !isTyping
                      ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/40 hover:scale-105 active:scale-95"
                      : "bg-slate-800 text-slate-700 cursor-not-allowed"
                  }`}
                >
                  <Send
                    size={18}
                    fill={inputValue.trim() ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
            <p className="flex justify-center items-center gap-2 text-xs text-slate-500 mt-3 font-medium">
              <span className="text-orange-400 shrink-0">
                <CircleAlert size={12} />
              </span>
              AI outputs should be verified by a qualified healthcare
              professional.
            </p>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmClearChat}
      />
    </div>
  );
}
