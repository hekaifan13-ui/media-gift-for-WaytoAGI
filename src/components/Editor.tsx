// @ts-nocheck

import React, { useRef, useState, DragEvent, ClipboardEvent } from 'react';
import { PostcardData, TemplateId, Author } from '../types';
import { getTemplateComponent, LIVE_BACKGROUNDS } from './CardTemplates';
import { 
  Image as ImageIcon, Download, ArrowLeft, Wand2, RefreshCw, 
  Calendar, MapPin, User, AlignLeft, UploadCloud, QrCode, Type, Sparkles, Plus, Trash2, Edit2, Hexagon, Layout,
  Maximize2, Minimize2, MousePointer2, Move, ZoomIn, ZoomOut, RotateCcw, Save, BookUser
} from 'lucide-react';
import AIGenerator from './AIGenerator';
import ImageCropper from './ImageCropper';
import ImageGenModal from './ImageGenModal';
import GuestLibrary from './GuestLibrary';
import { createProject, updateProject } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import * as htmlToImage from 'html-to-image';

interface EditorProps {
  data: PostcardData;
  updateData: (key: keyof PostcardData, value: any) => void;
  onBack: () => void;
  projectId?: string | null;
  projectName?: string;
  onSaved?: (projectId: string, projectName: string) => void;
}

interface CroppingState {
  key: keyof PostcardData;
  index?: number; // Added to support array items (e.g. authors)
  imageSrc: string;
  aspectRatio: number;
}

