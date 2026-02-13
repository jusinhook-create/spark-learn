import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Plus, Image, Flame, Loader2, ArrowLeft, Search, Copy, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ForumMessage = {
  id: string;
  forum_id: string;
  user_id: string;
  content: string | null;
  image_url: string | null;
  message_type: string;
  streak_data: any;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
};

export default function Forums() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeForum, setActiveForum] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: forums, isLoading: forumsLoading } = useQuery({
    queryKey: ["forums"],
    queryFn: async () => {
      const { data } = await supabase
        .from("forums")
        .select("*")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  const filteredForums = forums?.filter((f) =>
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const { data: forumMessages, isLoading: msgsLoading } = useQuery({
    queryKey: ["forum-messages", activeForum?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("forum_messages")
        .select("*")
        .eq("forum_id", activeForum!.id)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map((m) => m.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);

        return data.map((m) => ({
          ...m,
          profile: profiles?.find((p) => p.user_id === m.user_id),
        }));
      }
      return data || [];
    },
    enabled: !!activeForum,
    refetchInterval: 3000,
  });

  useEffect(() => {
    if (!activeForum) return;
    const channel = supabase
      .channel(`forum-${activeForum.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "forum_messages", filter: `forum_id=eq.${activeForum.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["forum-messages", activeForum.id] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeForum?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [forumMessages]);

  const createForum = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.from("forums").insert({
        title: newTitle,
        description: newDesc || null,
        created_by: user!.id,
        is_public: true,
      }).select().single();
      if (error) throw error;
      // Auto-join as admin
      await supabase.from("group_members").insert({ forum_id: data.id, user_id: user!.id, role: "admin" });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["forums"] });
      setShowCreate(false);
      setNewTitle("");
      setNewDesc("");
      toast({ title: "Group created!" });
    },
  });

  const joinByInvite = useMutation({
    mutationFn: async () => {
      const { data: forum, error } = await supabase
        .from("forums")
        .select("id, title")
        .eq("invite_code", inviteCode.trim())
        .single();
      if (error || !forum) throw new Error("Invalid invite code");
      
      const { error: joinErr } = await supabase.from("group_members").insert({
        forum_id: forum.id,
        user_id: user!.id,
      });
      if (joinErr) {
        if (joinErr.code === "23505") throw new Error("You're already in this group");
        throw joinErr;
      }
      return forum;
    },
    onSuccess: (forum) => {
      queryClient.invalidateQueries({ queryKey: ["forums"] });
      setShowJoin(false);
      setInviteCode("");
      toast({ title: "Joined!", description: `You joined "${forum.title}"` });
    },
    onError: (e: any) => {
      toast({ title: "Failed", description: e.message, variant: "destructive" });
    },
  });

  const joinGroup = async (forumId: string) => {
    const { error } = await supabase.from("group_members").insert({
      forum_id: forumId,
      user_id: user!.id,
    });
    if (error) {
      if (error.code === "23505") {
        toast({ title: "Already joined", description: "You're already in this group" });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else {
      toast({ title: "Joined!" });
    }
  };

  const copyInviteCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied!", description: "Invite code copied to clipboard" });
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeForum || !user) return;
    const { error } = await supabase.from("forum_messages").insert({
      forum_id: activeForum.id,
      user_id: user.id,
      content: message.trim(),
      message_type: "text",
    });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setMessage("");
    }
  };

  const sendImage = async (file: File) => {
    if (!activeForum || !user) return;
    const filePath = `${user.id}/${Date.now()}-${file.name}`;
    const { error: uploadErr } = await supabase.storage.from("forum-images").upload(filePath, file);
    if (uploadErr) { toast({ title: "Upload failed", variant: "destructive" }); return; }
    const { data: urlData } = supabase.storage.from("forum-images").getPublicUrl(filePath);
    await supabase.from("forum_messages").insert({
      forum_id: activeForum.id,
      user_id: user.id,
      image_url: urlData.publicUrl,
      message_type: "image",
    });
  };

  const shareStreak = async () => {
    if (!activeForum || !user) return;
    const { data: streak } = await supabase.from("streaks").select("*").eq("user_id", user.id).single();
    const { data: profile } = await supabase.from("profiles").select("display_name").eq("user_id", user.id).single();
    await supabase.from("forum_messages").insert({
      forum_id: activeForum.id,
      user_id: user.id,
      message_type: "streak",
      streak_data: {
        current_streak: streak?.current_streak || 0,
        longest_streak: streak?.longest_streak || 0,
        display_name: profile?.display_name || "Learner",
      },
    });
  };

  // Chat view
  if (activeForum) {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)]">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveForum(null)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <p className="font-semibold text-sm">{activeForum.title}</p>
            <p className="text-xs text-muted-foreground">{activeForum.description}</p>
          </div>
          {activeForum.invite_code && (
            <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => copyInviteCode(activeForum.invite_code)}>
              <Copy className="h-3 w-3" /> Invite
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 px-1">
          {forumMessages?.map((msg: ForumMessage) => {
            const isMe = msg.user_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[80%]">
                  {!isMe && (
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5 px-1">
                      {msg.profile?.display_name || "User"}
                    </p>
                  )}
                  {msg.message_type === "streak" ? (
                    <div className="bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/20 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-destructive" />
                        <div>
                          <p className="text-xs font-semibold">{msg.streak_data?.display_name}'s Streak</p>
                          <p className="text-lg font-bold text-destructive">{msg.streak_data?.current_streak} days 🔥</p>
                          <p className="text-[10px] text-muted-foreground">Best: {msg.streak_data?.longest_streak} days</p>
                        </div>
                      </div>
                    </div>
                  ) : msg.message_type === "image" ? (
                    <img src={msg.image_url!} alt="Shared" className="rounded-2xl max-w-full max-h-60 object-cover" />
                  ) : (
                    <div className={`rounded-2xl px-4 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                      {msg.content}
                    </div>
                  )}
                  <p className="text-[10px] text-muted-foreground mt-0.5 px-1">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="mt-3 flex gap-2 items-end">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) sendImage(f); }} />
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={() => fileInputRef.current?.click()}>
            <Image className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0" onClick={shareStreak}>
            <Flame className="h-4 w-4 text-destructive" />
          </Button>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl" onClick={sendMessage} disabled={!message.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Forum list view
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" /> Community Chat
          </h1>
          <p className="text-sm text-muted-foreground">Chat with fellow learners</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowJoin(true)}>
            <UserPlus className="h-4 w-4" /> Join
          </Button>
          <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4" /> New
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {forumsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4 h-16" />
            </Card>
          ))}
        </div>
      ) : filteredForums && filteredForums.length > 0 ? (
        <div className="space-y-2">
          {filteredForums.map((forum) => (
            <Card
              key={forum.id}
              className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => { joinGroup(forum.id); setActiveForum(forum); }}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 shrink-0">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{forum.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{forum.description || "Tap to chat"}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold">{searchQuery ? "No groups found" : "No groups yet"}</p>
            <p className="text-sm text-muted-foreground">{searchQuery ? "Try a different search" : "Create the first group to start chatting!"}</p>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Group Chat</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Group name" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} />
            <Input placeholder="Description (optional)" value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
            <Button className="w-full" onClick={() => createForum.mutate()} disabled={!newTitle.trim() || createForum.isPending}>
              {createForum.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Join by Invite Dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent>
          <DialogHeader><DialogTitle>Join Group by Invite Code</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Enter invite code..." value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} />
            <Button className="w-full" onClick={() => joinByInvite.mutate()} disabled={!inviteCode.trim() || joinByInvite.isPending}>
              {joinByInvite.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Join Group
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
