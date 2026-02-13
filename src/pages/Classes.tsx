import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, Plus, Calendar, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";

export default function Classes() {
  const { data: classes, isLoading } = useQuery({
    queryKey: ["classes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("classes")
        .select("*, profiles!classes_hosted_by_fkey(display_name)")
        .order("created_at", { ascending: false });
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-6 w-6 text-success" /> Classes
          </h1>
          <p className="text-sm text-muted-foreground">Browse recorded and live classes</p>
        </div>
        <Link to="/classes/host">
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" /> Host Class
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-0 shadow-sm animate-pulse">
              <CardContent className="p-4 h-24" />
            </Card>
          ))}
        </div>
      ) : classes && classes.length > 0 ? (
        <div className="grid gap-3">
          {classes.map((cls) => (
            <Card key={cls.id} className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-20 items-center justify-center rounded-xl bg-secondary shrink-0">
                    {cls.is_live ? <Video className="h-6 w-6 text-destructive" /> : <Play className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{cls.title}</p>
                      {cls.is_live && <span className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full font-bold uppercase">Live</span>}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{cls.description}</p>
                    {cls.subject && <span className="inline-block text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">{cls.subject}</span>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Video className="h-12 w-12 text-muted-foreground/30 mb-3" />
            <p className="font-semibold">No classes yet</p>
            <p className="text-sm text-muted-foreground">Host the first class for the community!</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
