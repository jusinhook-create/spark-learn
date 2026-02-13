import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, ExternalLink, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function Classes() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: materials } = useQuery({
    queryKey: ["study-materials", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("id, title, subject")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const getYouTubeUrl = (query: string) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query + " tutorial lesson educational")}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-6 w-6 text-destructive" /> Classes
        </h1>
        <p className="text-sm text-muted-foreground">Find YouTube classes based on your study materials</p>
      </div>

      {/* Custom search */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search for any topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) {
                  window.open(getYouTubeUrl(searchQuery), "_blank");
                }
              }}
            />
            <a href={searchQuery.trim() ? getYouTubeUrl(searchQuery) : "#"} target="_blank" rel="noopener noreferrer">
              <Button disabled={!searchQuery.trim()} className="gap-1">
                <Search className="h-4 w-4" /> Search
              </Button>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Materials-based suggestions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Based on Your Materials</h2>
        {materials && materials.length > 0 ? (
          <div className="space-y-3">
            {materials.map((mat) => (
              <a
                key={mat.id}
                href={getYouTubeUrl(mat.title + " " + (mat.subject || ""))}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-3">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 shrink-0">
                      <Video className="h-6 w-6 text-destructive" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{mat.title}</p>
                      {mat.subject && (
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          {mat.subject}
                        </span>
                      )}
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Video className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-semibold">No materials uploaded yet</p>
              <p className="text-sm text-muted-foreground">Upload study materials to get YouTube class suggestions!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
