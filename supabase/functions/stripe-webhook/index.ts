import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2023-10-16" });

  // Create Supabase client with Service Role Key to bypass RLS
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig!, webhookSecret!);
  } catch (err) {
    console.error("WEBHOOK VERIFICATION FAILED:", err.message);
    return new Response(JSON.stringify({ error: "Signature verification failed", detail: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Helper to update teacher by EITHER Stripe ID or Email
  const updateTeacher = async (customerId: string, status: string, email?: string) => {
    // Normalize email to lowercase to prevent matching issues
    const cleanEmail = email?.toLowerCase();
    console.log(`Processing update: Customer ${customerId}, Email ${cleanEmail}, Status ${status}`);

    // Attempt 1: Update by Stripe Customer ID (for renewals/updates)
    let { data, error } = await supabase
      .from("teachers")
      .update({ subscription_status: status, stripe_customer_id: customerId })
      .eq("stripe_customer_id", customerId)
      .select();

    // Attempt 2: If no row was found by ID, match by Email (for initial checkout)
    if ((!data || data.length === 0) && cleanEmail) {
      console.log(`No match by Customer ID. Attempting link via email: ${cleanEmail}`);
      const { data: emailData, error: emailError } = await supabase
        .from("teachers")
        .update({ subscription_status: status, stripe_customer_id: customerId })
        .eq("email", cleanEmail)
        .select();

      if (emailError) {
        console.error("Database error during email update:", emailError.message);
      } else if (emailData && emailData.length > 0) {
        console.log(`Successfully linked and upgraded teacher via email: ${cleanEmail}`);
      } else {
        console.warn(`No teacher record found for email: ${cleanEmail}. Check table for typos.`);
      }
    } else if (error) {
      console.error("Database error during ID update:", error.message);
    } else if (data && data.length > 0) {
      console.log(`Successfully updated existing subscriber: ${customerId}`);
    }
  };

  // Handle specific Stripe events
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      // checkout sessions contain the email in customer_details
      await updateTeacher(session.customer as string, "pro", session.customer_details?.email);
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object;
      const status = sub.status === "active" ? "pro" : "free";
      await updateTeacher(sub.customer as string, status);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await updateTeacher(sub.customer as string, "free");
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
