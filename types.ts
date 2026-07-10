
export enum AppState {
  PROJECTS = 'PROJECTS',
  INTRO = 'INTRO',
  SELECTION = 'SELECTION',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW',
  GUEST_LIBRARY = 'GUEST_LIBRARY',
  LOGO_LIBRARY = 'LOGO_LIBRARY'
}

export enum TemplateId {
  MODERN = 'MODERN',   // Full bleed, bold text
  CODE = 'CODE',            // VS Code style
  LIVESTREAM = 'LIVESTREAM' // Live stream announcement
}

export interface Author {
  id: string;
  name: string;
  title: string;
  image: string | null;
}

export interface PostcardData {
  templateId: TemplateId;
  image: string | null; // URL or base64
  recipient: string;
  message: string;
  sender: string;
  location: string;
  date?: string;
  // Specific fields for Modern Template (10:16)
  modernLayout?: 'standard' | 'portrait-full'; // standard = 10:16 with footer, portrait-full = 3:4 no footer
  qrCode1?: string | null;
  qrCode2?: string | null;
  qr1Text?: string;
  qr2Text?: string;
  footerText?: string;
  footerFontSize?: number;
  authors?: Author[];
  authorsLayout?: { x: number; y: number; scale: number };
  authorsTextColor?: string;
  logos?: string[];
  logosLayout?: { x: number; y: number; scale: number };
  logoScales?: number[];   // per-logo individual scale multiplier
  logoGap?: number;        // gap between logos in px
  logoSeparatorColor?: string;
  logoStyle?: 'white-text' | 'black-text';
  liveTopic?: string;
  liveTopicSpacing?: number;
  liveTopicFontSize?: number;
  theme?: 'light' | 'dark';
  bgStyle?: string;        // Livestream full-card background preset key
  footerBgStyle?: string;  // Modern footer background preset key
  overlayEffect?: string;  // Overlay effect id (holographic, stamp, foil, etc.)
  emojiPattern?: string;   // Custom emoji for the emoji overlay pattern
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  previewColor: string;
}

// One project stores data for ALL three templates
export type ProjectAllData = Record<TemplateId, PostcardData>;

