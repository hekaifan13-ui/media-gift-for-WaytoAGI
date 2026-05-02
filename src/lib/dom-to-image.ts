// @ts-nocheck
// Lightweight DOM-to-image using SVG foreignObject + canvas.
// Replaces html-to-image for our basic export needs (PNG/JPEG).

type ExportOptions = {
  width?: number;
  height?: number;
  pixelRatio?: number;
  quality?: number;
  backgroundColor?: string;
  style?: Partial<CSSStyleDeclaration>;
  cacheBust?: boolean;
  skipAutoScale?: boolean;
};

// Properties to copy as inline styles (most visual ones)
const STYLE_PROPS = [
  'color', 'background', 'background-color', 'background-image', 'background-size',
  'background-position', 'background-repeat', 'background-clip', '-webkit-background-clip',
  'font', 'font-family', 'font-size', 'font-weight', 'font-style', 'line-height',
  'letter-spacing', 'text-align', 'text-decoration', 'text-shadow', 'text-transform',
  '-webkit-text-fill-color', 'white-space', 'word-break', 'word-wrap',
  'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-radius', 'border-color', 'border-style', 'border-width',
  'box-shadow', 'opacity', 'visibility', 'overflow', 'overflow-x', 'overflow-y',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
  'display', 'flex', 'flex-direction', 'flex-wrap', 'justify-content', 'align-items',
  'align-content', 'align-self', 'gap', 'row-gap', 'column-gap', 'grid', 'grid-template',
  'grid-template-columns', 'grid-template-rows', 'grid-area', 'grid-column', 'grid-row',
  'position', 'top', 'right', 'bottom', 'left', 'z-index', 'transform', 'transform-origin',
  'transform-style', 'perspective', 'filter', 'backdrop-filter', '-webkit-backdrop-filter',
  'mix-blend-mode', 'object-fit', 'object-position', 'cursor', 'pointer-events',
  'box-sizing', 'outline', 'list-style',
];

function inlineStyles(source: Element, target: Element) {
  const computed = window.getComputedStyle(source);
  if (!(target as HTMLElement).style) return;
  let css = '';
  for (const prop of STYLE_PROPS) {
    const val = computed.getPropertyValue(prop);
    if (val) css += `${prop}:${val};`;
  }
  (target as HTMLElement).setAttribute('style', css);

  // Recurse children
  const sChildren = source.children;
  const tChildren = target.children;
  for (let i = 0; i < sChildren.length && i < tChildren.length; i++) {
    inlineStyles(sChildren[i], tChildren[i]);
  }
}

async function nodeToDataURL(node: HTMLElement, opts: ExportOptions): Promise<string> {
  const width = opts.width || node.offsetWidth;
  const height = opts.height || node.offsetHeight;

  // Clone the node deeply
  const clone = node.cloneNode(true) as HTMLElement;
  // Inline computed styles
  inlineStyles(node, clone);

  // Apply override styles
  if (opts.style) {
    Object.assign(clone.style, opts.style);
  }

  // Serialize to XHTML string
  const xml = new XMLSerializer().serializeToString(clone);

  // Convert images to base64 (best effort) - skip for simplicity. Cross-origin images may fail.
  // Wrap in SVG foreignObject
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject x="0" y="0" width="100%" height="100%">
        ${xml.replace(/^<[^ >]+/, m => `${m} xmlns="http://www.w3.org/1999/xhtml"`)}
      </foreignObject>
    </svg>
  `;

  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  // Load SVG into image
  const img = new Image();
  img.crossOrigin = 'anonymous';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = (e) => reject(e);
    img.src = svgUrl;
  });

  const ratio = opts.pixelRatio || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  const ctx = canvas.getContext('2d')!;
  if (opts.backgroundColor && opts.backgroundColor !== 'transparent') {
    ctx.fillStyle = opts.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL.length > 0 ? canvas : (canvas as any);
}

export async function toPng(node: HTMLElement, options: ExportOptions = {}): Promise<string> {
  const canvas = await nodeToDataURL(node, options);
  return (canvas as HTMLCanvasElement).toDataURL('image/png');
}

export async function toJpeg(node: HTMLElement, options: ExportOptions = {}): Promise<string> {
  const canvas = await nodeToDataURL(node, { ...options, backgroundColor: options.backgroundColor || '#ffffff' });
  return (canvas as HTMLCanvasElement).toDataURL('image/jpeg', options.quality ?? 0.92);
}
