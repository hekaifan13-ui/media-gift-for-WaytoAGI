
export enum AppState {
  INTRO = 'INTRO',
  SELECTION = 'SELECTION',
  EDITOR = 'EDITOR',
  PREVIEW = 'PREVIEW'
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
  logoSeparatorColor?: string;
  logoStyle?: 'white-text' | 'black-text';
  liveTopic?: string;
  theme?: 'light' | 'dark';
}

export interface TemplateConfig {
  id: TemplateId;
  name: string;
  description: string;
  previewColor: string;
}
