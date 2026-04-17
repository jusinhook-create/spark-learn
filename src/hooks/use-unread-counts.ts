import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Returns a map of forum_id -> unread message count for the current user.
 * Real-time: subscribes to new messages and refreshes counts.
 */
export function useUnreadCounts(forumIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: ["unread-counts", user?.id, forumIds.sort().join(",")],
    queryFn: async () => {
      if (!user || forumIds.length === 0) return {};
      // Get last_read for each forum
      const { data: reads } = await supabase
        .from("forum_reads")
        .select("forum_id, last_read_at")
        .eq("user_id", user.id)
        .in("forum_id", forumIds);

      const readMap: Record<string, string> = {};
      reads?.forEach((r: any) => { readMap[r.forum_id] = r.last_read_at; });

      const result: Record<string, number> = {};
      // Count unread per forum (parallel)
      await Promise.all(
        forumIds.map(async (fid) => {
          const lastRead = readMap[fid] || "1970-01-01T00:00:00Z";
          const { count } = await supabase
            .from("forum_messages")
            .select("id", { count: "exact", head: true })
            .eq("forum_id", fid)
            .gt("created_at", lastRead)
            .neq("user_id", user.id);
          result[fid] = count || 0;
        })
      );
      return result;
    },
    enabled: !!user && forumIds.length > 0,
    refetchInterval: 5000,
  });

  // Realtime: refresh on new messages
  useEffect(() => {
    if (!user || forumIds.length === 0) return;
    const channel = supabase
      .channel(`unread-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "forum_messages" },
        (payload: any) => {
          if (forumIds.includes(payload.new?.forum_id) && payload.new?.user_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ["unread-counts", user.id] });
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, forumIds.join(",")]);

  return counts || {};
}

/**
 * Marks a forum as read for the current user (sets last_read_at = now).
 */
export async function markForumRead(userId: string, forumId: string) {
  await supabase
    .from("forum_reads")
    .upsert(
      { user_id: userId, forum_id: forumId, last_read_at: new Date().toISOString() },
      { onConflict: "user_id,forum_id" }
    );
}
