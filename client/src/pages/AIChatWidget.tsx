/**
 * LIOTA AI Front Door - Public Embeddable Chat Widget
 * This page is accessible at /chat and can be embedded in any website
 * using a 2-line iframe snippet.
 */
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, MessageCircle, X, User, Bot, Globe } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hello! 👋 I'm LIOTA Assistant — your guide to the Language Institute Of The Americas.\n\nI can help you with:\n• **ESL, SSL & Polyglot programs**\n• **STEAM language immersion**\n• **Pricing & schedules**\n• **Campuses**: Mérida, Dallas, Denver, Vienna & Online\n• **Free trial class** booking\n\nHow can I help you today? / ¿Cómo puedo ayudarte?",
  timestamp: new Date(),
};

function formatMessage(text: string) {
  // Simple markdown-like formatting
  return text
    .split("\n")
    .map((line, i) => {
      // Bold
      line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Bullets
      if (line.startsWith("• ")) {
        return `<div key="${i}" class="flex gap-1.5 items-start"><span class="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-60 inline-block"></span><span>${line.slice(2)}</span></div>`;
      }
      return `<span key="${i}">${line}</span>`;
    })
    .join("<br/>");
}

export default function AIChatWidget() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [isEmbedded] = useState(() => window.self !== window.top);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const chatMutation = trpc.ai.chat.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.reply, timestamp: new Date() },
      ]);
    },
    onError: (e) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again or contact us directly at languageinstituteoftheamericas.com",
          timestamp: new Date(),
        },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = () => {
    const text = input.trim();
    if (!text || chatMutation.isPending) return;

    const userMsg: Message = { role: "user", content: text, timestamp: new Date() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    // Check if user is asking about enrollment/pricing — prompt lead capture
    const enrollKeywords = ["enroll", "sign up", "register", "price", "cost", "how much", "inscribir", "precio", "costo", "trial", "prueba"];
    const wantsToEnroll = enrollKeywords.some((k) => text.toLowerCase().includes(k));
    if (wantsToEnroll && !leadCaptured && !showLeadForm) {
      setShowLeadForm(true);
    }

    chatMutation.mutate({
      messages: updatedMessages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-10) // Keep last 10 messages for context
        .map((m) => ({ role: m.role, content: m.content })),
      visitorName: visitorName || undefined,
      visitorEmail: visitorEmail || undefined,
    });
  };

  const handleLeadSubmit = () => {
    setLeadCaptured(true);
    setShowLeadForm(false);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `Thank you, ${visitorName || "there"}! 🎉 One of our advisors will reach out to you at **${visitorEmail}** shortly to schedule your **free trial class**.\n\nIn the meantime, feel free to ask me anything about our programs!`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div
      className={`flex flex-col bg-background text-foreground ${
        isEmbedded ? "h-screen" : "min-h-screen items-center justify-center p-4"
      }`}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div
        className={`flex flex-col bg-white shadow-2xl overflow-hidden ${
          isEmbedded ? "h-full w-full" : "w-full max-w-md h-[640px] rounded-2xl border border-gray-200"
        }`}
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-4 py-3 text-white shrink-0"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}
        >
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm leading-tight">LIOTA Assistant</p>
            <p className="text-xs text-white/70 leading-tight">Language Institute Of The Americas</p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/80">Online</span>
          </div>
        </div>

        {/* Languages strip */}
        <div
          className="flex items-center gap-2 px-4 py-1.5 text-white/90 text-xs overflow-x-auto shrink-0"
          style={{ background: "#e63946" }}
        >
          <Globe className="w-3 h-3 shrink-0" />
          <span className="whitespace-nowrap">English · Español · Français · Português · Deutsch · العربية · Русский · Maya Yucateca</span>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                  msg.role === "user" ? "bg-blue-600" : "bg-gradient-to-br from-slate-800 to-blue-900"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-3.5 h-3.5 text-white" />
                ) : (
                  <Bot className="w-3.5 h-3.5 text-white" />
                )}
              </div>
              <div
                className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white text-gray-800 border border-gray-100 rounded-tl-sm"
                }`}
              >
                <div
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  className="space-y-0.5"
                />
                <p className={`text-xs mt-1 ${msg.role === "user" ? "text-blue-200" : "text-gray-400"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}

          {chatMutation.isPending && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-800 to-blue-900 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}

          {/* Lead Capture Form */}
          {showLeadForm && !leadCaptured && (
            <div className="bg-white border border-blue-100 rounded-2xl p-4 shadow-sm space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-800">Get a free trial class! 🎓</p>
                  <p className="text-xs text-gray-500 mt-0.5">Leave your info and we'll contact you</p>
                </div>
                <button onClick={() => setShowLeadForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <Input
                placeholder="Your name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="text-sm h-9"
              />
              <Input
                type="email"
                placeholder="Your email"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                className="text-sm h-9"
              />
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={handleLeadSubmit}
                disabled={!visitorEmail}
                style={{ background: "#e63946" }}
              >
                Book My Free Trial Class
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        <div className="px-4 py-2 flex gap-2 overflow-x-auto shrink-0 bg-white border-t border-gray-100">
          {["Programs", "Pricing", "Free Trial", "Campuses", "STEAM"].map((q) => (
            <button
              key={q}
              onClick={() => { setInput(q); setTimeout(() => inputRef.current?.focus(), 50); }}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about our programs..."
            className="flex-1 text-sm rounded-full border-gray-200 bg-gray-50 focus:bg-white"
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || chatMutation.isPending}
            size="icon"
            className="rounded-full shrink-0 w-9 h-9"
            style={{ background: input.trim() ? "#e63946" : undefined }}
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Footer */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-center shrink-0">
          <p className="text-xs text-gray-400">
            Powered by{" "}
            <a href="https://languageinstituteoftheamericas.com" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">
              LIOTA Institute
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
