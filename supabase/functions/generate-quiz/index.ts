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

    const { material_id, num_questions } = await req.json();
    const count = num_questions || 10;

    // Get material
    const { data: material, error: matErr } = await supabase
      .from("study_materials")
      .select("*")
      .eq("id", material_id)
      .eq("user_id", user.id)
      .single();

    if (matErr || !material) throw new Error("Material not found");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const textContent = material.extracted_text || material.title;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system" as const,
            content: `Generate exactly ${count} multiple-choice quiz questions based on the provided study material. Each question must have exactly 4 options.`,
          },
          {
            role: "user",
            content: `Generate ${count} quiz questions from this material:\n\n${textContent.slice(0, 15000)}`,
          },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_quiz",
            description: "Create a quiz with questions",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "Quiz title" },
                description: { type: "string", description: "Brief quiz description" },
                questions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      question_text: { type: "string" },
                      options: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                      correct_answer_index: { type: "number", minimum: 0, maximum: 3 },
                    },
                    required: ["question_text", "options", "correct_answer_index"],
                  },
                },
              },
              required: ["title", "description", "questions"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_quiz" } },
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Too many requests. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try again later." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI generation failed");
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No quiz data generated");

    const quizData = JSON.parse(toolCall.function.arguments);

    // Create quiz
    const { data: quiz, error: quizErr } = await supabase.from("quizzes").insert({
      title: quizData.title,
      description: quizData.description,
      subject: material.subject,
      created_by: user.id,
      is_published: true,
      coins_reward: 10,
      time_limit_seconds: count * 30,
    }).select().single();

    if (quizErr) throw quizErr;

    // Create questions
    const questions = quizData.questions.map((q: any, i: number) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      options: q.options,
      correct_answer_index: q.correct_answer_index,
      order_index: i,
    }));

    const { error: qErr } = await supabase.from("questions").insert(questions);
    if (qErr) throw qErr;

    return new Response(JSON.stringify({ success: true, quiz }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-quiz error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
