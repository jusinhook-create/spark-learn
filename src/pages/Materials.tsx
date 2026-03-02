import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload, FileText, Trash2, Bot, Trophy, BookOpen, Loader2, ExternalLink, Image } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Link, useNavigate } from "react-router-dom";

export default function Materials() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [textContent, setTextContent] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const { data: materials, isLoading } = useQuery({
    queryKey: ["study-materials", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("study_materials")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data;
    },
    enabled: !!user,
  });

  const getFileType = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (ext === "pdf") return "pdf";
    if (["jpg", "jpeg", "png", "gif", "webp", "bmp"].includes(ext)) return "image";
    if (["doc", "docx"].includes(ext)) return "docx";
    return "text";
  };

  const uploadFile = async (file: File) => {
    if (!user) return;
    setIsUploading(true);

    try {
      const fileType = getFileType(file.name);
      const filePath = `${user.id}/${Date.now()}-${file.name}`;

      const { error: uploadErr } = await supabase.storage
        .from("study-uploads")
        .upload(filePath, file);

      if (uploadErr) throw uploadErr;

      const { data: signedUrlData } = await supabase.storage
        .from("study-uploads")
        .createSignedUrl(filePath, 3600);

      const { data: urlData } = supabase.storage
        .from("study-uploads")
        .getPublicUrl(filePath);

      const fileUrl = signedUrlData?.signedUrl || urlData.publicUrl;

      const resp = await supabase.functions.invoke("extract-text", {
        body: {
          file_url: fileUrl,
          file_type: fileType,
          title: title || file.name.replace(/\.[^/.]+$/, ""),
          subject: subject || null,
        },
      });

      if (resp.error) throw new Error(resp.error.message);

      toast({ title: "Uploaded!", description: "Material processed successfully." });
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
      setTitle("");
      setSubject("");
    } catch (e: any) {
      toast({ title: "Upload failed", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadText = async () => {
    if (!user || !textContent.trim()) return;
    setIsUploading(true);

    try {
      const { data, error } = await supabase.from("study_materials").insert({
        user_id: user.id,
        title: title || "Pasted Text",
        file_type: "text",
        extracted_text: textContent,
        subject: subject || null,
      }).select().single();

      if (error) throw error;

      toast({ title: "Saved!", description: "Text material saved successfully." });
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
      setTitle("");
      setSubject("");
      setTextContent("");
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteMaterial = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("study_materials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
      toast({ title: "Deleted" });
    },
  });

  const generateQuiz = useMutation({
    mutationFn: async (materialId: string) => {
      const resp = await supabase.functions.invoke("generate-quiz", {
        body: { material_id: materialId, num_questions: 20 },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["quizzes"] });
      toast({ title: "Quiz Generated!", description: `"${data.quiz.title}" is ready to take.` });
    },
    onError: (e: any) => {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    },
  });

  const generateNotes = useMutation({
    mutationFn: async (materialId: string) => {
      const resp = await supabase.functions.invoke("generate-notes", {
        body: { material_id: materialId },
      });
      if (resp.error) throw new Error(resp.error.message);
      if (resp.data?.error) throw new Error(resp.data.error);
      return resp.data;
    },
    onSuccess: () => {
      toast({
        title: "Notes Generated! ✅",
        description: "Your notes are ready. Tap to view them.",
      });
      navigate("/notes");
    },
    onError: (e: any) => {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    },
  });

  const fileTypeLabel = (ft: string | null) => {
    if (!ft) return "TEXT";
    const labels: Record<string, string> = { pdf: "PDF", image: "IMAGE", docx: "WORD", text: "TEXT" };
    return labels[ft] || ft.toUpperCase();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Upload className="h-6 w-6 text-primary" /> Study Materials
        </h1>
        <p className="text-sm text-muted-foreground">Upload PDFs, images, Word docs or paste text</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Input placeholder="Title (optional)" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Input placeholder="Subject (optional)" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          <Textarea
            placeholder="Paste your study text here..."
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            className="min-h-[100px]"
          />

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.md,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.bmp"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadFile(file);
              }}
            />
            <Button
              variant="outline"
              className="gap-2 flex-1"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
              Upload File
            </Button>
            <Button
              className="gap-2 flex-1"
              onClick={uploadText}
              disabled={isUploading || !textContent.trim()}
            >
              {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save Text
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Supports: PDF, Word (.doc, .docx), Images (JPG, PNG, etc.), Text files
          </p>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Your Materials</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <CardContent className="p-4 h-24" />
              </Card>
            ))}
          </div>
        ) : materials && materials.length > 0 ? (
          <div className="space-y-3">
            {materials.map((mat) => (
              <Card key={mat.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-semibold">{mat.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded-full">
                          {fileTypeLabel(mat.file_type)}
                        </span>
                        {mat.subject && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            {mat.subject}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMaterial.mutate(mat.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {mat.extracted_text && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {mat.extracted_text.slice(0, 200)}...
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <Link to={`/ai-tutor?material=${mat.id}`}>
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <Bot className="h-3 w-3" /> Ask AI Tutor
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => generateQuiz.mutate(mat.id)}
                      disabled={generateQuiz.isPending}
                    >
                      {generateQuiz.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trophy className="h-3 w-3" />}
                      Generate Quiz
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1 text-xs"
                      onClick={() => generateNotes.mutate(mat.id)}
                      disabled={generateNotes.isPending}
                    >
                      {generateNotes.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <BookOpen className="h-3 w-3" />}
                      Generate Notes
                    </Button>
                    <a
                      href={`https://www.youtube.com/results?search_query=${encodeURIComponent(mat.title + " " + (mat.subject || "") + " tutorial lesson")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button size="sm" variant="outline" className="gap-1 text-xs">
                        <ExternalLink className="h-3 w-3" /> Find YouTube Classes
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Upload className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="font-semibold">No materials yet</p>
              <p className="text-sm text-muted-foreground">Upload a file or paste text to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
