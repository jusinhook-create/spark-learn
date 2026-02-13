import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const { email, name } = await req.json();
    if (!email) {
      throw new Error("Email is required");
    }

    const displayName = name || email.split("@")[0];

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Alpha Thought <onboarding@resend.dev>",
        to: [email],
        subject: "Welcome to Alpha Thought! Confirm Your Account",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1a1a2e; font-size: 28px; margin: 0;">Alpha Thought</h1>
              <p style="color: #666; margin-top: 8px;">Your learning journey starts here</p>
            </div>
            <div style="background: #f8f9fa; border-radius: 12px; padding: 30px; text-align: center;">
              <h2 style="color: #1a1a2e; margin-top: 0;">Welcome, ${displayName}! 🎉</h2>
              <p style="color: #444; font-size: 16px; line-height: 1.6;">
                Your account has been created successfully. Click the button below to get started!
              </p>
              <a href="https://confirmation-thumb.lovable.app" 
                 style="display: inline-block; background: #6366f1; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 600; margin-top: 16px;">
                Get Started
              </a>
            </div>
            <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">
              If you didn't create this account, you can safely ignore this email.
            </p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Resend error:", JSON.stringify(data));
      throw new Error(`Failed to send email: ${JSON.stringify(data)}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
