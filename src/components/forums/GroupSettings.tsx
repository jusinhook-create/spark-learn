import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, LogOut, Users, Shield, Loader2, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface GroupSettingsProps {
  forum: any;
  onLeft: () => void;
}

export function GroupSettings({ forum, onLeft }: GroupSettingsProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isCreator = forum.created_by === user?.id;

  const { data: members } = useQuery({
    queryKey: ["group-members", forum.id],
    queryFn: async () => {
      const { data: gm } = await supabase
        .from("group_members")
        .select("*")
        .eq("forum_id", forum.id);
      if (!gm || gm.length === 0) return [];
      const userIds = gm.map((m: any) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", userIds);
      return gm.map((m: any) => ({
        ...m,
        profile: profiles?.find((p: any) => p.user_id === m.user_id),
      }));
    },
  });

  const { data: joinRequests } = useQuery({
    queryKey: ["join-requests", forum.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("join_requests")
        .select("*")
        .eq("forum_id", forum.id)
        .eq("status", "pending");
      if (!data || data.length === 0) return [];
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      return data.map((r: any) => ({
        ...r,
        profile: profiles?.find((p: any) => p.user_id === r.user_id),
      }));
    },
    enabled: isCreator,
  });

  const toggleApproval = useMutation({
    mutationFn: async (value: boolean) => {
      const { error } = await supabase
        .from("forums")
        .update({ require_approval: value } as any)
        .eq("id", forum.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forums"] });
      toast({ title: "Setting updated" });
    },
  });

  const handleRequest = useMutation({
    mutationFn: async ({ requestId, userId, approve }: { requestId: string; userId: string; approve: boolean }) => {
      const { error } = await supabase
        .from("join_requests")
        .update({ status: approve ? "approved" : "rejected", reviewed_by: user!.id } as any)
        .eq("id", requestId);
      if (error) throw error;
      if (approve) {
        await supabase.from("group_members").insert({ forum_id: forum.id, user_id: userId });
      }
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["join-requests", forum.id] });
      queryClient.invalidateQueries({ queryKey: ["group-members", forum.id] });
      toast({ title: approve ? "Request approved" : "Request rejected" });
    },
  });

  const leaveGroup = useMutation({
    mutationFn: async () => {
      await supabase.from("group_members").delete().eq("forum_id", forum.id).eq("user_id", user!.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forums"] });
      toast({ title: "You left the group" });
      onLeft();
    },
  });

  const clearChat = useMutation({
    mutationFn: async () => {
      if (!user?.id || !forum?.id) throw new Error("Missing user or group");
      // Triple-scope guard: forum + user, RLS also enforces user_id = auth.uid()
      const { error, count } = await supabase
        .from("forum_messages")
        .delete({ count: "exact" })
        .eq("forum_id", forum.id)
        .eq("user_id", user.id);
      if (error) throw error;
      return count ?? 0;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["forum-messages", forum.id] });
      toast({ title: "Delete successful 🟢", description: `${count} of your messages cleared` });
    },
    onError: (e: any) => {
      toast({ title: "Could not clear", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Group Settings</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 mt-4">
          {/* Approval toggle - creator only */}
          {isCreator && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Require Approval to Join</p>
                <p className="text-xs text-muted-foreground">New members need your approval</p>
              </div>
              <Switch
                checked={!!(forum as any).require_approval}
                onCheckedChange={(v) => toggleApproval.mutate(v)}
                disabled={toggleApproval.isPending}
              />
            </div>
          )}

          {/* Join Requests - creator only */}
          {isCreator && joinRequests && joinRequests.length > 0 && (
            <div>
              <p className="text-sm font-semibold flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4" /> Pending Requests
              </p>
              <div className="space-y-2">
                {joinRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                    <span className="text-sm flex-1">{req.profile?.display_name || "User"}</span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-green-600"
                      onClick={() => handleRequest.mutate({ requestId: req.id, userId: req.user_id, approve: true })}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRequest.mutate({ requestId: req.id, userId: req.user_id, approve: false })}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Members list */}
          <div>
            <p className="text-sm font-semibold flex items-center gap-2 mb-2">
              <Users className="h-4 w-4" /> Members ({members?.length || 0})
            </p>
            <div className="space-y-2">
              {members?.map((m: any) => (
                <div key={m.id} className="flex items-center gap-2 p-2 rounded-lg bg-secondary">
                  <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold shrink-0">
                    {m.profile?.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span className="text-sm flex-1">{m.profile?.display_name || "User"}</span>
                  {m.role === "admin" && <Badge variant="secondary" className="text-[10px]">Admin</Badge>}
                </div>
              ))}
            </div>
          </div>

          {/* Exit group + Clear chat */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full gap-2">
                <LogOut className="h-4 w-4" /> Exit / Clear
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Group actions</AlertDialogTitle>
                <AlertDialogDescription>
                  Choose what to do. "Clear Chat" removes only your own messages from this group.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="grid gap-2 py-2">
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Type <span className="font-mono font-semibold">CLEAR</span> to delete only your own messages in this group.
                  </p>
                  <Input
                    value={clearConfirm}
                    onChange={(e) => setClearConfirm(e.target.value)}
                    placeholder="Type CLEAR"
                    className="h-8"
                  />
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => { clearChat.mutate(undefined, { onSettled: () => setClearConfirm("") }); }}
                    disabled={clearChat.isPending || clearConfirm !== "CLEAR"}
                  >
                    {clearChat.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "🧹"} Clear my messages
                  </Button>
                </div>
                {!isCreator && (
                  <Button
                    variant="destructive"
                    className="w-full justify-start gap-2"
                    onClick={() => leaveGroup.mutate()}
                    disabled={leaveGroup.isPending}
                  >
                    {leaveGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />} Exit Group
                  </Button>
                )}
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </SheetContent>
    </Sheet>
  );
}
