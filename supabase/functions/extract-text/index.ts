import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader! } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { file_url, file_type, title, subject } = await req.json();

    let extractedText = "";

    if (file_type === "text") {
      // For text files, download and read content
      const response = await fetch(file_url);
      extractedText = await response.text();
    } else if (file_type === "pdf") {
      // Use Lovable AI to extract text from PDF via URL
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      // Download PDF as base64
      const pdfResponse = await fetch(file_url);
      const pdfBuffer = await pdfResponse.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(pdfBuffer)));

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Extract ALL text content from this PDF document. Return ONLY the raw text content, preserving structure with line breaks. Do not add commentary." },
            { role: "user", content: [
              { type: "text", text: "Extract all text from this PDF:" },
              { type: "image_url", image_url: { url: `data:application/pdf;base64,${base64}` } }
            ] }
          ],
        }),
      });

      if (!aiResponse.ok) {
        console.error("AI extraction error:", aiResponse.status);
        throw new Error("Failed to extract text from PDF");
      }

      const aiData = await aiResponse.json();
      extractedText = aiData.choices?.[0]?.message?.content || "";
    }

    // Save to study_materials
    const { data, error } = await supabase.from("study_materials").insert({
      user_id: user.id,
      title,
      file_url,
      file_type,
      extracted_text: extractedText,
      subject: subject || null,
    }).select().single();

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, material: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-text error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
