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
  /** One full breathing cycle duration in seconds (should match the template). */
  cycleSeconds?: number;
  /** How many cycles to record. */
  cycles?: number;
  onProgress?: (ratio: number) => void;
}

function pickMimeType(): { mimeType: string; ext: string } {
  const candidates = [
    { mimeType: 'video/mp4;codecs=h264', ext: 'mp4' },
    { mimeType: 'video/mp4', ext: 'mp4' },
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

export async function recordAnimatedNode(opts: RecordOptions): Promise<{ blob: Blob; ext: string }> {
  const {
    node, setPhase, width, height,
    fps = 30, cycleSeconds = 2.4, cycles = 2, onProgress,
  } = opts;

  const framesPerCycle = Math.round(fps * cycleSeconds);

  // 1. Pre-render one full cycle of frames to bitmaps (slow, but off real-time clock).
  const frames: HTMLCanvasElement[] = [];
  for (let i = 0; i < framesPerCycle; i++) {
    const phase = i / framesPerCycle;
    await setPhase(phase);
    // allow two paints so transforms/box-shadow settle
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const canvas: HTMLCanvasElement = await htmlToImage.toCanvas(node, {
      width,
      height,
      pixelRatio: 1,
      cacheBust: false,
      backgroundColor: '#ffffff',
      style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' },
    });
    frames.push(canvas);
    onProgress?.((i + 1) / framesPerCycle * 0.7); // pre-render = first 70%
  }

  // 2. Play frames back on a canvas in real time and record the stream.
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const ctx = out.getContext('2d')!;
  const stream = out.captureStream(fps);
  const { mimeType, ext } = pickMimeType();
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
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
        ctx.drawImage(frames[(totalFrames - 1) % framesPerCycle], 0, 0);
        resolve();
        return;
      }
      if (frameIdx !== lastDrawn) {
        ctx.drawImage(frames[frameIdx % framesPerCycle], 0, 0);
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
