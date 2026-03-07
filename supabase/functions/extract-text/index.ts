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
      const response = await fetch(file_url);
      extractedText = await response.text();
    } else if (file_type === "pdf" || file_type === "image" || file_type === "docx") {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const fileResponse = await fetch(file_url);
      const fileBuffer = await fileResponse.arrayBuffer();
      const uint8 = new Uint8Array(fileBuffer);
      
      // Convert to base64 in chunks to avoid stack overflow
      let base64 = "";
      const chunkSize = 32768;
      for (let i = 0; i < uint8.length; i += chunkSize) {
        const chunk = uint8.subarray(i, i + chunkSize);
        base64 += String.fromCharCode(...chunk);
      }
      base64 = btoa(base64);

      let mimeType = "application/pdf";
      let systemPrompt = "Extract ALL text content from this PDF document. Return ONLY the raw text content, preserving structure with line breaks. Do not add commentary.";
      
      if (file_type === "image") {
        const ext = title?.split(".").pop()?.toLowerCase() || "png";
        const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", gif: "image/gif", webp: "image/webp", bmp: "image/bmp" };
        mimeType = mimeMap[ext] || "image/png";
        systemPrompt = "Extract ALL text visible in this image using OCR. Also describe any diagrams, charts, or visual content that would be useful for studying. Return the extracted text and descriptions clearly organized.";
      } else if (file_type === "docx") {
        mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        systemPrompt = "Extract ALL text content from this Word document. Return ONLY the raw text content, preserving structure with headings, paragraphs, lists, and line breaks. Do not add commentary.";
      }

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: [
              { type: "text", text: `Extract all text from this ${file_type} file:` },
              { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } }
            ] }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error("AI extraction error:", aiResponse.status, errText);
        throw new Error(`Failed to extract text from ${file_type}`);
      }

      const aiData = await aiResponse.json();
      extractedText = aiData.choices?.[0]?.message?.content || "";
    }

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
