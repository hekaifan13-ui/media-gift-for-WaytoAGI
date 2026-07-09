
import React, { useRef, useState, DragEvent, ClipboardEvent, useEffect } from 'react';
import { PostcardData, TemplateId, Author, ProjectAllData } from '../types';
import { getTemplateComponent } from './CardTemplates';
import { FOOTER_BG_PRESETS, LIVESTREAM_BG_PRESETS } from './bgPresets';
import { OVERLAY_EFFECTS } from './overlayEffects';
import { 
  Image as ImageIcon, Download, ArrowLeft, Wand2, RefreshCw, Save, ExternalLink,
  Calendar, MapPin, User, AlignLeft, UploadCloud, QrCode, Type, Sparkles, Plus, Trash2, Edit2, Hexagon, Layout,
  Maximize2, Minimize2, MousePointer2, Move, ZoomIn, ZoomOut, RotateCcw, Check, Users, Layers, GripVertical, ClipboardPaste, Film
} from 'lucide-react';
import AIGenerator from './AIGenerator';
import ImageCropper from './ImageCropper';
import ImageGenModal from './ImageGenModal';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { createProject, updateProject, createGuest, uploadBase64, createLogo } from '../services/storageService';
import { trimTransparentEdges } from '../utils/trimImage';
import { recordAnimatedNode } from '../utils/recordVideo';

// Need to declare global htmlToImage from the script tag
declare const htmlToImage: any;

interface EditorProps {
  data: PostcardData;
  updateData: (key: keyof PostcardData, value: any) => void;
  onBack: () => void;
  projectId: string | null;
  projectTitle: string;
  projectData: ProjectAllData;
  onProjectSaved: (id: string, title: string) => void;
  onGoToGuestLibrary: () => void;
  onGoToLogoLibrary: () => void;
}

interface CroppingState {
  key: keyof PostcardData;
  index?: number; // Added to support array items (e.g. authors)
  imageSrc: string;
  aspectRatio: number;
}

