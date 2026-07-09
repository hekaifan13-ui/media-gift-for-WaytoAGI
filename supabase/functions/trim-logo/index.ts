import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Minimal PNG-only transparent-edge trim using pure Deno + imagescript decode
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { projectId, template, index } = await req.json();
    if (!projectId || !template || index === undefined) {
      throw new Error("projectId, template, index required");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: proj, error } = await supabase
      .from("projects").select("data").eq("id", projectId).maybeSingle();
    if (error || !proj) throw new Error("project not found");

    const d = (proj as any).data || {};
    const logos: string[] = d?.[template]?.logos || [];
    const src = logos[index];
    if (!src || !src.startsWith("data:image")) {
      return new Response(JSON.stringify({ status: "not base64, skipped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const m = src.match(/^data:(.+);base64,(.+)$/);
    if (!m) throw new Error("bad base64");
    const bytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));

    const img: any = await decode(bytes);
    const w = img.width, h = img.height;

    // find bounding box of non-transparent pixels
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const px = img.getPixelAt(x + 1, y + 1); // 1-indexed, RGBA packed
        const alpha = px & 0xff;
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) throw new Error("fully transparent image");
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    let outImg = img;
    if (cropW < w || cropH < h) {
      outImg = img.clone().crop(minX, minY, cropW, cropH);
    }
    const outBytes = await outImg.encode(); // PNG

    const fileName = `logos/${projectId}_${template}_${index}_${Date.now()}.png`;
    const { error: upErr } = await supabase.storage
      .from("uploads").upload(fileName, outBytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("uploads").getPublicUrl(fileName);

    // replace logo in data
    logos[index] = pub.publicUrl;
    d[template].logos = logos;

    const { error: updErr } = await supabase
      .from("projects").update({ data: d }).eq("id", projectId);
    if (updErr) throw updErr;

    return new Response(JSON.stringify({
      status: "done",
      original: `${w}x${h}`,
      cropped: `${cropW}x${cropH}`,
      url: pub.publicUrl,
    }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ status: "error", error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
