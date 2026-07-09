/**
 * Trim fully-transparent (and optionally near-white) padding around an image.
 * Returns a new PNG data URL cropped to the real content bounding box.
 * This makes logos with different transparent margins render at a consistent
 * visual size when constrained by a fixed height (e.g. `h-20`).
 */
export async function trimTransparentEdges(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      if (!w || !h) return resolve(src);

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return resolve(src);
      ctx.drawImage(img, 0, 0);

      let imageData: ImageData;
      try {
        imageData = ctx.getImageData(0, 0, w, h);
      } catch {
        // Tainted canvas (CORS) — cannot read pixels, return original
        return resolve(src);
      }
      const { data } = imageData;

      const alphaThreshold = 10; // treat alpha <= 10 as transparent
      let top = 0, bottom = h - 1, left = 0, right = w - 1;

      const rowHasContent = (y: number) => {
        for (let x = 0; x < w; x++) {
          if (data[(y * w + x) * 4 + 3] > alphaThreshold) return true;
        }
        return false;
      };
      const colHasContent = (x: number) => {
        for (let y = 0; y < h; y++) {
          if (data[(y * w + x) * 4 + 3] > alphaThreshold) return true;
        }
        return false;
      };

      while (top < bottom && !rowHasContent(top)) top++;
      while (bottom > top && !rowHasContent(bottom)) bottom--;
      while (left < right && !colHasContent(left)) left++;
      while (right > left && !colHasContent(right)) right--;

      const cropW = right - left + 1;
      const cropH = bottom - top + 1;

      // If nothing was trimmed (opaque image, e.g. JPEG), return original
      if (cropW >= w && cropH >= h) return resolve(src);
      if (cropW <= 0 || cropH <= 0) return resolve(src);

      const out = document.createElement('canvas');
      out.width = cropW;
      out.height = cropH;
      const outCtx = out.getContext('2d');
      if (!outCtx) return resolve(src);
      outCtx.drawImage(canvas, left, top, cropW, cropH, 0, 0, cropW, cropH);
      resolve(out.toDataURL('image/png'));
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}
