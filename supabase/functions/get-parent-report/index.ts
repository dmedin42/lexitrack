import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get("studentId");

    if (!studentId) {
      return new Response(JSON.stringify({ error: "studentId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to bypass RLS for public report sharing
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch student
    const { data: student, error: studentErr } = await supabase
      .from("students")
      .select("id, name, avatar, grade")
      .eq("id", studentId)
      .single();

    if (studentErr || !student) {
      return new Response(JSON.stringify({ error: "Student not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch latest assessment
    const { data: assessment } = await supabase
      .from("assessments")
      .select("id, date, fluency_score, accuracy_score, passage_title")
      .eq("student_id", studentId)
      .order("date", { ascending: false })
      .limit(1)
      .single();

    if (!assessment) {
      return new Response(JSON.stringify({ student, assessment: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch word assessments
    const { data: words } = await supabase
      .from("word_assessments")
      .select("word, error_type, detected_word, confidence")
      .eq("assessment_id", assessment.id)
      .order("word_index", { ascending: true });

    return new Response(
      JSON.stringify({ student, assessment: { ...assessment, words: words ?? [] } }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