const Editor: React.FC<EditorProps> = ({ data, updateData, onBack, projectId, projectTitle, projectData, onProjectSaved, onGoToGuestLibrary, onGoToLogoLibrary }) => {
  const [showAI, setShowAI] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [croppingFile, setCroppingFile] = useState<CroppingState | null>(null);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState<number | undefined>(undefined);
  const [canvasZoom, setCanvasZoom] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(projectTitle);
  const titleManuallyEdited = useRef(projectTitle !== 'Untitled Project');
  const [savingGuest, setSavingGuest] = useState<Record<string, 'saving' | 'saved'>>({});
  const [savingLogo, setSavingLogo] = useState<Record<number, 'saving' | 'saved'>>({});

  // Auto-fill project title from description/topic if not manually set
  useEffect(() => {
    if (titleManuallyEdited.current) return;
    const desc = data.footerText?.trim() || data.liveTopic?.trim() || data.message?.trim() || '';
    if (desc) setTitleInput(desc.slice(0, 60));
  }, [data.footerText, data.liveTopic, data.message]);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // File refs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const qr1InputRef = useRef<HTMLInputElement>(null);
  const qr2InputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Logo drag-reorder state
  const [dragLogoIndex, setDragLogoIndex] = useState<number | null>(null);

  const ActiveTemplate = getTemplateComponent(data.templateId);

  // Helper to determine aspect ratio based on template and field
  const getAspectRatio = (key: keyof PostcardData): number => {
    if (key === 'qrCode1' || key === 'qrCode2' || key === 'authors') return 1;
    if (key === 'image') {
       switch(data.templateId) {
         case TemplateId.MODERN: return 3/4;
         case TemplateId.CODE: return 4/3;
         case TemplateId.LIVESTREAM: return 16/9;
         default: return 3/4;
       }
    }
    return 1;
  };

  const handleFileProcess = (file: File, key: keyof PostcardData, index?: number) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (key === 'logos') {
           const img = new Image();
           img.onload = () => {
              setCroppingFile({
                 key,
                 index,
                 imageSrc: result,
                 aspectRatio: img.naturalWidth / img.naturalHeight
              });
           };
           img.src = result;
        } else {
           setCroppingFile({
             key,
             index,
             imageSrc: result,
             aspectRatio: getAspectRatio(key)
           });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePaste = (key: keyof PostcardData, index?: number) => (e: ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          handleFileProcess(file, key, index);
        }
        break;
      }
    }
  };

  const handleCropComplete = async (croppedImage: string) => {
    if (croppingFile) {
      if (croppingFile.key === 'authors' && typeof croppingFile.index === 'number') {
         const updatedAuthors = [...(data.authors || [])];
         if (updatedAuthors[croppingFile.index]) {
            updatedAuthors[croppingFile.index] = {
               ...updatedAuthors[croppingFile.index],
               image: croppedImage
            };
            updateData('authors', updatedAuthors);
         }
      } else if (croppingFile.key === 'logos') {
         // Auto-trim transparent padding so all logos render at a consistent visual size
         const trimmed = await trimTransparentEdges(croppedImage);
         const newLogos = [...(data.logos || []), trimmed];
         updateData('logos', newLogos);
      } else {
         updateData(croppingFile.key, croppedImage);
      }
      setCroppingFile(null);
    }
  };

  const handleImageUpload = (key: keyof PostcardData, index?: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file, key, index);
    e.target.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
       handleFileProcess(file, 'logos');
    }
    e.target.value = '';
  };

  const removeLogo = (index: number) => {
     const newLogos = [...(data.logos || [])];
     newLogos.splice(index, 1);
     updateData('logos', newLogos);
     const newScales = [...(data.logoScales || [])];
     newScales.splice(index, 1);
     updateData('logoScales', newScales);
  };

  const moveLogo = (from: number, to: number) => {
     if (to < 0 || to >= (data.logos?.length || 0)) return;
     const newLogos = [...(data.logos || [])];
     const [movedLogo] = newLogos.splice(from, 1);
     newLogos.splice(to, 0, movedLogo);
     updateData('logos', newLogos);
     const scales = [...(data.logoScales || [])];
     while (scales.length < (data.logos?.length || 0)) scales.push(1);
     const [movedScale] = scales.splice(from, 1);
     scales.splice(to, 0, movedScale ?? 1);
     updateData('logoScales', scales);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (key: keyof PostcardData) => (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file, key);
  };

  const addAuthor = () => {
    const newAuthor: Author = {
      id: Date.now().toString(),
      name: '',
      title: '',
      image: null
    };
    updateData('authors', [...(data.authors || []), newAuthor]);
  };

  const removeAuthor = (index: number) => {
    const newAuthors = [...(data.authors || [])];
    newAuthors.splice(index, 1);
    updateData('authors', newAuthors);
  };

  const updateAuthorField = (index: number, field: keyof Author, value: string) => {
     const newAuthors = [...(data.authors || [])];
     if (newAuthors[index]) {
        newAuthors[index] = { ...newAuthors[index], [field]: value };
        updateData('authors', newAuthors);
     }
  };

  const saveAuthorToLibrary = async (author: Author) => {
    if (!author.name.trim()) return;
    setSavingGuest(prev => ({ ...prev, [author.id]: 'saving' }));
    try {
      let avatarUrl: string | undefined;
      if (author.image) {
        if (author.image.startsWith('data:')) {
          avatarUrl = await uploadBase64(author.image, 'avatars');
        } else {
          avatarUrl = author.image;
        }
      }
      await createGuest(author.name, author.title || '', avatarUrl);
      setSavingGuest(prev => ({ ...prev, [author.id]: 'saved' }));
      setTimeout(() => setSavingGuest(prev => { const n = { ...prev }; delete n[author.id]; return n; }), 2000);
    } catch (err) {
      console.error('Failed to save guest:', err);
      setSavingGuest(prev => { const n = { ...prev }; delete n[author.id]; return n; });
    }
  };

  const saveLogoToLibrary = async (logo: string, index: number) => {
    setSavingLogo(prev => ({ ...prev, [index]: 'saving' }));
    try {
      const url = logo.startsWith('data:') ? await uploadBase64(logo, 'logos') : logo;
      await createLogo(`Logo ${Date.now()}`, url);
      setSavingLogo(prev => ({ ...prev, [index]: 'saved' }));
      setTimeout(() => setSavingLogo(prev => { const n = { ...prev }; delete n[index]; return n; }), 2000);
    } catch (err) {
      console.error('Failed to save logo:', err);
      setSavingLogo(prev => { const n = { ...prev }; delete n[index]; return n; });
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;
      const isJpg = downloadFormat === 'jpg';
      const options = {
        quality: isJpg ? 0.85 : 1.0,
        pixelRatio: isJpg ? 2 : 3,
        skipAutoScale: true,
        cacheBust: true,
        width: width,
        height: height,
        backgroundColor: isJpg ? '#ffffff' : 'transparent',
        style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' }
      };

      let dataUrl: string;
      if (isJpg) {
        dataUrl = await htmlToImage.toJpeg(cardRef.current, options);
      } else {
        // Render to a canvas so we can guarantee a real transparent hole for the
        // visual frame (CSS mask is unreliable in html-to-image export).
        const canvas: HTMLCanvasElement = await htmlToImage.toCanvas(cardRef.current, options);
        const hole = cardRef.current.querySelector<HTMLElement>('[data-export-hole="true"]');
        // Derive the real bitmap ratio from the produced canvas instead of trusting pixelRatio.
        const pr = cardRef.current.offsetWidth ? (canvas.width / cardRef.current.offsetWidth) : options.pixelRatio;
        console.log('[export] canvas', canvas.width, canvas.height, 'pr', pr, 'hole?', !!hole);
        if (hole) {
          const cardRect = cardRef.current.getBoundingClientRect();
          const holeRect = hole.getBoundingClientRect();
          const scaleX = cardRef.current.offsetWidth ? (cardRect.width / cardRef.current.offsetWidth) : 1;
          const scaleY = cardRef.current.offsetHeight ? (cardRect.height / cardRef.current.offsetHeight) : 1;
          const x = ((holeRect.left - cardRect.left) / scaleX) * pr;
          const y = ((holeRect.top - cardRect.top) / scaleY) * pr;
          const w = (holeRect.width / scaleX) * pr;
          const h = (holeRect.height / scaleY) * pr;
          const r = 32 * pr; // matches rounded-[32px]
          console.log('[export] hole rect', `x=${x} y=${y} w=${w} h=${h} sx=${scaleX} sy=${scaleY} cw=${canvas.width} ch=${canvas.height}`);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.save();
            ctx.globalCompositeOperation = 'destination-out';
            ctx.beginPath();
            const rr = Math.min(r, w / 2, h / 2);
            ctx.moveTo(x + rr, y);
            ctx.arcTo(x + w, y, x + w, y + h, rr);
            ctx.arcTo(x + w, y + h, x, y + h, rr);
            ctx.arcTo(x, y + h, x, y, rr);
            ctx.arcTo(x, y, x + w, y, rr);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          }
        }
        dataUrl = canvas.toDataURL('image/png');
      }
      
      const link = document.createElement('a');
      link.download = `postcard-${data.templateId}-${Date.now()}.${downloadFormat}`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Export failed', err);
      alert('Failed to export image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadVideo = async () => {
    if (!cardRef.current) return;
    setIsRecording(true);
    setRecordProgress(0);
    // Switch card into export mode (hide editing hints) and deterministic phase
    setIsExporting(true);
    setExportPhase(0);
    try {
      await new Promise((r) => setTimeout(r, 150));
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;

      const { blob, ext } = await recordAnimatedNode({
        node: cardRef.current,
        width,
        height,
        fps: 30,
        cycleSeconds: 2.4,
        cycles: 2,
        setPhase: (p) =>
          new Promise<void>((resolve) => {
            setExportPhase(p);
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
        onProgress: (r) => setRecordProgress(r),
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `postcard-${data.templateId}-${Date.now()}.${ext}`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('Video export failed', err);
      alert('Failed to export video. Please try again.');
    } finally {
      setExportPhase(undefined);
      setIsExporting(false);
      setIsRecording(false);
      setRecordProgress(0);
    }
  };

  const generateThumbnail = async (): Promise<string | undefined> => {
    if (!cardRef.current) return undefined;
    try {
      const dataUrl = await htmlToImage.toJpeg(cardRef.current, {
        quality: 0.6,
        pixelRatio: 0.5,
        cacheBust: true,
        backgroundColor: '#ffffff',
        style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' },
      });
      return await uploadBase64(dataUrl, 'thumbnails');
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
      return undefined;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const thumbnail = await generateThumbnail();
      if (projectId) {
        await updateProject(projectId, { title: titleInput, data: projectData, ...(thumbnail ? { thumbnail } : {}) });
        onProjectSaved(projectId, titleInput);
      } else {
        const project = await createProject(titleInput, projectData);
        if (thumbnail) await updateProject(project.id, { thumbnail });
        onProjectSaved(project.id, titleInput);
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      alert('Failed to save project.');
    } finally {
      setIsSaving(false);
    }
  };

  const getPreviewScale = () => {
     if (isCanvasMode) return data.templateId === TemplateId.CODE ? 0.875 : 1;
     if (data.templateId === TemplateId.MODERN) return 0.48;
     if (data.templateId === TemplateId.LIVESTREAM) return 0.48;
     if (data.templateId === TemplateId.CODE) return 0.525; // 0.6 * 0.875
     return 0.6;
  };

  const getPreviewTransformClasses = () => {
    if (data.templateId === TemplateId.MODERN) return 'translate-y-[300px] translate-x-[130px]';
    if (data.templateId === TemplateId.CODE) return 'translate-y-[300px] translate-x-[300px]';
    if (data.templateId === TemplateId.LIVESTREAM) return 'translate-y-[300px] translate-x-[300px]';
    return 'translate-y-[300px] translate-x-[100px]';
  };

  const toggleCanvasMode = () => {
    setIsCanvasMode(!isCanvasMode);
  };

  return (
    <div className={`w-full h-screen flex flex-col md:flex-row bg-[#f3e5d8] overflow-hidden font-sans transition-colors duration-500 ${isCanvasMode ? 'bg-[#1a1a1a]' : 'bg-[#f3e5d8]'}`}>
      {/* Sidebar / Control Panel */}
      <AnimatePresence mode="wait">
        <motion.div 
          ref={sidebarRef}
          layout
          drag={isCanvasMode}
          dragMomentum={false}
          initial={false}
          className={`
            ${isCanvasMode 
              ? 'fixed top-6 left-6 w-[360px] h-[calc(100vh-48px)] rounded-2xl shadow-2xl z-50 border border-white/10 bg-white/90 backdrop-blur-xl' 
              : 'w-full md:w-[360px] lg:w-[380px] h-full bg-white z-20 shadow-[4px_0_24px_rgba(0,0,0,0.05)]'
            }
            flex flex-col relative overflow-hidden
          `}
        >
          {/* Header */}
          <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white/80 backdrop-blur-sm shrink-0">
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-3 group" title="Back to Projects">
               <ArrowLeft size={20} className="text-gray-400 group-hover:text-gray-800 transition-colors" />
             </button>
             <div className="flex-1 min-w-0">
                {editingTitle ? (
                  <input
                    autoFocus
                    value={titleInput}
                    onChange={(e) => { titleManuallyEdited.current = true; setTitleInput(e.target.value); }}
                    onBlur={() => setEditingTitle(false)}
                    onKeyDown={(e) => { if (e.key === 'Enter') setEditingTitle(false); }}
                    className="text-sm font-bold text-gray-800 bg-gray-100 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-400 w-full"
                  />
                ) : (
                  <h2 
                    className="text-sm font-bold text-gray-800 truncate cursor-pointer hover:text-indigo-600 transition-colors" 
                    onClick={() => setEditingTitle(true)}
                    title="Click to rename"
                  >
                    {titleInput || 'Untitled'}
                  </h2>
                )}
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Design your memory</p>
             </div>
             <button 
               onClick={handleSave}
               disabled={isSaving}
               className={`p-2 rounded-lg transition-all mr-2 ${saveStatus === 'saved' ? 'bg-green-100 text-green-600' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'} disabled:opacity-50`}
               title="Save Project"
             >
               {saveStatus === 'saved' ? <Check size={18} /> : isSaving ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
             </button>
             <button 
               onClick={toggleCanvasMode} 
               className={`p-2 rounded-lg transition-all ${isCanvasMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
               title={isCanvasMode ? "Exit Free Canvas" : "Enter Free Canvas"}
             >
               {isCanvasMode ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
             </button>
          </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {data.templateId !== TemplateId.LIVESTREAM && (
            <section>
              <div className="flex justify-between items-end mb-3">
                 <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                   <ImageIcon size={14} /> Cover Photo
                 </label>
                 <div className="flex items-center gap-2">
                   <button onClick={() => setShowImageGen(true)} className="flex items-center gap-1.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full transition-all font-bold hover:shadow-sm">
                      <Sparkles size={12} /> AI Gen
                   </button>
                   {data.image && (
                     <button onClick={() => updateData('image', null)} className="text-[10px] font-bold text-red-400 hover:text-red-600 uppercase tracking-wide">Remove</button>
                   )}
                 </div>
              </div>
              
              <div 
                 tabIndex={0}
                 onDragOver={onDragOver}
                 onDragLeave={onDragLeave}
                 onDrop={onDrop('image')}
                 onPaste={handlePaste('image')}
                 onClick={() => mainImageInputRef.current?.click()}
                 className={`group relative h-48 rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden flex flex-col items-center justify-center gap-3 outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                   ${isDragging 
                      ? 'border-blue-500 bg-blue-50 scale-[0.99]' 
                      : data.image 
                        ? 'border-transparent bg-gray-100' 
                        : 'border-gray-200 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/30'
                   }`}
              >
                 {data.image ? (
                   <>
                     <img src={data.image} alt="Uploaded" className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                        <div className="bg-white px-4 py-2 rounded-full shadow-lg text-xs font-bold text-gray-800 flex items-center gap-2">
                          <RefreshCw size={12} /> Change Photo
                        </div>
                     </div>
                   </>
                 ) : (
                   <>
                     <div className={`w-14 h-14 rounded-full shadow-sm flex items-center justify-center transition-transform duration-300 ${isDragging ? 'bg-blue-100 scale-110' : 'bg-white group-hover:scale-110'}`}>
                       <UploadCloud size={24} className={isDragging ? 'text-blue-600' : 'text-blue-500'} />
                     </div>
                     <div className="text-center">
                        <span className="block text-sm font-bold text-gray-700 mb-1">Click, Drop or Paste</span>
                        <span className="block text-[10px] text-gray-400 uppercase tracking-wide">Supports JPG, PNG</span>
                     </div>
                   </>
                 )}
                 <input type="file" ref={mainImageInputRef} onChange={handleImageUpload('image')} accept="image/*" className="hidden" />
              </div>
            </section>
          )}

          <section>
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                   <Hexagon size={14} className="text-gray-400" />
                   <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Branding / Logos</label>
                </div>
                <div className="flex items-center gap-2">
                   {data.logos && data.logos.length > 0 && (
                      <button 
                        onClick={() => {
                          const newStyle = data.logoStyle === 'black-text' ? 'white-text' : 'black-text';
                          updateData('logoStyle', newStyle);
                          updateData('logos', [newStyle === 'black-text' 
                            ? 'https://spb-t4n97b8c5i729t7x.supabase.opentrust.net/storage/v1/object/public/uploads/logos/trimmed_1783610955125_f929zd.png' 
                            : 'https://spb-t4n97b8c5i729t7x.supabase.opentrust.net/storage/v1/object/public/uploads/logos/trimmed_1783610955359_qev6s8.png']);
                        }}
                        className="flex items-center gap-1.5 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded-full transition-all font-bold"
                      >
                        {data.logoStyle === 'black-text' ? '灰底黑字' : '灰底白字'}
                      </button>
                   )}
                   {data.logos && data.logos.length > 1 && (
                      <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                         <span className="text-[9px] font-bold text-gray-400 uppercase">Sep</span>
                         <input type="color" value={data.logoSeparatorColor || '#ffffff'} onChange={(e) => updateData('logoSeparatorColor', e.target.value)} className="w-4 h-4 rounded-full border-none p-0 cursor-pointer overflow-hidden bg-transparent" title="Separator Color" />
                      </div>
                   )}
                   <button onClick={() => logoInputRef.current?.click()} className="flex items-center gap-1.5 text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-full transition-all font-bold">
                      <Plus size={12} /> Add Logo
                   </button>
                   <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                </div>
             </div>
             {(!data.logos || data.logos.length === 0) ? (
                /* Unified empty state: 3 clear entries */
                <div
                  tabIndex={0}
                  onPaste={handlePaste('logos')}
                  className="grid grid-cols-3 gap-2 outline-none rounded-lg focus:ring-2 focus:ring-indigo-500/40"
                >
                   <button
                     onClick={() => logoInputRef.current?.click()}
                     className="flex flex-col items-center justify-center gap-1.5 py-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-gray-500 hover:text-indigo-600"
                   >
                     <UploadCloud size={18} />
                     <span className="text-[10px] font-bold">Upload</span>
                   </button>
                   <div className="flex flex-col items-center justify-center gap-1.5 py-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400">
                     <ClipboardPaste size={18} />
                     <span className="text-[10px] font-bold">Paste here</span>
                   </div>
                   <button
                     onClick={onGoToLogoLibrary}
                     className="flex flex-col items-center justify-center gap-1.5 py-4 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-indigo-50 hover:border-indigo-300 transition-all text-gray-500 hover:text-indigo-600"
                   >
                     <Layers size={18} />
                     <span className="text-[10px] font-bold">Library</span>
                   </button>
                </div>
             ) : (
                <div
                  tabIndex={0}
                  onPaste={handlePaste('logos')}
                  className="space-y-2 outline-none rounded-lg focus:ring-2 focus:ring-indigo-500/40"
                >
                   {/* Per-logo rows: drag handle · preview · delete */}
                   {data.logos.map((logo, index) => {
                      return (
                        <div
                          key={index}
                          draggable
                          onDragStart={() => setDragLogoIndex(index)}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={() => { if (dragLogoIndex !== null) moveLogo(dragLogoIndex, index); setDragLogoIndex(null); }}
                          className={`flex items-center gap-2 bg-white border rounded-xl p-2 shadow-sm transition-all ${dragLogoIndex === index ? 'opacity-40 border-indigo-300' : 'border-gray-200'}`}
                        >
                           <div className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0">
                              <GripVertical size={14} />
                           </div>
                           <div className="w-10 h-10 shrink-0 bg-gray-50 border border-gray-100 rounded-lg flex items-center justify-center p-1">
                              <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                           </div>
                           <div className="flex-1 min-w-0 text-[11px] text-gray-400 truncate">
                              Logo {index + 1}
                           </div>
                           <button
                             onClick={() => saveLogoToLibrary(logo, index)}
                             disabled={savingLogo[index] === 'saving'}
                             title="Save to library"
                             className={`p-1.5 rounded-lg transition-all shrink-0 disabled:opacity-40 ${savingLogo[index] === 'saved' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
                           >
                              {savingLogo[index] === 'saving' ? <RefreshCw size={13} className="animate-spin" /> : savingLogo[index] === 'saved' ? <Check size={13} /> : <Save size={13} />}
                           </button>
                           <button
                             onClick={() => removeLogo(index)}
                             title="Remove logo"
                             className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                           >
                              <Trash2 size={13} />
                           </button>
                        </div>
                      );
                   })}

                   {/* Logo gap slider */}
                   {data.logos.length > 1 && (
                     <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 mt-1">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Spacing</span>
                        <input
                          type="range"
                          min={0}
                          max={64}
                          step={2}
                          value={data.logoGap ?? 16}
                          onChange={(e) => updateData('logoGap', parseInt(e.target.value))}
                          className="flex-1 h-1.5 accent-indigo-500 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-gray-400 w-9 text-right tabular-nums shrink-0">
                          {data.logoGap ?? 16}px
                        </span>
                     </div>
                   )}
                </div>
             )}
             <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
             {/* Open Logo Library button (only when logos exist; empty state has its own) */}
             {data.logos && data.logos.length > 0 && (
               <button
                 onClick={onGoToLogoLibrary}
                 className="w-full flex items-center justify-center gap-2 mt-3 py-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-gray-600 hover:text-indigo-700 transition-all"
               >
                 <Layers size={14} />
                 Open Logo Library
                 <ExternalLink size={12} className="opacity-50" />
               </button>
             )}
          </section>

          {data.templateId === TemplateId.LIVESTREAM && (
            <section className="space-y-4 border-b border-gray-100 pb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Live Stream Topic</label>
              </div>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors"><Type size={16} /></div>
                <input 
                  type="text" 
                  value={data.liveTopic || ''} 
                  onChange={(e) => updateData('liveTopic', e.target.value)} 
                  className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-indigo-500 rounded-lg py-3 pl-10 pr-4 outline-none text-sm font-medium text-gray-700 transition-all placeholder:text-gray-300" 
                  placeholder="Enter live stream topic..." 
                />
              </div>

              {/* Letter Spacing slider */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Letter Spacing</label>
                  <span className="text-[10px] font-mono text-gray-500">{(data.liveTopicSpacing ?? 0).toFixed(2)}em</span>
                </div>
                <input
                  type="range"
                  min="-0.05"
                  max="0.5"
                  step="0.01"
                  value={data.liveTopicSpacing ?? 0}
                  onChange={(e) => updateData('liveTopicSpacing', parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-full appearance-none cursor-pointer accent-indigo-500"
                />
              </div>

              {/* Card 3 Background Picker */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Card Background</label>
                <div className="grid grid-cols-4 gap-2">
                  {Object.entries(LIVESTREAM_BG_PRESETS).map(([key, preset]) => (
                    <button
                      key={key}
                      title={preset.label}
                      onClick={() => updateData('bgStyle', key)}
                      className={`h-10 rounded-xl border-2 transition-all flex items-end justify-start p-1.5 overflow-hidden ${(data.bgStyle || 'nebula-light') === key ? 'border-indigo-500 shadow-md scale-[1.04]' : 'border-transparent hover:border-indigo-200'}`}
                      style={{ background: preset.bg }}
                    >
                      <span className={`text-[9px] font-black tracking-wide truncate leading-none ${preset.isDark ? 'text-white/80' : 'text-gray-700/80'}`}>
                        {preset.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlay Effect Picker (Card 3) */}
              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overlay Effect</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {OVERLAY_EFFECTS.map((effect) => (
                    <button
                      key={effect.id}
                      onClick={() => updateData('overlayEffect', effect.id)}
                      className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all truncate ${
                        (data.overlayEffect || 'none') === effect.id 
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-sm' 
                          : 'border-gray-200 text-gray-500 hover:border-indigo-200 hover:bg-gray-50'
                      }`}
                    >
                      {effect.label}
                    </button>
                  ))}
                </div>
                {data.overlayEffect === 'emoji-pattern' && (
                  <div className="flex items-center gap-2 pt-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Emoji</label>
                    <input
                      type="text"
                      value={data.emojiPattern || ''}
                      onChange={(e) => updateData('emojiPattern', e.target.value)}
                      placeholder="e.g. ✦"
                      className="flex-1 text-base px-2 py-1 rounded-lg border border-gray-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 outline-none text-center"
                      maxLength={4}
                    />
                  </div>
                )}
              </div>
            </section>
          )}

          {(data.templateId === TemplateId.MODERN || data.templateId === TemplateId.LIVESTREAM) && (
             <>
                <section className="space-y-4 border-b border-gray-100 pb-6 border-t pt-6">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                          {data.templateId === TemplateId.LIVESTREAM ? 'QR Code & Label' : 'Layout & Footer'}
                        </label>
                     </div>
                   </div>
                   
                   {data.templateId === TemplateId.MODERN && (
                     <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => updateData('modernLayout', 'standard')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${data.modernLayout !== 'portrait-full' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}>Standard (10:16)</button>
                        <button onClick={() => updateData('modernLayout', 'portrait-full')} className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${data.modernLayout === 'portrait-full' ? 'bg-white shadow-sm text-cyan-600' : 'text-gray-400 hover:text-gray-600'}`}>Portrait (3:4)</button>
                     </div>
                   )}

                   {/* Card 1 Footer Background Picker */}
                   {data.templateId === TemplateId.MODERN && data.modernLayout !== 'portrait-full' && (
                     <div className="space-y-2 mb-4">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Footer Background</label>
                       <div className="grid grid-cols-4 gap-2">
                         {Object.entries(FOOTER_BG_PRESETS).map(([key, preset]) => (
                           <button
                             key={key}
                             title={preset.label}
                             onClick={() => updateData('footerBgStyle', key)}
                             className={`h-10 rounded-xl border-2 transition-all flex items-end justify-start p-1.5 overflow-hidden ${(data.footerBgStyle || 'mint') === key ? 'border-cyan-500 shadow-md scale-[1.04]' : 'border-transparent hover:border-cyan-200'}`}
                             style={{ background: preset.bg }}
                           >
                             <span className={`text-[9px] font-black tracking-wide truncate leading-none ${preset.isDark ? 'text-white/80' : 'text-gray-700/80'}`}>
                               {preset.label}
                             </span>
                           </button>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Overlay Effect Picker (Card 1) */}
                   {data.templateId === TemplateId.MODERN && data.modernLayout !== 'portrait-full' && (
                     <div className="space-y-2 mb-4">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Overlay Effect</label>
                       <div className="grid grid-cols-3 gap-1.5">
                         {OVERLAY_EFFECTS.map((effect) => (
                           <button
                             key={effect.id}
                             onClick={() => updateData('overlayEffect', effect.id)}
                             className={`py-1.5 px-2 rounded-lg border text-[10px] font-bold transition-all truncate ${
                               (data.overlayEffect || 'none') === effect.id 
                                 ? 'border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm' 
                                 : 'border-gray-200 text-gray-500 hover:border-cyan-200 hover:bg-gray-50'
                             }`}
                           >
                             {effect.label}
                           </button>
                         ))}
                       </div>
                       {data.overlayEffect === 'emoji-pattern' && (
                         <div className="flex items-center gap-2 pt-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">Emoji</label>
                           <input
                             type="text"
                             value={data.emojiPattern || ''}
                             onChange={(e) => updateData('emojiPattern', e.target.value)}
                             placeholder="e.g. ✦"
                             className="flex-1 text-base px-2 py-1 rounded-lg border border-gray-200 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 outline-none text-center"
                             maxLength={4}
                           />
                         </div>
                       )}
                     </div>
                   )}
                   
                   {(data.templateId === TemplateId.LIVESTREAM || data.modernLayout !== 'portrait-full') && (
                     <>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                             <div 
                                 tabIndex={0}
                                 onClick={() => qr1InputRef.current?.click()}
                                 onPaste={handlePaste('qrCode1')}
                                 className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition-colors outline-none focus:ring-2 focus:ring-cyan-500"
                             >
                                 {data.qrCode1 ? (
                                   <>
                                     <img src={data.qrCode1} alt="QR1" className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <RefreshCw size={12} className="text-white" />
                                     </div>
                                   </>
                                 ) : (
                                   <>
                                     <QrCode size={20} className="text-gray-400" />
                                     <span className="text-[9px] font-bold text-gray-500">QR 1 (Click/Paste)</span>
                                   </>
                                 )}
                                 <input type="file" ref={qr1InputRef} onChange={handleImageUpload('qrCode1')} accept="image/*" className="hidden" />
                             </div>
                             <input type="text" value={data.qr1Text || ''} onChange={(e) => updateData('qr1Text', e.target.value)} placeholder="Label 1" className="w-full text-xs text-center border-b border-gray-200 focus:border-cyan-400 outline-none pb-1 bg-transparent placeholder:text-gray-300" maxLength={10} />
                          </div>

                          <div className="space-y-2">
                             <div 
                                 tabIndex={0}
                                 onClick={() => qr2InputRef.current?.click()}
                                 onPaste={handlePaste('qrCode2')}
                                 className="aspect-square rounded-lg border-2 border-dashed border-gray-200 hover:border-cyan-400 hover:bg-cyan-50 cursor-pointer flex flex-col items-center justify-center gap-2 relative overflow-hidden group transition-colors outline-none focus:ring-2 focus:ring-cyan-500"
                             >
                                 {data.qrCode2 ? (
                                   <>
                                     <img src={data.qrCode2} alt="QR2" className="w-full h-full object-cover" />
                                     <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                         <RefreshCw size={12} className="text-white" />
                                     </div>
                                   </>
                                 ) : (
                                   <>
                                     <QrCode size={20} className="text-gray-400" />
                                     <span className="text-[9px] font-bold text-gray-500">QR 2 (Click/Paste)</span>
                                   </>
                                 )}
                                 <input type="file" ref={qr2InputRef} onChange={handleImageUpload('qrCode2')} accept="image/*" className="hidden" />
                             </div>
                             <input type="text" value={data.qr2Text || ''} onChange={(e) => updateData('qr2Text', e.target.value)} placeholder="Label 2" className="w-full text-xs text-center border-b border-gray-200 focus:border-cyan-400 outline-none pb-1 bg-transparent placeholder:text-gray-300" maxLength={10} />
                          </div>
                       </div>
                       {data.templateId === TemplateId.MODERN && (
                         <div className="relative group mt-2">
                            <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400 group-focus-within:text-cyan-500 transition-colors">Description</label>
                             <div className="absolute left-3 top-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors"><AlignLeft size={16} /></div>
                            <textarea 
                              value={data.footerText || ''} 
                              onChange={(e) => updateData('footerText', e.target.value)} 
                              className="w-full bg-gray-50/50 border border-gray-200 hover:border-gray-300 focus:border-cyan-500 focus:bg-white rounded-xl py-4 pl-10 pr-4 outline-none text-sm font-medium text-gray-700 transition-all placeholder:text-gray-300 min-h-[100px] resize-none shadow-sm" 
                              placeholder="Enter footer description..." 
                              maxLength={150} 
                            />
                            <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm space-y-3 mt-4">
                                <div className="flex items-center justify-between">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Font Size</span>
                                   <span className="text-xs font-bold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-md">{data.footerFontSize || 36}px</span>
                                </div>
                                <div className="flex items-center gap-4">
                                   <Minimize2 size={14} className="text-gray-300" />
                                  <input 
                                    type="range" 
                                    min="12" 
                                    max="96" 
                                    value={data.footerFontSize || 36} 
                                    onChange={(e) => updateData('footerFontSize', parseInt(e.target.value))} 
                                    className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                                  />
                                  <Maximize2 size={14} className="text-gray-300" />
                                </div>
                             </div>
                         </div>
                       )}
                     </>
                   )}
                </section>

                <section className="space-y-4 border-b border-gray-100 pb-6">
                   <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                         <span className="w-2 h-2 rounded-full bg-pink-400"></span>
                         <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                           {data.templateId === TemplateId.LIVESTREAM ? 'Live Guests' : 'Team / Authors'}
                         </label>
                      </div>
                      <div className="flex items-center gap-2">
                         <div className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-full border border-gray-200">
                            <span className="text-[9px] font-bold text-gray-400 uppercase">Color</span>
                            <input type="color" value={data.authorsTextColor || '#ffffff'} onChange={(e) => updateData('authorsTextColor', e.target.value)} className="w-4 h-4 rounded-full border-none p-0 cursor-pointer overflow-hidden bg-transparent" title="Text Color" />
                         </div>
                         <button onClick={addAuthor} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-600" title="Add Member"><Plus size={16} /></button>
                      </div>
                   </div>
                   {(!data.authors || data.authors.length === 0) ? (
                      <p className="text-xs text-gray-400 italic text-center py-2">No team members added.</p>
                   ) : (
                      <div className="space-y-3">
                         {data.authors.map((author, idx) => (
                            <div key={author.id} className="flex gap-3 items-center bg-gray-50 p-2 rounded-lg border border-gray-100 group">
                               <div className="relative w-10 h-10 shrink-0">
                                  <div 
                                     tabIndex={0}
                                     className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden cursor-pointer border border-gray-300 hover:border-gray-400 transition-colors outline-none focus:ring-2 focus:ring-pink-400"
                                     onClick={() => document.getElementById(`author-img-${author.id}`)?.click()}
                                     onPaste={handlePaste('authors', idx)}
                                  >
                                     {author.image ? (
                                        <img src={author.image} className="w-full h-full object-cover" alt="Avatar" />
                                     ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400"><User size={16} /></div>
                                     )}
                                  </div>
                                  <input id={`author-img-${author.id}`} type="file" className="hidden" accept="image/*" onChange={handleImageUpload('authors', idx)} />
                               </div>
                               <div className="flex-1 space-y-1">
                                  <input type="text" value={author.name} onChange={(e) => updateAuthorField(idx, 'name', e.target.value)} placeholder="Name" className="w-full text-xs font-bold bg-transparent border-b border-transparent focus:border-gray-300 outline-none placeholder:text-gray-300" />
                                  <textarea value={author.title} onChange={(e) => updateAuthorField(idx, 'title', e.target.value)} placeholder="Title / Role" rows={2} className="w-full text-[10px] text-gray-500 bg-transparent border-b border-transparent focus:border-gray-300 outline-none placeholder:text-gray-300 tracking-wide resize-y min-h-[40px]" />
                               </div>
                               <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => saveAuthorToLibrary(author)}
                                    disabled={!author.name.trim() || savingGuest[author.id] === 'saving'}
                                    className={`p-1 rounded transition-colors ${savingGuest[author.id] === 'saved' ? 'text-green-500' : 'text-gray-300 hover:text-indigo-500'} disabled:opacity-40`}
                                    title="Save to Guest Library"
                                  >
                                    {savingGuest[author.id] === 'saving' ? <RefreshCw size={14} className="animate-spin" /> : savingGuest[author.id] === 'saved' ? <Check size={14} /> : <Save size={14} />}
                                  </button>
                                  <button onClick={() => removeAuthor(idx)} className="text-gray-300 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                               </div>
                            </div>
                         ))}
                      </div>
                   )}
                </section>

                {/* Open Guest Library button */}
                <section className="pb-6 border-b border-gray-100">
                  <button
                    onClick={onGoToGuestLibrary}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-gray-600 hover:text-indigo-700 transition-all"
                  >
                    <Users size={14} />
                    Open Guest Library
                    <ExternalLink size={12} className="opacity-50" />
                  </button>
                </section>
             </>
          )}

          <section className="space-y-5">
             <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Details</label>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                   <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400 group-focus-within:text-blue-500 transition-colors">Date</label>
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"><Calendar size={16} /></div>
                   <input type="text" value={data.date || ''} onChange={(e) => updateData('date', e.target.value)} className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 outline-none text-sm font-medium text-gray-700 transition-all placeholder:text-gray-300" placeholder="Aug 2024" />
                </div>
                <div className="relative group">
                   <label className="absolute -top-2 left-2 bg-white px-1 text-[10px] font-bold text-gray-400 group-focus-within:text-blue-500 transition-colors">From</label>
                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors"><User size={16} /></div>
                   <input type="text" value={data.sender} onChange={(e) => updateData('sender', e.target.value)} className="w-full bg-white border border-gray-200 hover:border-gray-300 focus:border-blue-500 rounded-lg py-3 pl-10 pr-4 outline-none text-sm font-medium text-gray-700 transition-all placeholder:text-gray-300" placeholder="Your Name" />
                </div>
             </div>
          </section>

          {data.templateId !== TemplateId.MODERN && (
            <section className="relative">
               <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                     <span className="w-2 h-2 rounded-full bg-purple-400"></span>
                     <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Message</label>
                  </div>
                  <button onClick={() => setShowAI(true)} className="flex items-center gap-1.5 text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 px-3 py-1.5 rounded-full transition-all font-bold hover:shadow-sm"><Wand2 size={12} /> AI Magic</button>
               </div>
               <div className="relative">
                  <textarea placeholder="Write your message here..." value={data.message} onChange={(e) => updateData('message', e.target.value)} className="w-full h-36 bg-white border border-gray-200 hover:border-gray-300 focus:border-purple-500 rounded-xl p-4 resize-none outline-none text-sm leading-relaxed text-gray-700 transition-all font-sans placeholder:text-gray-300 shadow-sm" />
                  <AlignLeft size={16} className="absolute bottom-4 right-4 text-gray-300 pointer-events-none" />
               </div>
            </section>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 bg-white shrink-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-700">Download Format</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setDownloadFormat('png')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${downloadFormat === 'png' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                PNG
              </button>
              <button 
                onClick={() => setDownloadFormat('jpg')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${downloadFormat === 'jpg' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                JPG
              </button>
            </div>
          </div>
          <button onClick={handleDownload} disabled={isExporting || isRecording} className="w-full bg-[#2d2d2d] hover:bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait">
            {isExporting && !isRecording ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting && !isRecording ? "Rendering Image..." : "Download Postcard"}
          </button>

          {data.templateId === TemplateId.LIVESTREAM && (
            <button
              onClick={handleDownloadVideo}
              disabled={isExporting || isRecording}
              className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
            >
              {isRecording ? <RefreshCw className="animate-spin" size={18} /> : <Film size={18} />}
              {isRecording ? `Recording... ${Math.round(recordProgress * 100)}%` : "Download Animated Video"}
            </button>
          )}
        </div>
      </motion.div>
      </AnimatePresence>

      <div className={`flex-1 relative flex flex-col items-center justify-center overflow-hidden transition-all duration-500 ${isCanvasMode ? 'cursor-grab active:cursor-grabbing' : ''}`}>
        {/* Canvas Background */}
        <div className="absolute inset-0 pointer-events-none transition-opacity duration-500" 
          style={{ 
            backgroundImage: isCanvasMode 
              ? 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)' 
              : 'radial-gradient(#8B4513 0.5px, transparent 0.5px)',
            backgroundSize: isCanvasMode ? '40px 40px' : '24px 24px',
            opacity: isCanvasMode ? 1 : 0.4
          }}
        ></div>

        {isCanvasMode ? (
          <TransformWrapper
            initialScale={1}
            minScale={0.1}
            maxScale={4}
            centerOnInit
            wheel={{ step: 0.1 }}
            doubleClick={{ disabled: true }}
          >
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                {/* Floating Canvas Controls */}
                <div className="absolute bottom-6 right-6 flex items-center gap-2 z-30">
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/10 p-1 rounded-xl shadow-2xl">
                    <button onClick={() => zoomOut()} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><ZoomOut size={18} /></button>
                    <button onClick={() => resetTransform()} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><RotateCcw size={18} /></button>
                    <button onClick={() => zoomIn()} className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-all"><ZoomIn size={18} /></button>
                  </div>
                </div>

                <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }}>
                  <div className="relative w-full h-full flex items-center justify-center min-w-[2000px] min-h-[2000px]">
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`relative ${getPreviewTransformClasses()}`}
                    >
                      <div className="absolute inset-0 bg-black/40 blur-[100px] translate-y-12 scale-90 -z-10 rounded-[50px]"></div>
                      <ActiveTemplate ref={cardRef} data={data} scale={getPreviewScale()} onUpdateData={updateData} isExporting={isExporting} exportAnimPhase={exportPhase} />
                    </motion.div>
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        ) : (
          <>
            <div className="relative z-10 w-full max-w-[900px] flex-1 flex items-center justify-center">
               <div className={`relative transition-transform duration-500 hover:scale-[1.01] ${getPreviewTransformClasses()}`}>
                  <div className="absolute inset-0 bg-black/20 blur-3xl translate-y-12 scale-90 -z-10 rounded-[50px]"></div>
                  <ActiveTemplate ref={cardRef} data={data} scale={getPreviewScale()} onUpdateData={updateData} isExporting={isExporting} exportAnimPhase={exportPhase} />
               </div>
            </div>
            <div className="shrink-0 mb-4">
              <span className="bg-white/60 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] text-gray-600 font-bold tracking-widest uppercase shadow-sm border border-white/40">Live Preview</span>
            </div>
          </>
        )}
      </div>

      {showAI && <AIGenerator recipient={data.sender ? "Friend" : "Friend"} location={data.location} onSelect={(text) => { updateData('message', text); setShowAI(false); }} onClose={() => setShowAI(false)} />}
      {showImageGen && <ImageGenModal initialPrompt={data.location ? `A beautiful artistic view of ${data.location}` : ""} onClose={() => setShowImageGen(false)} onSelect={(base64Image) => { updateData('image', base64Image); setShowImageGen(false); }} />}
      {croppingFile && <ImageCropper imageSrc={croppingFile.imageSrc} aspectRatio={croppingFile.aspectRatio} onCancel={() => setCroppingFile(null)} onCrop={handleCropComplete} />}
    </div>
  );
};

export default Editor;
