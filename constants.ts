
import { TemplateId, TemplateConfig, PostcardData, ProjectAllData } from './types';

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

const SHARED_DEFAULTS: Partial<PostcardData> = {
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
  logos: ["https://grazia-prod.oss-ap-southeast-1.aliyuncs.com/resources/uid_100037804/1ca2ce55-b7b3-4d.png"],
  logoSeparatorColor: "#ffffff",
  logoStyle: "black-text",
};

export const INITIAL_PROJECT_DATA: ProjectAllData = {
  [TemplateId.MODERN]: {
    ...SHARED_DEFAULTS,
    templateId: TemplateId.MODERN,
    modernLayout: 'standard',
    footerBgStyle: "mint",
  } as PostcardData,
  [TemplateId.CODE]: {
    ...SHARED_DEFAULTS,
    templateId: TemplateId.CODE,
  } as PostcardData,
  [TemplateId.LIVESTREAM]: {
    ...SHARED_DEFAULTS,
    templateId: TemplateId.LIVESTREAM,
    liveTopic: "",
    bgStyle: "nebula-light",
  } as PostcardData,
};

// Keep for backward compatibility
export const INITIAL_DATA: PostcardData = INITIAL_PROJECT_DATA[TemplateId.LIVESTREAM];

