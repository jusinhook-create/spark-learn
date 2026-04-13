import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Pin, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PinnedMessagesProps {
  forumId: string;
}

export function PinnedMessages({ forumId }: PinnedMessagesProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pinned } = useQuery({
    queryKey: ["pinned-messages", forumId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("pinned_messages")
        .select("*")
        .eq("forum_id", forumId)
        .gt("expires_at", now)
        .order("created_at", { ascending: false });
      if (!data || data.length === 0) return [];
      const msgIds = data.map((p: any) => p.message_id);
      const { data: msgs } = await supabase
        .from("forum_messages")
        .select("id, content, image_url, message_type")
        .in("id", msgIds);
      return data.map((p: any) => ({
        ...p,
        message: msgs?.find((m: any) => m.id === p.message_id),
      }));
    },
    refetchInterval: 30000,
  });

  const unpin = async (pinId: string) => {
    await supabase.from("pinned_messages").delete().eq("id", pinId);
    queryClient.invalidateQueries({ queryKey: ["pinned-messages", forumId] });
  };

  if (!pinned || pinned.length === 0) return null;

  return (
    <div className="space-y-1 mb-2">
      {pinned.map((p: any) => (
        <div key={p.id} className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 border border-warning/20 rounded-lg text-xs">
          <Pin className="h-3 w-3 text-warning shrink-0" />
          <span className="flex-1 truncate">
            {p.message?.content?.slice(0, 80) || (p.message?.message_type === "image" ? "📷 Image" : "Message")}
          </span>
          {(p.pinned_by === user?.id) && (
            <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0" onClick={() => unpin(p.id)}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      ))}
    </div>
  );
}

export function PinDurationMenu({ messageId, forumId, onClose }: { messageId: string; forumId: string; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const durations = [
    { label: "22 hours", hours: 22 },
    { label: "7 days", hours: 168 },
    { label: "10 days", hours: 240 },
    { label: "30 days", hours: 720 },
  ];

  const pinMessage = async (hours: number) => {
    const expiresAt = new Date(Date.now() + hours * 3600000).toISOString();
    const { error } = await supabase.from("pinned_messages").insert({
      forum_id: forumId,
      message_id: messageId,
      pinned_by: user!.id,
      expires_at: expiresAt,
    } as any);
    if (!error) {
      queryClient.invalidateQueries({ queryKey: ["pinned-messages", forumId] });
    }
    onClose();
  };

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium px-2 py-1 text-muted-foreground">Pin duration</p>
      {durations.map((d) => (
        <button
          key={d.hours}
          className="w-full text-left px-3 py-1.5 text-sm hover:bg-secondary rounded-md transition-colors"
          onClick={() => pinMessage(d.hours)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}
