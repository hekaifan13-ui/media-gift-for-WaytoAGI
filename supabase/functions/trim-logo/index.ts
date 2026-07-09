import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { decode } from "https://deno.land/x/imagescript@1.2.15/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Trim transparent edges of a PNG. Two modes:
//  - { mode: "project", projectId, template, index }  -> trims a logo inside projects.data
//  - { mode: "library", logoId }                       -> trims a logo row in the logos table
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Resolve source bytes + a writer callback
    let srcBytes: Uint8Array;
    let sourceLabel = "";
    let writeBack: (url: string) => Promise<void>;

    if (body.mode === "library") {
      const { logoId } = body;
      if (!logoId) throw new Error("logoId required");
      const { data: row, error } = await supabase
        .from("logos").select("url").eq("id", logoId).maybeSingle();
      if (error || !row) throw new Error("logo not found");
      const url: string = (row as any).url;
      sourceLabel = url;

      if (url.startsWith("data:image")) {
        const m = url.match(/^data:(.+);base64,(.+)$/);
        if (!m) throw new Error("bad base64");
        srcBytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      } else {
        const resp = await fetch(url);
        if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
        srcBytes = new Uint8Array(await resp.arrayBuffer());
      }
      writeBack = async (newUrl: string) => {
        const { error: e } = await supabase.from("logos").update({ url: newUrl }).eq("id", logoId);
        if (e) throw e;
      };
    } else {
      // project mode
      const { projectId, template, index } = body;
      if (!projectId || !template || index === undefined) {
        throw new Error("projectId, template, index required");
      }
      const { data: proj, error } = await supabase
        .from("projects").select("data").eq("id", projectId).maybeSingle();
      if (error || !proj) throw new Error("project not found");
      const d = (proj as any).data || {};
      const logos: string[] = d?.[template]?.logos || [];
      const src = logos[index];
      if (!src) throw new Error("logo not found at index");
      sourceLabel = src.slice(0, 40);

      if (src.startsWith("data:image")) {
        const m = src.match(/^data:(.+);base64,(.+)$/);
        if (!m) throw new Error("bad base64");
        srcBytes = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
      } else {
        const resp = await fetch(src);
        if (!resp.ok) throw new Error(`fetch failed: ${resp.status}`);
        srcBytes = new Uint8Array(await resp.arrayBuffer());
      }
      writeBack = async (newUrl: string) => {
        logos[index] = newUrl;
        d[template].logos = logos;
        const { error: e } = await supabase.from("projects").update({ data: d }).eq("id", projectId);
        if (e) throw e;
      };
    }

    // Decode + compute non-transparent bounding box
    const img: any = await decode(srcBytes);
    const w = img.width, h = img.height;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const alpha = img.getPixelAt(x + 1, y + 1) & 0xff;
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (maxX < 0) {
      return new Response(JSON.stringify({ status: "skipped: fully opaque or transparent", size: `${w}x${h}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    if (cropW >= w && cropH >= h) {
      return new Response(JSON.stringify({ status: "skipped: no transparent padding", size: `${w}x${h}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const outImg = img.clone().crop(minX, minY, cropW, cropH);
    const outBytes = await outImg.encode();

    const fileName = `logos/trimmed_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.png`;
    const { error: upErr } = await supabase.storage
      .from("uploads").upload(fileName, outBytes, { contentType: "image/png", upsert: true });
    if (upErr) throw upErr;

    const { data: pub } = supabase.storage.from("uploads").getPublicUrl(fileName);
    await writeBack(pub.publicUrl);

    return new Response(JSON.stringify({
      status: "done",
      source: sourceLabel,
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
