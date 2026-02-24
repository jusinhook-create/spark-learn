import { useIsAdmin } from "@/hooks/use-admin";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Shield, Users, Trash2, BookOpen, Trophy, MessageSquare, Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function Admin() {
  const { isAdmin, isLoading: roleLoading } = useIsAdmin();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchEmail, setSearchEmail] = useState("");

  // Redirect non-admins
  if (!roleLoading && !isAdmin) return <Navigate to="/" replace />;
  if (roleLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Stats queries
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
    enabled: isAdmin,
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
    enabled: isAdmin,
  });

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

      {/* Users */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Users</CardTitle>
          <Input
            placeholder="Search by name..."
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="mt-2"
          />
        </CardHeader>
        <CardContent className="space-y-2">
          {users?.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold shrink-0">
                {u.display_name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{u.display_name || "No name"}</p>
                <p className="text-xs text-muted-foreground">{u.coins} coins · {u.education_level || "No level"}</p>
              </div>
            </div>
          ))}
          {users?.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No users found</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
