"use client";
import React, { useState, useEffect, useRef, FC, JSX } from "react";
import {
  Send,
  User,
  Menu,
  Activity,
  BookOpen,
  Stethoscope,
  Paperclip,
  Pill,
  Brain,
  Microscope,
  Search,
  HeartPulse,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
});
// -------------------------
// Types & Interfaces
// -------------------------
type Role = "user" | "assistant";

interface SuggestedPrompt {
  category: string;
  icon: JSX.Element;
  title: string;
  prompt: string;
}

interface Source {
  id: number;
  type: string;
  title: string;
  journal: string;
  matchScore: number;
}

interface Message {
  id: string;
  role: Role;
  content: string;
  sources?: Source[] | null;
  streaming?: boolean; // helper flag while streaming
}

// -------------------------
// Data & Configuration
// -------------------------
const SUGGESTED_PROMPTS: SuggestedPrompt[] = [
  {
    category: "Cardiology",
    icon: <HeartPulse size={20} className="text-rose-400" />,
    title: "Interpret ECG Results",
    prompt:
      "My ECG shows ST elevation in leads V1-V4. What does this indicate?",
  },
  {
    category: "Pharmacology",
    icon: <Pill size={20} className="text-blue-400" />,
    title: "Interaction Check",
    prompt: "Is it safe to take Amoxicillin with Atorvastatin?",
  },
  {
    category: "Pathology",
    icon: <Microscope size={20} className="text-purple-400" />,
    title: "Lab Analysis",
    prompt: "Explain high ALT and AST levels with normal Bilirubin.",
  },
  {
    category: "Neurology",
    icon: <Brain size={20} className="text-amber-400" />,
    title: "Symptom Triangulation",
    prompt: "Unilateral headache with photophobia and nausea.",
  },
];

const MOCK_SOURCES: Source[] = [
  {
    id: 1,
    type: "Journal",
    title: "Management of Acute Coronary Syndromes",
    journal: "NEJM 2024; 390:12-24",
    matchScore: 98,
  },
  {
    id: 2,
    type: "Guideline",
    title: "AHA/ACC Clinical Guidelines Vol. 4",
    journal: "Circulation. 2023",
    matchScore: 94,
  },
];

// -------------------------
// Small UI pieces
// -------------------------
const AIAvatar: FC = () => (
  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-lg shadow-blue-900/50 border border-slate-700 z-10">
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-white"
    >
      <circle
        cx="12"
        cy="12"
        r="2.5"
        fill="white"
        className="stroke-white/70"
        strokeWidth="1.5"
      />
      <path
        d="M12 14.5v7.5M18 10l4 4M6 10l-4 4M12 4v-2M12 19.5l3.5 3.5M12 19.5l-3.5 3.5"
        className="stroke-white/80"
        strokeWidth="1.5"
      />
      <path
        d="M18 10C18 6.69 15.31 4 12 4S6 6.69 6 10"
        className="stroke-white/50"
        strokeWidth="1.5"
      />
    </svg>
  </div>
);

const UserAvatar: FC = () => (
  <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center shadow-md border border-slate-700 bg-slate-800 text-slate-200 z-10">
    <User size={18} />
  </div>
);

const LoadingThinking: FC = () => (
  <div className="flex items-center space-x-2 p-1">
    <div className="flex space-x-1">
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" />
    </div>
    <span className="text-xs font-medium text-cyan-400 animate-pulse">
      Reviewing medical literature...
    </span>
  </div>
);

const SourceCard: FC<{ source: Source }> = ({ source }) => (
  <div className="group flex items-start p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg hover:border-cyan-500/50 hover:bg-slate-800 transition-all cursor-pointer mb-2 backdrop-blur-sm">
    <div className="bg-slate-900 p-1.5 rounded text-slate-500 group-hover:text-cyan-400 group-hover:bg-cyan-950 transition-colors">
      <BookOpen size={14} />
    </div>
    <div className="ml-2 flex-1 overflow-hidden">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold text-slate-200 truncate pr-2">
          {source.title}
        </h4>
        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-1.5 rounded border border-emerald-900/50">
          {source.matchScore}% RAG
        </span>
      </div>
      <p className="text-[10px] text-slate-400 truncate">{source.journal}</p>
    </div>
  </div>
);