const Editor: React.FC<EditorProps> = ({ data, updateData, onBack, projectId, projectName, onSaved }) => {
  const [showAI, setShowAI] = useState(false);
  const [showImageGen, setShowImageGen] = useState(false);
  const [showGuestLibrary, setShowGuestLibrary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [croppingFile, setCroppingFile] = useState<CroppingState | null>(null);
  const [isCanvasMode, setIsCanvasMode] = useState(false);
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'jpg'>('png');
  const [canvasZoom, setCanvasZoom] = useState(1);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  
  // File refs
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const qr1InputRef = useRef<HTMLInputElement>(null);
  const qr2InputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

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

  const handleCropComplete = (croppedImage: string) => {
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
         const newLogos = [...(data.logos || []), croppedImage];
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

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsExporting(true);
    try {
      await new Promise(r => setTimeout(r, 100));
      const width = cardRef.current.offsetWidth;
      const height = cardRef.current.offsetHeight;
      const options = {
        quality: 1.0,
        pixelRatio: 3,
        skipAutoScale: true,
        cacheBust: true,
        width: width,
        height: height,
        backgroundColor: 'transparent',
        style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' }
      };
      
      const dataUrl = downloadFormat === 'png' 
        ? await htmlToImage.toPng(cardRef.current, options)
        : await htmlToImage.toJpeg(cardRef.current, options);
      
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

  const generateThumbnail = async (): Promise<string | null> => {
    if (!cardRef.current) return null;
    try {
      return await htmlToImage.toPng(cardRef.current, {
        quality: 0.6,
        pixelRatio: 0.5,
        skipAutoScale: true,
        width: cardRef.current.offsetWidth,
        height: cardRef.current.offsetHeight,
        style: { transform: 'none', transformOrigin: 'top left', boxShadow: 'none' },
      });
    } catch {
      return null;
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const thumbnail = await generateThumbnail();
      if (projectId) {
        await updateProject(projectId, { data, thumbnail });
        onSaved?.(projectId, projectName || '');
      } else {
        const name = prompt('请输入项目名称：', `海报 ${new Date().toLocaleDateString('zh-CN')}`);
        if (!name) { setIsSaving(false); return; }
        const result = await createProject({ name, templateId: data.templateId, data, thumbnail });
        onSaved?.(result.id, name);
      }
      alert('保存成功！');
    } catch (err) {
      console.error('Save failed:', err);
      alert('保存失败，请稍后重试。');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGuestFromLibrary = (guest: Author) => {
    updateData('authors', [...(data.authors || []), guest]);
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
             <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors mr-3 group" title="Back to Collection">
               <ArrowLeft size={20} className="text-gray-400 group-hover:text-gray-800 transition-colors" />
             </button>
             <div className="flex-1">
                <h2 className="text-lg font-serif font-bold text-gray-800 tracking-wide">Customize</h2>
                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Design your memory</p>
             </div>
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
                          updateData('logos', [newStyle === 'black-text' ? '/svg/灰底黑色2.svg' : '/svg/灰底白字1.svg']);
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
             <div 
               tabIndex={0} 
               onPaste={handlePaste('logos')}
               className="flex flex-wrap gap-3 p-1 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/50"
             >
                {(!data.logos || data.logos.length === 0) ? (
                   <div className="w-full p-4 border border-dashed border-gray-200 rounded-lg text-center bg-gray-50/50">
                      <p className="text-[10px] text-gray-400 italic">No logos uploaded (Click button or Paste here)</p>
                   </div>
                ) : (
                   data.logos.map((logo, index) => (
                      <div key={index} className="relative w-16 h-16 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-2 shadow-sm group">
                         <img src={logo} alt="Logo" className="max-w-full max-h-full object-contain" />
                         <button onClick={() => removeLogo(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                            <Trash2 size={10} />
                         </button>
                      </div>
                   ))
                )}
             </div>
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

              {/* Background Selector */}
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2 h-2 rounded-full bg-violet-400"></span>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Background Style</label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(LIVE_BACKGROUNDS).map(([key, bg]) => {
                    const isSelected = (data.liveBackground || 'default') === key;
                    const previewBg = data.theme === 'dark' ? bg.darkBg : bg.bg;
                    return (
                      <button
                        key={key}
                        onClick={() => updateData('liveBackground', key)}
                        className={`flex flex-col items-center gap-1.5 group/bg`}
                      >
                        <div
                          className={`w-full aspect-[16/9] rounded-lg border-2 transition-all duration-200 ${
                            isSelected 
                              ? 'border-indigo-500 shadow-md shadow-indigo-500/20 scale-105' 
                              : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                          }`}
                          style={{ background: previewBg }}
                        >
                          <div className="w-full h-full flex items-center justify-center">
                            <div 
                              className="w-[60%] h-[60%] rounded-sm border"
                              style={{ borderColor: `${bg.accent}66` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`text-[9px] font-bold tracking-wide ${isSelected ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {bg.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dark Mode</span>
                <button 
                  onClick={() => updateData('theme', data.theme === 'dark' ? 'light' : 'dark')}
                  className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${data.theme === 'dark' ? 'bg-indigo-500' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${data.theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
                </button>
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
                         <button onClick={() => setShowGuestLibrary(true)} className="flex items-center gap-1 p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-full transition-colors text-[10px] font-bold px-2.5" title="嘉宾库"><BookUser size={14} /> 嘉宾库</button>
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
                               <button onClick={() => removeAuthor(idx)} className="text-gray-300 hover:text-red-400 transition-colors p-1"><Trash2 size={14} /></button>
                            </div>
                         ))}
                      </div>
                   )}
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
          <button onClick={handleDownload} disabled={isExporting} className="w-full bg-[#2d2d2d] hover:bg-black text-white py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait">
            {isExporting ? <RefreshCw className="animate-spin" size={18} /> : <Download size={18} />}
            {isExporting ? "Rendering Image..." : "Download Postcard"}
          </button>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all transform active:scale-[0.99] disabled:opacity-70 disabled:cursor-wait"
          >
            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
            {isSaving ? "保存中..." : (projectId ? "更新项目" : "保存项目")}
          </button>
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
                      <ActiveTemplate ref={cardRef} data={data} scale={getPreviewScale()} onUpdateData={updateData} isExporting={isExporting} />
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
                  <ActiveTemplate ref={cardRef} data={data} scale={getPreviewScale()} onUpdateData={updateData} isExporting={isExporting} />
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
      {showGuestLibrary && <GuestLibrary onClose={() => setShowGuestLibrary(false)} onAddToPost={handleAddGuestFromLibrary} />}
    </div>
  );
};

export default Editor;
