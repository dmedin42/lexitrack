import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  console.log("--- FUNCTION STARTED ---");
  console.log("Method:", req.method);

  if (req.method === "OPTIONS") {
    console.log("Handling OPTIONS preflight");
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    console.log("Stripe Key Present:", !!stripeKey);

    const authHeader = req.headers.get("Authorization");
    console.log("Auth Header Present:", !!authHeader);

    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    console.log("Checking User...");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log("User Auth Error:", userError?.message);
      throw new Error("Invalid user token");
    }
    console.log("User Identified:", user.email);

    const body = await req.json();
    console.log("Request Body:", JSON.stringify(body));

    const priceId = Deno.env.get("STRIPE_PRICE_ID");
    if (!priceId) throw new Error("STRIPE_PRICE_ID secret is not configured");

    const stripe = new Stripe(stripeKey!, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    console.log("Fetching Teacher from DB...");
    const { data: teacher, error: teacherError } = await supabase
      .from("teachers")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    if (teacherError) console.log("Database Query Error (can be normal if new):", teacherError.message);

    let customerId = teacher?.stripe_customer_id;

    if (!customerId) {
      console.log("Creating new Stripe Customer...");
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      console.log("Updating teacher with customer ID:", customerId);
      await supabase.from("teachers").update({ stripe_customer_id: customerId }).eq("id", user.id);
    }

    console.log("Creating Checkout Session for price:", priceId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_collection: "if_required",
      allow_promotion_codes: true,
      success_url: `https://lexitrackedu.com/?upgraded=true`,
      cancel_url: `https://lexitrackedu.com/manage-class`,
    });

    console.log("Session Created Successfully:", session.url);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("CRITICAL ERROR:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
