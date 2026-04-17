import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";

/**
 * Returns map of forum_id -> pending join request count.
 * Only counts requests for forums the current user created (admin-only visibility).
 * Realtime: refreshes when new requests arrive.
 */
export function usePendingRequestCounts(adminForumIds: string[]) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: counts } = useQuery({
    queryKey: ["pending-requests", user?.id, adminForumIds.sort().join(",")],
    queryFn: async () => {
      if (!user || adminForumIds.length === 0) return {};
      const { data } = await supabase
        .from("join_requests")
        .select("forum_id")
        .in("forum_id", adminForumIds)
        .eq("status", "pending");
      const result: Record<string, number> = {};
      data?.forEach((r: any) => {
        result[r.forum_id] = (result[r.forum_id] || 0) + 1;
      });
      return result;
    },
    enabled: !!user && adminForumIds.length > 0,
    refetchInterval: 8000,
  });

  useEffect(() => {
    if (!user || adminForumIds.length === 0) return;
    const channel = supabase
      .channel(`requests-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-requests", user.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, adminForumIds.join(",")]);

  return counts || {};
}
