# 新增「课堂海报」模版（Classroom / Course 模版）

严格按草稿图 `dee52a70…jpg` 实现，作为第 4 个模版加入。中央大留白区做成**透明画框**（与名片3一致，导出 PNG 中央透明，可叠加录屏画面）。所有文字区块预留可编辑预填。

## 草稿结构拆解（16:9，1440×810 坐标系）
1. **顶部标题栏**：左侧大号粗体标题（白色带阴影，可编辑），右侧品牌 logo 区（沿用现有 `logos` 拖拽/缩放机制）
2. **橙色导航章节标签行**：多个章节标签用竖线「｜」分隔，**用户可增删改**每个章节
3. **中央透明画框**：白色圆角边框，内部透明挖洞（复用名片3的 CSS mask + 导出抠洞逻辑）
4. **右侧竖排嘉宾条**：橙色圆角竖条，竖向排列圆形头像 + 名字（复用现有 `authors` 数据与上传/粘贴/拖拽换图逻辑）
5. **右下二维码块**：圆角卡片，二维码（复用 `qrCode1`）+ 主标题「扫码进群」+ 副说明文字

## 数据模型改动（types.ts）
- `TemplateId` 新增 `CLASSROOM = 'CLASSROOM'`
- `PostcardData` 新增字段：
  - `classTitle?: string` — 顶部主标题
  - `classTitleFontSize?: number` — 主标题字号
  - `classSections?: string[]` — 导航章节文字数组（可增删改）
  - `qrSubText?: string` — 二维码副说明（如「20份Pro月卡会员等你抽」）
  - （二维码主标题复用 `qr1Text`，如「扫码进群」）

## 主题配色（bgPresets.ts）
- 新增 `CLASSROOM_BG_PRESETS`，首个预设按草稿的橙棕色系（accent 橙棕、模糊课堂照片背景占位/纯色底）
- 你后续可再调配色，预设结构与 `LIVESTREAM_BG_PRESETS` 一致，方便扩展

## 组件实现（components/CardTemplates.tsx）
- 新增 `ClassroomTemplate = forwardRef<...>`，复制名片3的：
  - `rootRef/frameRef` + `useLayoutEffect` 测量 + CSS mask 透明挖洞
  - `LogoImage` 复用（顶部品牌 logo）
  - authors 头像上传/粘贴/拖拽换图逻辑（改为竖排布局）
- 章节标签行：`classSections.map` 渲染，标签间插入「｜」分隔符
- `getTemplateComponent` switch 增加 `CLASSROOM` 分支

## 接入点
- **constants.ts**：`TEMPLATES` 数组新增课堂模版项；`INITIAL_PROJECT_DATA` 新增 `CLASSROOM` 默认数据（预填示例章节、标题、二维码文字）
- **storageService.ts**：`migrateProjectData` 的完整性检查加入 `CLASSROOM` key
- **App.tsx**：无需大改（数据结构自动覆盖），确认默认模版逻辑正常
- **IntroBox.tsx**：`getIconForTemplate` 新增课堂模版图标（如 `GraduationCap`）
- **Editor.tsx**：
  - 新增 `CLASSROOM` 专属控制面板 section：主标题输入 + 字号滑块、章节列表编辑（增删改每一项）、二维码主/副文字、背景预设选择
  - 复用现有 logos / authors / QR 上传面板（条件放开 `CLASSROOM`）
  - 导出：`handleDownload` 的透明挖洞逻辑对 `CLASSROOM` 同样生效（复用 `data-export-hole` 查询，已通用）

## 导出透明画框
- 画框元素加 `data-export-hole="true"`，导出 PNG 时复用现有 canvas 抠洞逻辑，中央透明
- 与名片3行为完全一致

## 验证
- 新建项目 → 选课堂模版 → 编辑标题/章节/嘉宾/二维码 → 预览与草稿一致
- 下载 PNG → 中央画框区透明
- 保存/读取项目数据正常（含迁移兼容）

## 注意
- 严格按草稿排版比例还原（标题栏、橙色标签行、右侧竖条、右下二维码位置）
- 不引入草稿以外的多余功能
