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
    // Increase default to 20, allow up to 30
    const count = Math.min(num_questions || 20, 30);

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

    // Generate a random seed for variety
    const seed = Math.random().toString(36).substring(2, 10);
    const timestamp = new Date().toISOString();

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
            content: `Generate exactly ${count} multiple-choice quiz questions based on the provided study material. Each question must have exactly 4 options.

IMPORTANT RULES FOR VARIETY:
- Use this random seed to vary your question selection: ${seed}
- Current timestamp: ${timestamp}
- Cover ALL sections and topics in the material, not just the beginning
- Mix question types: factual recall, conceptual understanding, application, analysis, and comparison
- Vary difficulty levels: include easy, medium, and hard questions
- Do NOT repeat similar questions — each must test a different concept or angle
- Randomize the position of the correct answer among the 4 options
- Include questions about details, definitions, relationships, causes/effects, and examples
- Pull from different parts of the material — beginning, middle, and end sections equally`,
          },
          {
            role: "user",
            content: `Generate ${count} unique and varied quiz questions from this material. Make sure to cover the ENTIRE material, not just the first section. Seed: ${seed}\n\n${textContent.slice(0, 20000)}`,
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
        temperature: 0.9,
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

    // Shuffle questions order for additional variety
    const shuffledQuestions = quizData.questions
      .sort(() => Math.random() - 0.5);

    // Create quiz
    const { data: quiz, error: quizErr } = await supabase.from("quizzes").insert({
      title: quizData.title,
      description: quizData.description,
      subject: material.subject,
      created_by: user.id,
      is_published: true,
      coins_reward: Math.max(10, count),
      time_limit_seconds: count * 30,
    }).select().single();

    if (quizErr) throw quizErr;

    // Create questions
    const questions = shuffledQuestions.map((q: any, i: number) => ({
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
