import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Bot, User, Loader2, FileText, History, Plus, Trash2, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;

export default function AiTutor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<string>(searchParams.get("material") || "");
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: materials } = useQuery({
    queryKey: ["study-materials", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("id, title, extracted_text, subject")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const { data: conversations } = useQuery({
    queryKey: ["ai-conversations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_conversations")
        .select("*")
        .eq("user_id", user!.id)
        .order("updated_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const activeMaterial = materials?.find((m) => m.id === selectedMaterial);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const saveConversation = async (msgs: Msg[]) => {
    if (!user || msgs.length === 0) return;
    const title = msgs[0]?.content?.slice(0, 50) || "New Conversation";
    if (activeConversationId) {
      await supabase.from("ai_conversations").update({
        messages: JSON.stringify(msgs),
        title,
        updated_at: new Date().toISOString(),
      }).eq("id", activeConversationId);
    } else {
      const { data } = await supabase.from("ai_conversations").insert({
        user_id: user.id,
        messages: JSON.stringify(msgs),
        title,
      }).select().single();
      if (data) setActiveConversationId(data.id);
    }
    queryClient.invalidateQueries({ queryKey: ["ai-conversations", user.id] });
  };

  const loadConversation = (conv: any) => {
    const msgs = typeof conv.messages === "string" ? JSON.parse(conv.messages) : conv.messages;
    setMessages(msgs);
    setActiveConversationId(conv.id);
    setShowHistory(false);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from("ai_conversations").delete().eq("id", id);
    if (activeConversationId === id) {
      setMessages([]);
      setActiveConversationId(null);
    }
    queryClient.invalidateQueries({ queryKey: ["ai-conversations", user?.id] });
    toast({ title: "Delete successful ✅" });
  };

  const newChat = () => {
    setMessages([]);
    setActiveConversationId(null);
    setShowHistory(false);
  };

  const send = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: input.trim() };
    setInput("");
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          materialContext: activeMaterial?.extracted_text || null,
        }),
      });

      if (!resp.ok || !resp.body) {
        const errorData = await resp.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to get response");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Save after complete response
      const finalMessages = [...newMessages, { role: "assistant" as const, content: assistantSoFar }];
      saveConversation(finalMessages);
    } catch (e: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry, I encountered an error: ${e.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  // History sidebar view
  if (showHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(false)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold">Chat History</h1>
          <Button variant="outline" size="sm" className="ml-auto gap-1" onClick={newChat}>
            <Plus className="h-3 w-3" /> New Chat
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations && conversations.length > 0 ? (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-secondary ${
                  activeConversationId === conv.id ? "bg-primary/10 border border-primary/20" : ""
                }`}
                onClick={() => loadConversation(conv)}
              >
                <Bot className="h-4 w-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{conv.title || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => deleteConversation(conv.id, e)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <History className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No conversations yet</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bot className="h-6 w-6 text-primary" /> AI Tutor
          </h1>
          <p className="text-sm text-muted-foreground">Ask me anything — I'll use your study materials!</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowHistory(true)} title="History">
            <History className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={newChat} title="New chat">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Material selector */}
      {materials && materials.length > 0 && (
        <div className="mb-3">
          <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select study material for context..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No material (general questions)</SelectItem>
              {materials.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  <span className="flex items-center gap-2">
                    <FileText className="h-3 w-3" /> {m.title}
                    {m.subject && <span className="text-xs text-muted-foreground">({m.subject})</span>}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeMaterial && (
            <p className="text-xs text-primary mt-1">
              📚 Using: {activeMaterial.title} — AI will answer based on this material
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 text-muted-foreground">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Bot className="h-8 w-8 text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">Hi! I'm your AI Tutor</p>
            <p className="text-sm max-w-xs">
              {activeMaterial
                ? `I'm ready to help you study "${activeMaterial.title}". Ask me anything about it!`
                : "Upload materials first, then select them here to ask questions about your content!"}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="space-y-1">
            <div className="flex items-center gap-2">
              {msg.role === "assistant" ? (
                <Bot className="h-4 w-4 text-primary shrink-0" />
              ) : (
                <User className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-xs font-semibold text-muted-foreground">
                {msg.role === "assistant" ? "AI Tutor" : "You"}
              </span>
            </div>
            <div className="pl-6">
              {msg.role === "assistant" ? (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-foreground">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-muted-foreground">AI Tutor</span>
            </div>
            <div className="pl-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={activeMaterial ? `Ask about "${activeMaterial.title}"...` : "Ask a question..."}
          className="min-h-[44px] max-h-32 resize-none"
          rows={1}
        />
        <Button onClick={send} disabled={isLoading || !input.trim()} size="icon" className="h-11 w-11 shrink-0 rounded-xl">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
