import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // 1) Lightweight: get IDs of projects without thumbnail (NO data column)
    const { data: ids, error: idErr } = await supabase
      .from("projects")
      .select("id")
      .is("thumbnail", null)
      .limit(50);
    if (idErr) throw idErr;

    // 2) Walk ids, fetch one project's data at a time, find first with image
    for (const row of ids || []) {
      const { data: proj, error: pErr } = await supabase
        .from("projects")
        .select("id, data")
        .eq("id", row.id)
        .maybeSingle();
      if (pErr || !proj) continue;

      const d = (proj as any).data || {};
      const img = d?.MODERN?.image || d?.LIVESTREAM?.image || d?.CODE?.image;
      if (typeof img !== "string" || !img.startsWith("data:image")) continue;

      const match = img.match(/^data:(.+);base64,(.+)$/);
      if (!match) continue;
      const mime = match[1];
      const ext = mime.split("/")[1] || "png";
      const bytes = Uint8Array.from(atob(match[2]), (c) => c.charCodeAt(0));

      const fileName = `thumbnails/${proj.id}_${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("uploads")
        .upload(fileName, bytes, { contentType: mime, upsert: true });
      if (upErr) throw upErr;

      const { data: pub } = supabase.storage.from("uploads").getPublicUrl(fileName);

      const { error: updErr } = await supabase
        .from("projects")
        .update({ thumbnail: pub.publicUrl })
        .eq("id", proj.id);
      if (updErr) throw updErr;

      return new Response(JSON.stringify({ success: true, done: false, processed: proj.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, done: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