const Logo: FC = () => (
  <div className="flex items-center gap-2">
    <div className="relative flex items-center justify-center w-9 h-9 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl shadow-lg shadow-cyan-900/20">
      <Activity className="text-white" size={20} strokeWidth={2.5} />
      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 border-2 border-slate-900 rounded-full" />
    </div>
    <div className="flex flex-col">
      <span className="text-lg font-bold text-white leading-tight tracking-tight">
        Medi<span className="text-cyan-400">Chat</span>
      </span>
      <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">
        Clinical AI Assistant
      </span>
    </div>
  </div>
);

// -------------------------
// Helper utilities
// -------------------------
const uuid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

// Replace with your deployed backend base if different
const API_BASE = "https://hamzamushtaq840-ai-doctor.hf.space";

// -------------------------
// Main App
// -------------------------
export default function App(): JSX.Element {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // restore session id if present
  useEffect(() => {
    const s = localStorage.getItem("ai_doctor_session_id");
    if (s) {
      setSessionId(s);
      // load existing history right away
      fetchHistoryAndSync(s);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    const handleResize = () =>
      window.innerWidth < 1024 && setIsSidebarOpen(false);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // fetch history from backend and sync into UI (canonical)
  const fetchHistoryAndSync = async (sid: string) => {
    try {
      const res = await fetch(`${API_BASE}/history/${encodeURIComponent(sid)}`);
      if (!res.ok) return;
      const data = await res.json();
      // expect data.messages to be array of {id, session_id, role, content, ts}
      const remoteMsgs: Message[] = (data.messages || []).map((m: any) => ({
        id: String(m.id),
        role: m.role as Role,
        content: m.content,
        streaming: false,
        // `sources` not provided by your backend currently; left null
      }));
      setMessages(remoteMsgs);
    } catch (err) {
      // ignore silently
      console.warn("Failed to fetch history", err);
    }
  };

  // Send message (streaming by default)
  const handleSend = async (text: string, useStream = true) => {
    if (!text.trim()) return;

    // ensure session id exists (generate + persist first time)
    let sid = sessionId;
    if (!sid) {
      sid = uuid();
      setSessionId(sid);
      localStorage.setItem("ai_doctor_session_id", sid);
    }

    const userMsg: Message = { id: uuid(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);

    // Prepare assistant placeholder (streaming)
    const assistantId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", streaming: true },
    ]);
    setInputValue("");
    setIsTyping(true);

    // Abort previous streaming if any
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch {}
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const url = `${API_BASE}/chat`;
      const body = JSON.stringify({
        message: text,
        stream: useStream,
        session_id: sid,
      });

      if (useStream) {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Server error: ${res.status} ${errText}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("Readable stream not supported.");

        const decoder = new TextDecoder();
        let buf = "";

        const appendDelta = (delta: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: (m.content || "") + delta }
                : m
            )
          );
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });

          // Process complete SSE events
          let match;
          const sseRegex = /data:\s*(\{.*?\})\s*\n\n/gms;
          while ((match = sseRegex.exec(buf)) !== null) {
            try {
              const payload = JSON.parse(match[1]);
              if (payload.delta) appendDelta(payload.delta);
              if (payload.done) setIsTyping(false);
              if (payload.error) {
                appendDelta(`\n\n[Error] ${payload.error}`);
                setIsTyping(false);
              }
            } catch (e) {
              console.warn("Failed to parse SSE JSON", e);
            }
          }

          // Keep leftover
          buf = buf.slice(buf.lastIndexOf("\n\n") + 2);
        }

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, streaming: false } : m
          )
        );
        setIsTyping(false);
        await fetchHistoryAndSync(sid);
      } else {
        // Non-streaming fallback
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          signal: controller.signal,
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`Server: ${res.status} - ${txt}`);
        }
        const data = await res.json();
        // backend returns {"session_id": "...", "answer": "..."} for non-stream
        const answer =
          data.answer || data?.choices?.[0]?.message?.content || "(no answer)";
        // Sync canonical history (backend appends assistant message)
        await fetchHistoryAndSync(sid);
        setIsTyping(false);
      }
    } catch (err: any) {
      // abort or network error
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                streaming: false,
                content:
                  (m.content || "") + `\n\n[Error] ${err?.message || err}`,
              }
            : m
        )
      );
      setIsTyping(false);
    } finally {
      abortControllerRef.current = null;
    }
  };

  // helper to send prompt from suggested cards
  const handleSuggested = (prompt: string) => handleSend(prompt, true);

  // regenerate: remove the assistant message and resend the last user message (with same session)
  const handleRegenerate = (messageId: string) => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser && sessionId) {
      // remove assistant message targeted (UI only)
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      handleSend(lastUser.content, true);
    } else if (lastUser && !sessionId) {
      // if somehow no session yet, create and send
      handleSend(lastUser.content, true);
    }
  };

  const handleBotAction = (action: string, messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message) return;

    switch (action) {
      case "copy":
        if (typeof navigator !== "undefined" && navigator.clipboard) {
          navigator.clipboard.writeText(message.content).catch(() => {});
        } else {
          console.log("copy:", message.content);
        }
        break;
      case "regenerate":
        handleRegenerate(messageId);
        break;
      case "feedback":
        console.log(`Feedback submitted for message ${messageId}`);
        break;
      default:
        break;
    }
  };

  // small UI render
  return (
    <div className="flex h-screen bg-slate-950 font-sans text-slate-100 overflow-hidden selection:bg-cyan-900 selection:text-cyan-100">
      {/* --- Main Chat Area --- */}
      <main className="flex-1 flex flex-col relative bg-slate-950 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-slate-900/70 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20 shadow-lg shadow-black/20">
          <div className="flex items-center gap-4">
            <div className=" flex flex-col">
              <Logo />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/30 text-emerald-400 rounded-full border border-emerald-900/50 text-xs font-semibold">
              <Zap size={12} fill="currentColor" />
              <span>Med-PaLM 2 Online</span>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div
          className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth z-10 relative"
          style={{
            backgroundImage: `linear-gradient(to right, #1e293b 1px, transparent 1px), linear-gradient(to bottom, #1e293b 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
            backgroundColor: "#020617",
          }}
        >
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 80 80' width='80' height='80'%3E%3Cpath fill='%2394a3b8' d='M0 0h80v80H0z' fill-opacity='0'%3E%3C/path%3E%3Cpath fill='%2394a3b8' d='M20 0l40 40-40 40H0l40-40L0 0zm40 0l20 20v40l-20 20-20-20V20l20-20z' fill-opacity='.1'%3E%3C/path%3E%3C/svg%3E")`,
              backgroundSize: "150px 150px",
            }}
          />

          <div className="max-w-4xl mx-auto space-y-8 pb-4 relative z-10">
            {messages.length === 0 && (
              <div className="mt-8 lg:mt-12 animate-fade-in">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-slate-900 shadow-xl shadow-cyan-900/10 mb-6 relative ring-1 ring-slate-800">
                    <Stethoscope size={40} className="text-cyan-500" />
                    <div className="absolute -bottom-2 -right-2">
                      <AIAvatar />
                    </div>
                  </div>
                  <h2 className="text-3xl font-bold text-slate-100 mb-3 tracking-tight">
                    Clinical Decision Support
                  </h2>
                  <p className="text-slate-400 max-w-lg mx-auto text-lg">
                    Harnessing AI and RAG technology for evidence-based medical
                    information retrieval.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
                  {SUGGESTED_PROMPTS.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggested(item.prompt)}
                      className="flex items-start p-4 bg-slate-900/40 backdrop-blur-sm border border-slate-800 rounded-2xl hover:border-cyan-700 hover:bg-slate-800/60 transition-all duration-300 group text-left relative overflow-hidden ring-1 ring-white/5"
                    >
                      <div className="bg-slate-800 p-3 rounded-xl group-hover:bg-slate-700 transition-colors z-10 shadow-sm text-slate-300 group-hover:text-cyan-400">
                        {item.icon}
                      </div>
                      <div className="ml-4 z-10">
                        <span className="block text-sm font-bold text-slate-200 mb-1">
                          {item.title}
                        </span>
                        <span className="block text-xs text-slate-500 group-hover:text-slate-400 leading-relaxed">
                          {item.prompt}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`flex max-w-[90%] lg:max-w-[80%] gap-4 ${
                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                  }`}
                >
                  {msg.role === "user" ? <UserAvatar /> : <AIAvatar />}

                  <div className="flex flex-col gap-2 min-w-0">
                    <div
                      className={`p-5 rounded-2xl text-[15px] leading-7 shadow-sm border relative transition-all duration-300 ${
                        msg.role === "user"
                          ? "bg-blue-600 text-white border-transparent rounded-tr-none"
                          : "bg-slate-900 text-slate-200 ring-1 ring-slate-800 rounded-tl-none hover:shadow-lg hover:shadow-cyan-900/20 shadow-inner shadow-black/20"
                      }`}
                    >
                      {mounted ? (
                        <ReactMarkdown>
                          {msg.content || (msg.streaming ? "..." : "")}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap font-medium">
                          {msg.content || (msg.streaming ? "..." : "")}
                        </div>
                      )}
                    </div>

                    {msg.role === "assistant" && (
                      <>
                        <div className="flex items-center gap-3 pl-2 mt-1 opacity-100 transition-opacity">
                          <button
                            onClick={() => handleBotAction("copy", msg.id)}
                            className="p-1.5 text-slate-500 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Copy Response"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={() => handleBotAction("feedback", msg.id)}
                            className="p-1.5 text-slate-500 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Helpful"
                          >
                            <ThumbsUp size={14} />
                          </button>
                          <button
                            onClick={() => handleBotAction("feedback", msg.id)}
                            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-all"
                            title="Not Helpful"
                          >
                            <ThumbsDown size={14} />
                          </button>
                          <div className="h-3 w-[1px] bg-slate-800 mx-1" />
                          <button
                            onClick={() =>
                              handleBotAction("regenerate", msg.id)
                            }
                            className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-all"
                            title="Regenerate Response"
                          >
                            <RefreshCw size={14} />
                          </button>
                        </div>

                        {msg.sources && (
                          <div className="mt-2 bg-slate-900/60 rounded-xl ring-1 ring-slate-800 p-3 backdrop-blur-sm shadow-sm">
                            <div className="flex items-center gap-2 mb-3 px-1">
                              <div className="p-1 bg-cyan-950/50 rounded text-cyan-400 border border-cyan-900/30">
                                <Search size={12} strokeWidth={3} />
                              </div>
                              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                Cited Literature (RAG)
                              </span>
                            </div>
                            <div className="grid gap-2 sm:grid-cols-2">
                              {msg.sources.map((source) => (
                                <SourceCard key={source.id} source={source} />
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* typing indicator */}
            {isTyping && (
              <div className="flex justify-start w-full max-w-3xl animate-pulse">
                <div className="flex gap-4">
                  <AIAvatar />
                  <div className="bg-slate-900 ring-1 ring-slate-800 px-6 py-4 rounded-2xl rounded-tl-none shadow-sm flex items-center">
                    <LoadingThinking />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 lg:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-800 relative z-20 shadow-2xl shadow-black/50">
          <div className="max-w-4xl mx-auto">
            <div className="relative flex items-end bg-slate-900 border border-slate-700 hover:border-cyan-700 focus-within:border-cyan-600 focus-within:ring-4 focus-within:ring-cyan-900/20 rounded-2xl shadow-lg shadow-black/20 transition-all duration-200 ease-in-out">
              <button className="p-4 text-slate-500 hover:text-cyan-400 transition-colors">
                <Paperclip size={20} />
              </button>

              <textarea
                value={inputValue}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setInputValue(e.target.value)
                }
                onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(inputValue);
                  }
                }}
                placeholder="Type your medical query here..."
                className="w-full py-4 bg-transparent border-none focus:ring-0 text-slate-200 placeholder-slate-500 resize-none max-h-32 min-h-[56px] text-base"
                rows={1}
              />

              <div className="p-2">
                <button
                  onClick={() => handleSend(inputValue)}
                  disabled={!inputValue.trim() || isTyping}
                  className={`p-3 rounded-xl flex items-center justify-center transition-all duration-200 ${
                    inputValue.trim() && !isTyping
                      ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-900/40 hover:scale-105 active:scale-95"
                      : "bg-slate-800 text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <Send
                    size={20}
                    fill={inputValue.trim() ? "currentColor" : "none"}
                  />
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] text-slate-500 mt-3 font-medium">
              <span className="text-rose-400">*</span> AI outputs should be
              verified by a qualified healthcare professional.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
