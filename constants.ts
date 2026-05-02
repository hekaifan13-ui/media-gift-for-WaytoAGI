
import { TemplateId, TemplateConfig, PostcardData } from './types';

export const TEMPLATES: TemplateConfig[] = [
  {
    id: TemplateId.MODERN,
    name: "Modern 10:16",
    description: "Portrait frame with dual QR codes.",
    previewColor: "#1a1a1a"
  },
  {
    id: TemplateId.CODE,
    name: "Dev Mode",
    description: "VS Code style editor with macOS window.",
    previewColor: "#1e1e1e"
  },
  {
    id: TemplateId.LIVESTREAM,
    name: "Live Stream",
    description: "16:9 announcement with topic and guests.",
    previewColor: "#8b5cf6"
  }
];

export const INITIAL_DATA: PostcardData = {
  templateId: TemplateId.LIVESTREAM,
  modernLayout: 'standard',
  image: null,
  recipient: "",
  message: "",
  sender: "",
  location: "",
  date: new Date().toLocaleDateString(),
  qrCode1: null,
  qrCode2: null,
  qr1Text: "扫码加入群聊",
  qr2Text: "扫码预约直播",
  footerText: "Scan to discover more",
  footerFontSize: 36,
  authors: [],
  authorsLayout: { x: 0, y: 0, scale: 1 },
  authorsTextColor: "#ffffff",
  logos: ["/svg/灰底黑色2.svg"],
  logoSeparatorColor: "#ffffff",
  logoStyle: "black-text",
  liveTopic: ""
};
