// Record a looping animation of a DOM node into a video (MP4 if supported, else WebM).
// Strategy: pre-render deterministic frames off the animation phase, then play them
// back onto a canvas in real time while MediaRecorder captures the canvas stream.

declare const htmlToImage: any;

export interface RecordOptions {
  node: HTMLElement;
  /** Set the deterministic animation phase (0..1) and return after React paints. */
  setPhase: (phase: number) => Promise<void>;
  width: number;
  height: number;
  fps?: number;
  /** Render scale multiplier for sharper output (default 2). */
  pixelRatio?: number;
  /** One full breathing cycle duration in seconds (should match the template). */
  cycleSeconds?: number;
  /** How many cycles to record. */
  cycles?: number;
  onProgress?: (ratio: number) => void;
}

function pickMimeType(): { mimeType: string; ext: string } {
  // Only alpha-capable containers — MP4/H.264 cannot store transparency, so we
  // stick to WebM (VP9/VP8 both support an alpha channel in Chromium).
  const candidates = [
    { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
    { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
    { mimeType: 'video/webm', ext: 'webm' },
  ];
  for (const c of candidates) {
    if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(c.mimeType)) {
      return c;
    }
  }
  return { mimeType: '', ext: 'webm' };
}

// Punch a real transparent rounded-rect hole where the visual frame sits — mirrors
// the still-image (PNG) export logic so video frames get the same transparent window.
function punchFrame(src: HTMLCanvasElement, node: HTMLElement, pixelRatio: number): HTMLCanvasElement {
  const hole = node.querySelector<HTMLElement>('[data-export-hole="true"]');
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  if (!ctx) return src;
  ctx.clearRect(0, 0, out.width, out.height);
  ctx.drawImage(src, 0, 0);
  if (!hole) return out;

  const cardRect = node.getBoundingClientRect();
  const holeRect = hole.getBoundingClientRect();
  // Ratios cancel any preview transform/scale, mapping exactly onto the bitmap.
  let x = ((holeRect.left - cardRect.left) / cardRect.width) * out.width;
  let y = ((holeRect.top - cardRect.top) / cardRect.height) * out.height;
  let w = (holeRect.width / cardRect.width) * out.width;
  let h = (holeRect.height / cardRect.height) * out.height;
  // Frame: 3px border + rounded-[32px] corners (design px → bitmap px).
  const bw = 3 * pixelRatio;
  const r = Math.max(0, 32 * pixelRatio - bw);
  x += bw; y += bw; w -= bw * 2; h -= bw * 2;

  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = '#000';
  ctx.beginPath();
  const rr = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  return out;
}

export async function recordAnimatedNode(opts: RecordOptions): Promise<{ blob: Blob; ext: string }> {
  const {
    node, setPhase, width, height,
    fps = 30, pixelRatio = 2, cycleSeconds = 2.4, cycles = 2, onProgress,
  } = opts;

  const framesPerCycle = Math.round(fps * cycleSeconds);
  const outW = Math.round(width * pixelRatio);
  const outH = Math.round(height * pixelRatio);

  // 1. Pre-render one full cycle of frames to bitmaps (slow, but off real-time clock).
  //    Rendered with a transparent background, then the visual frame is punched out
  //    so each frame carries a real transparent window.
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < framesPerCycle; i++) {
    const phase = i / framesPerCycle;
    await setPhase(phase);
    // allow two paints so transforms/box-shadow settle
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas: HTMLCanvasElement = await htmlToImage.toCanvas(node, {
      width,
      height,
      pixelRatio,
      cacheBust: false,
      backgroundColor: 'transparent',
      style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' },
    });
    frames.push(punchFrame(canvas, node, pixelRatio));
    onProgress?.((i + 1) / framesPerCycle * 0.7); // pre-render = first 70%
  }

  // 2. Play frames back on a canvas in real time and record the stream.
  const out = document.createElement('canvas');
  out.width = outW;
  out.height = outH;
  const ctx = out.getContext('2d', { alpha: true })!;
  const stream = out.captureStream(fps);
  const { mimeType, ext } = pickMimeType();
  const bitsPerSecond = Math.min(Math.round(outW * outH * fps * 0.15), 60_000_000);
  const recorder = new MediaRecorder(stream, {
    ...(mimeType ? { mimeType } : {}),
    videoBitsPerSecond: bitsPerSecond,
  });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };

  const done = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || 'video/webm' }));
  });

  recorder.start();

  const totalFrames = framesPerCycle * cycles;
  const frameInterval = 1000 / fps;
  const startTime = performance.now();

  await new Promise<void>((resolve) => {
    let lastDrawn = -1;
    const tick = () => {
      const elapsed = performance.now() - startTime;
      const frameIdx = Math.floor(elapsed / frameInterval);
      if (frameIdx >= totalFrames) {
        // draw final frame then finish
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(frames[(totalFrames - 1) % framesPerCycle], 0, 0, outW, outH);
        resolve();
        return;
      }
      if (frameIdx !== lastDrawn) {
        ctx.clearRect(0, 0, outW, outH);
        ctx.drawImage(frames[frameIdx % framesPerCycle], 0, 0, outW, outH);
        lastDrawn = frameIdx;
        onProgress?.(0.7 + (frameIdx / totalFrames) * 0.3);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  // give recorder a moment to flush the last frame
  await new Promise((r) => setTimeout(r, frameInterval * 2));
  recorder.stop();
  onProgress?.(1);
  return { blob: await done, ext };
}
