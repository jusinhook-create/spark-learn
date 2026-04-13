import { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface MentionInputProps {
  value: string;
  onChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  forumId: string;
}

export function MentionInput({ value, onChange, onKeyDown, placeholder, forumId }: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const atIndex = value.lastIndexOf("@");
    if (atIndex >= 0 && atIndex === value.length - 1 - mentionQuery.length) {
      const query = value.slice(atIndex + 1);
      if (query.length >= 0 && !query.includes(" ")) {
        setMentionQuery(query);
        setShowSuggestions(true);
        fetchSuggestions(query);
        return;
      }
    }
    setShowSuggestions(false);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    const { data: members } = await supabase
      .from("group_members")
      .select("user_id")
      .eq("forum_id", forumId);
    if (!members || members.length === 0) { setSuggestions([]); return; }
    const userIds = members.map((m: any) => m.user_id);
    let q = supabase.from("profiles").select("user_id, display_name").in("user_id", userIds);
    if (query) {
      q = q.ilike("display_name", `%${query}%`);
    }
    const { data: profiles } = await q.limit(8);
    
    const results: any[] = [{ user_id: "__all__", display_name: "Everyone" }];
    if (profiles) results.push(...profiles);
    setSuggestions(results);
  };

  const selectMention = (name: string) => {
    const atIndex = value.lastIndexOf("@");
    const before = value.slice(0, atIndex);
    onChange(`${before}@${name} `);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex-1">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className="flex-1"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-background border rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
          {suggestions.map((s) => (
            <button
              key={s.user_id}
              className="w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors flex items-center gap-2"
              onClick={() => selectMention(s.display_name || "User")}
            >
              <span className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold shrink-0">
                {s.user_id === "__all__" ? "🔔" : (s.display_name?.[0]?.toUpperCase() || "?")}
              </span>
              <span>{s.display_name || "User"}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
