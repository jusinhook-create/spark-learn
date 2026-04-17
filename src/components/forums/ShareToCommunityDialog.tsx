import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, Loader2 } from "lucide-react";

interface Props {
  message: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Renders a list of groups the user belongs to so they can post a message
 * to the community chat. Used for sharing quiz results.
 */
export function ShareToCommunityDialog({ message, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posting, setPosting] = useState<string | null>(null);

  const { data: forums, isLoading } = useQuery({
    queryKey: ["my-forums-for-share", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberships } = await supabase
        .from("group_members")
        .select("forum_id")
        .eq("user_id", user.id);
      const ids = memberships?.map((m: any) => m.forum_id) || [];
      // Also include forums created by user
      const { data: created } = await supabase
        .from("forums")
        .select("id, title")
        .eq("created_by", user.id);
      const allIds = [...new Set([...ids, ...(created?.map((f: any) => f.id) || [])])];
      if (allIds.length === 0) return [];
      const { data } = await supabase
        .from("forums")
        .select("id, title")
        .in("id", allIds);
      return data || [];
    },
    enabled: !!user && open,
  });

  const post = async (forumId: string) => {
    if (!user) return;
    setPosting(forumId);
    const { error } = await supabase.from("forum_messages").insert({
      forum_id: forumId,
      user_id: user.id,
      content: message,
      message_type: "text",
    });
    setPosting(null);
    if (error) {
      toast({ title: "Failed to post", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Shared to group! 🎉" });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share to a group</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : forums && forums.length > 0 ? (
            forums.map((f: any) => (
              <Button
                key={f.id}
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={() => post(f.id)}
                disabled={posting === f.id}
              >
                {posting === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {f.title}
              </Button>
            ))
          ) : (
            <p className="text-sm text-muted-foreground text-center py-6">
              You're not in any groups yet. Join or create one first!
            </p>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground italic">Preview: {message}</p>
      </DialogContent>
    </Dialog>
  );
}
