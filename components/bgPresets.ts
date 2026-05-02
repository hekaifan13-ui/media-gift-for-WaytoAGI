
export interface BgPreset {
  label: string;
  bg: string;          // CSS background value
  shadowColor: string; // solid color for the boxShadow hollow-frame trick
  grainOpacity: number;
  isDark: boolean;
  glowA?: string;  // top-left radial glow rgba
  glowB?: string;  // bottom-right radial glow rgba
}

// Card 1 (Modern) footer background presets — all light tones
export const FOOTER_BG_PRESETS: Record<string, BgPreset> = {
  white: {
    label: '纯白',
    bg: '#ffffff',
    shadowColor: '#ffffff',
    grainOpacity: 0,
    isDark: false,
  },
  mint: {
    label: '薄荷',
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #e0f7fa 35%, #eff6ff 65%, #fdf4ff 100%)',
    shadowColor: '#edf9f5',
    grainOpacity: 0.07,
    isDark: false,
    glowA: 'rgba(103,232,249,0.45)',
    glowB: 'rgba(196,181,253,0.32)',
  },
  sunset: {
    label: '夕阳',
    bg: 'linear-gradient(135deg, #fff7ed 0%, #fce7f3 45%, #ede9fe 100%)',
    shadowColor: '#fdf2f7',
    grainOpacity: 0.08,
    isDark: false,
    glowA: 'rgba(251,146,60,0.32)',
    glowB: 'rgba(192,132,252,0.28)',
  },
  aurora: {
    label: '极光',
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #a7f3d0 30%, #bfdbfe 70%, #ddd6fe 100%)',
    shadowColor: '#d8f5ed',
    grainOpacity: 0.08,
    isDark: false,
    glowA: 'rgba(52,211,153,0.42)',
    glowB: 'rgba(167,139,250,0.32)',
  },
  lemon: {
    label: '柠檬',
    bg: 'linear-gradient(135deg, #fefce8 0%, #ecfccb 45%, #dcfce7 100%)',
    shadowColor: '#f5fbdb',
    grainOpacity: 0.07,
    isDark: false,
    glowA: 'rgba(250,204,21,0.38)',
    glowB: 'rgba(163,230,53,0.28)',
  },
  cloud: {
    label: '云霭',
    bg: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 40%, #f1f5f9 100%)',
    shadowColor: '#f0f4f8',
    grainOpacity: 0.09,
    isDark: false,
    glowA: 'rgba(148,163,184,0.28)',
    glowB: 'rgba(100,116,139,0.18)',
  },
  rose: {
    label: '玫瑰',
    bg: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 40%, #fdf4ff 100%)',
    shadowColor: '#fdf0f5',
    grainOpacity: 0.08,
    isDark: false,
    glowA: 'rgba(251,113,133,0.32)',
    glowB: 'rgba(217,70,239,0.22)',
  },
};

// Card 3 (Livestream) full-card background presets
export const LIVESTREAM_BG_PRESETS: Record<string, BgPreset> = {
  'solid-light': {
    label: '浅色',
    bg: '#f8f9fa',
    shadowColor: '#f8f9fa',
    grainOpacity: 0,
    isDark: false,
  },
  'solid-dark': {
    label: '深色',
    bg: '#1a1a1a',
    shadowColor: '#1a1a1a',
    grainOpacity: 0,
    isDark: true,
  },
  'nebula-light': {
    label: '星云亮',
    bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 30%, #e0f2fe 65%, #f0fdf4 100%)',
    shadowColor: '#eae7fb',
    grainOpacity: 0.07,
    isDark: false,
    glowA: 'rgba(167,139,250,0.32)',
    glowB: 'rgba(125,211,252,0.28)',
  },
  'nebula-dark': {
    label: '星云暗',
    bg: 'linear-gradient(135deg, #0d0d1a 0%, #1a0a2e 30%, #0a1628 60%, #1a1035 100%)',
    shadowColor: '#0e0a1d',
    grainOpacity: 0.12,
    isDark: true,
    glowA: 'rgba(99,102,241,0.25)',
    glowB: 'rgba(56,189,248,0.16)',
  },
  'ocean': {
    label: '深海',
    bg: 'linear-gradient(135deg, #0c1a3a 0%, #0a3060 40%, #0e4a6e 70%, #0a2a4a 100%)',
    shadowColor: '#0a2040',
    grainOpacity: 0.12,
    isDark: true,
    glowA: 'rgba(14,165,233,0.22)',
    glowB: 'rgba(6,182,212,0.16)',
  },
  'rainbow-light': {
    label: '彩虹',
    bg: 'linear-gradient(135deg, #fef3f2 0%, #fff4e6 15%, #fefce8 30%, #ecfdf5 45%, #eff6ff 60%, #eef2ff 75%, #faf5ff 90%, #fdf2f8 100%)',
    shadowColor: '#f5f5f5',
    grainOpacity: 0.06,
    isDark: false,
    glowA: 'rgba(251,146,60,0.18)',
    glowB: 'rgba(167,139,250,0.18)',
  },
  'aurora-pink': {
    label: '极光粉',
    bg: 'linear-gradient(135deg, #fdf4ff 0%, #fce7f3 25%, #ffe4e6 55%, #fff7ed 100%)',
    shadowColor: '#fdf0f6',
    grainOpacity: 0.08,
    isDark: false,
    glowA: 'rgba(217,70,239,0.22)',
    glowB: 'rgba(251,113,133,0.2)',
  },
  'dusk': {
    label: '暮色',
    bg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 35%, #4c1d95 70%, #1e1b4b 100%)',
    shadowColor: '#1a1740',
    grainOpacity: 0.12,
    isDark: true,
    glowA: 'rgba(139,92,246,0.28)',
    glowB: 'rgba(167,139,250,0.18)',
  },
};
