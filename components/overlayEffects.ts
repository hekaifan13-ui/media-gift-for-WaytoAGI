
import type { CSSProperties } from 'react';

export interface OverlayEffect {
  id: string;
  label: string;
  style: CSSProperties;
  style2?: CSSProperties;
  style3?: CSSProperties;
  className?: string;
}

// --- SVG patterns as data URIs ---

const STAMP_CROSS = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const STAMP_DIAMOND = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.12'%3E%3Cpath d='M20 0L40 20 20 40 0 20z' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E")`;

const STAMP_WAVE = `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%239C92AC' fill-opacity='0.1' fill-rule='evenodd'/%3E%3C/svg%3E")`;

const STAMP_CIRCLE = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.12'%3E%3Ccircle cx='20' cy='20' r='5'/%3E%3Ccircle cx='0' cy='0' r='5'/%3E%3Ccircle cx='40' cy='0' r='5'/%3E%3Ccircle cx='0' cy='40' r='5'/%3E%3Ccircle cx='40' cy='40' r='5'/%3E%3C/g%3E%3C/svg%3E")`;

export const OVERLAY_EFFECTS: OverlayEffect[] = [
  {
    id: 'none',
    label: '无',
    style: {},
  },

  // ── Holographic / Flash Card ──
  {
    id: 'holographic',
    label: '闪卡',
    // Layer 1: rainbow color bands
    style: {
      background: 'linear-gradient(135deg, rgba(255,0,128,0.25) 0%, rgba(0,255,255,0.2) 20%, rgba(255,255,0,0.2) 40%, rgba(128,0,255,0.22) 60%, rgba(0,255,128,0.2) 80%, rgba(255,0,128,0.18) 100%)',
      mixBlendMode: 'color-dodge' as const,
      opacity: 0.7,
    },
    // Layer 2: fine diagonal stripes (shimmer lines)
    style2: {
      background: 'repeating-linear-gradient(135deg, transparent 0px, transparent 3px, rgba(255,255,255,0.15) 3px, rgba(255,255,255,0.15) 5px)',
      mixBlendMode: 'overlay' as const,
    },
    // Layer 3: specular highlight spots
    style3: {
      background: 'radial-gradient(ellipse at 25% 25%, rgba(255,255,255,0.25) 0%, transparent 40%), radial-gradient(ellipse at 75% 60%, rgba(200,220,255,0.2) 0%, transparent 40%)',
      mixBlendMode: 'screen' as const,
    },
  },

  // ── Stamp / Print Patterns ──
  {
    id: 'stamp-cross',
    label: '十字印花',
    style: {
      backgroundImage: STAMP_CROSS,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'stamp-diamond',
    label: '菱形印花',
    style: {
      backgroundImage: STAMP_DIAMOND,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'stamp-wave',
    label: '波浪印花',
    style: {
      backgroundImage: STAMP_WAVE,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'stamp-circle',
    label: '圆点印花',
    style: {
      backgroundImage: STAMP_CIRCLE,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },

  // ── More Patterns ──
  {
    id: 'pattern-hexagon',
    label: '蜂窝',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='56' height='100' viewBox='0 0 56 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M28 66L0 50 0 16 28 0 56 16 56 50z' fill='none' stroke='%239C92AC' stroke-width='1' stroke-opacity='0.14'/%3E%3Cpath d='M28 100L0 84 0 50 28 34 56 50 56 84z' fill='none' stroke='%239C92AC' stroke-width='1' stroke-opacity='0.14'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '56px 100px',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'pattern-stripe',
    label: '斜线条纹',
    style: {
      background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(156,146,172,0.1) 8px, rgba(156,146,172,0.1) 10px)',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'pattern-star',
    label: '星星散点',
    style: {
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' viewBox='0 0 50 50' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.12'%3E%3Cpath d='M25 2l3.09 9.51h10l-8.09 5.88 3.09 9.51L25 21.02l-8.09 5.88 3.09-9.51-8.09-5.88h10z'/%3E%3C/g%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat',
      backgroundSize: '50px 50px',
      mixBlendMode: 'multiply' as const,
    },
  },
];
