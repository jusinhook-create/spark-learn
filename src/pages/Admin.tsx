import { useIsAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Trash2, BookOpen, Trophy, MessageSquare, Loader2, UserCog, Plus, X } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedRole, setSelectedRole] = useState<AppRole>("moderator");

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [profiles, materials, quizzes, forums] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("study_materials").select("*", { count: "exact", head: true }),
        supabase.from("quizzes").select("*", { count: "exact", head: true }),
        supabase.from("forums").select("*", { count: "exact", head: true }),
      ]);
      return {
        users: profiles.count ?? 0,
        materials: materials.count ?? 0,
        quizzes: quizzes.count ?? 0,
        forums: forums.count ?? 0,
      };
    },
  });

  const { data: users } = useQuery({
    queryKey: ["admin-users", searchEmail],
    queryFn: async () => {
      let query = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(50);
      if (searchEmail) {
        query = query.ilike("display_name", `%${searchEmail}%`);
      }
      const { data } = await query;
      return data ?? [];
    },
  });

  const { data: allRoles } = useQuery({
    queryKey: ["admin-all-roles"],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("*");
      return data ?? [];
    },
  });

  const addRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role added successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Failed to add role", description: e.message, variant: "destructive" });
    },
  });

  const removeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-roles"] });
      toast({ title: "Role removed successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Failed to remove role", description: e.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      const resp = await supabase.functions.invoke("admin-delete-user", {
        body: { target_user_id: targetUserId },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast({ title: "User deleted successfully" });
    },
    onError: (e: Error) => {
      toast({ title: "Failed to delete user", description: e.message, variant: "destructive" });
    },
  });

  const getUserRoles = (userId: string): AppRole[] => {
    return (allRoles ?? []).filter((r) => r.user_id === userId).map((r) => r.role);
  };

  const roleBadgeColor = (role: AppRole) => {
    if (role === "admin") return "destructive" as const;
    if (role === "moderator") return "default" as const;
    return "secondary" as const;
  };

  if (roleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.users ?? 0, icon: Users, color: "text-primary" },
    { label: "Study Materials", value: stats?.materials ?? 0, icon: BookOpen, color: "text-accent" },
    { label: "Quizzes", value: stats?.quizzes ?? 0, icon: Trophy, color: "text-warning" },
    { label: "Forums", value: stats?.forums ?? 0, icon: MessageSquare, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your platform</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {statCards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="border-0 shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <Icon className={`h-5 w-5 ${color}`} />
              <div>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Users & Role Management */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Users & Roles
          </CardTitle>
          <Input
            placeholder="Search by name..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-3">
          {users?.map((u) => {
            const roles = getUserRoles(u.user_id);
            return (
              <div key={u.id} className="rounded-lg border p-3 space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                    {u.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{u.display_name || "No name"}</p>
                    <p className="text-xs text-muted-foreground">{u.coins} coins · {u.education_level || "No level"}</p>
                  </div>
                  {/* Delete user button - only for admins, can't delete self */}
                  {isAdmin && u.user_id !== user?.id && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete user account?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete <strong>{u.display_name || "this user"}</strong>'s account and all their data. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(u.user_id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleteUserMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
                {/* Roles */}
                <div className="flex flex-wrap gap-1.5 items-center">
                  {roles.map((role) => (
                    <Badge key={role} variant={roleBadgeColor(role)} className="gap-1 text-xs">
                      {role}
                      {isAdmin && role !== "user" && u.user_id !== user?.id && (
                        <button
                          onClick={() => removeRoleMutation.mutate({ userId: u.user_id, role })}
                          className="ml-0.5 hover:opacity-70"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {/* Add role - admin only */}
                  {isAdmin && u.user_id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as AppRole)}>
                        <SelectTrigger className="h-7 w-28 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">admin</SelectItem>
                          <SelectItem value="moderator">moderator</SelectItem>
                          <SelectItem value="user">user</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        disabled={roles.includes(selectedRole)}
                        onClick={() => addRoleMutation.mutate({ userId: u.user_id, role: selectedRole })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {users?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
