
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
  },
  {
    id: TemplateId.CLASSROOM,
    name: "Classroom",
    description: "16:9 course poster with sections and guests.",
    previewColor: "#c8794a"
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
   logos: ["https://spb-t4n97b8c5i729t7x.supabase.opentrust.net/storage/v1/object/public/uploads/logos/trimmed_1783610955125_f929zd.png"],
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
  [TemplateId.CLASSROOM]: {
    ...SHARED_DEFAULTS,
    templateId: TemplateId.CLASSROOM,
    classTitle: "成长引路人的百变课堂：丫丫x搭子PPT实战",
    classTitleFontSize: 44,
    classSections: ["开场介绍", "幼教：球星故事PPT", "职教：择业规划", "家教：感恩卡片", "义教：教学课件", "答疑收尾"],
    qr1Text: "扫码进群",
    qrSubText: "20份Pro月卡会员等你抽",
    classBgStyle: "campus",
  } as PostcardData,
};

// Keep for backward compatibility
export const INITIAL_DATA: PostcardData = INITIAL_PROJECT_DATA[TemplateId.LIVESTREAM];

