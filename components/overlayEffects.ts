
import type { CSSProperties } from 'react';

export interface OverlayEffect {
  id: string;
  label: string;
  /** CSS for the overlay element (applied via style) */
  style: CSSProperties;
  /** Optional second layer for complex effects */
  style2?: CSSProperties;
  /** Extra className for the overlay div */
  className?: string;
}

// --- SVG patterns as data URIs ---

const STAMP_PATTERN = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.12'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

const DIAMOND_PATTERN = `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%239C92AC' fill-opacity='0.08'%3E%3Cpath d='M20 0L40 20 20 40 0 20z' fill-rule='evenodd'/%3E%3C/g%3E%3C/svg%3E")`;

const WAVE_PATTERN = `url("data:image/svg+xml,%3Csvg width='100' height='20' viewBox='0 0 100 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M21.184 20c.357-.13.72-.264 1.088-.402l1.768-.661C33.64 15.347 39.647 14 50 14c10.271 0 15.362 1.222 24.629 4.928.955.383 1.869.74 2.75 1.072h6.225c-2.51-.73-5.139-1.691-8.233-2.928C65.888 13.278 60.562 12 50 12c-10.626 0-16.855 1.397-26.66 5.063l-1.767.662c-2.475.923-4.66 1.674-6.724 2.275h6.335zm0-20C13.258 2.892 8.077 4 0 4V2c5.744 0 9.951-.574 14.85-2h6.334zM77.38 0C85.239 2.966 90.502 4 100 4V2c-6.842 0-11.386-.542-16.396-2h-6.225zM0 14c8.44 0 13.718-1.21 22.272-4.402l1.768-.661C33.64 5.347 39.647 4 50 4c10.271 0 15.362 1.222 24.629 4.928C84.112 12.722 89.438 14 100 14v-2c-10.271 0-15.362-1.222-24.629-4.928C65.888 3.278 60.562 2 50 2 39.374 2 33.145 3.397 23.34 7.063l-1.767.662C13.223 10.84 8.163 12 0 12v2z' fill='%239C92AC' fill-opacity='0.06' fill-rule='evenodd'/%3E%3C/svg%3E")`;

export const OVERLAY_EFFECTS: OverlayEffect[] = [
  {
    id: 'none',
    label: '无',
    style: {},
  },
  {
    id: 'holographic',
    label: '闪卡',
    style: {
      background: 'linear-gradient(135deg, rgba(255,0,128,0.08) 0%, rgba(0,255,255,0.08) 25%, rgba(255,255,0,0.06) 50%, rgba(128,0,255,0.08) 75%, rgba(0,255,128,0.06) 100%)',
      mixBlendMode: 'color-dodge' as const,
    },
    style2: {
      background: 'repeating-linear-gradient(135deg, transparent 0px, transparent 2px, rgba(255,255,255,0.04) 2px, rgba(255,255,255,0.04) 4px)',
      mixBlendMode: 'overlay' as const,
    },
  },
  {
    id: 'stamp-cross',
    label: '十字印花',
    style: {
      backgroundImage: STAMP_PATTERN,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'stamp-diamond',
    label: '菱形印花',
    style: {
      backgroundImage: DIAMOND_PATTERN,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'stamp-wave',
    label: '波浪印花',
    style: {
      backgroundImage: WAVE_PATTERN,
      backgroundRepeat: 'repeat',
      mixBlendMode: 'multiply' as const,
    },
  },
  {
    id: 'foil-gold',
    label: '金箔',
    style: {
      background: 'linear-gradient(135deg, rgba(255,215,0,0.05) 0%, rgba(218,165,32,0.12) 30%, rgba(255,223,0,0.05) 50%, rgba(184,134,11,0.1) 70%, rgba(255,215,0,0.04) 100%)',
      mixBlendMode: 'overlay' as const,
    },
    style2: {
      background: 'radial-gradient(ellipse at 30% 20%, rgba(255,223,100,0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(218,165,32,0.12) 0%, transparent 50%)',
      mixBlendMode: 'screen' as const,
    },
  },
  {
    id: 'foil-silver',
    label: '银箔',
    style: {
      background: 'linear-gradient(135deg, rgba(192,192,192,0.06) 0%, rgba(220,220,220,0.14) 30%, rgba(169,169,169,0.06) 50%, rgba(211,211,211,0.12) 70%, rgba(192,192,192,0.05) 100%)',
      mixBlendMode: 'overlay' as const,
    },
    style2: {
      background: 'radial-gradient(ellipse at 25% 25%, rgba(240,240,255,0.18) 0%, transparent 50%), radial-gradient(ellipse at 75% 75%, rgba(200,200,220,0.14) 0%, transparent 50%)',
      mixBlendMode: 'screen' as const,
    },
  },
  {
    id: 'foil-rose',
    label: '玫瑰箔',
    style: {
      background: 'linear-gradient(135deg, rgba(255,110,130,0.06) 0%, rgba(255,182,193,0.12) 30%, rgba(255,105,180,0.06) 50%, rgba(219,112,147,0.1) 70%, rgba(255,20,147,0.04) 100%)',
      mixBlendMode: 'overlay' as const,
    },
    style2: {
      background: 'radial-gradient(ellipse at 30% 30%, rgba(255,182,193,0.16) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(255,105,180,0.12) 0%, transparent 50%)',
      mixBlendMode: 'screen' as const,
    },
  },
];
