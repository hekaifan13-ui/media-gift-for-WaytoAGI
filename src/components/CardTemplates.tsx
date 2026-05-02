// @ts-nocheck

import React, { forwardRef, useState } from 'react';
import { PostcardData, TemplateId } from '../types';
import { MapPin, Stamp, Globe, Heart, Feather, Film, Leaf, Zap, Minus, FileCode, GitBranch, Search, Settings, MoreHorizontal, X, Code, ChevronRight, ChevronDown, Layout, QrCode, User, Move, Image as ImageIcon } from '../lib/icons';

interface TemplateProps {
  data: PostcardData;
  scale?: number;
  onUpdateData?: (key: keyof PostcardData, value: any) => void;
  isExporting?: boolean;
}

// 2. Modern (Updated to support 10:16 Vertical OR 3:4 Portrait Full)
const ModernTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ data, scale = 1, onUpdateData, isExporting = false }, ref) => {
  const isFullPortrait = data.modernLayout === 'portrait-full';

  // --- Authors Drag & Scale Logic ---
  const [isDraggingAuthors, setIsDraggingAuthors] = useState(false);
  
  const handleAuthorsMouseDown = (e: React.MouseEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingAuthors(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialLayout = data.authorsLayout || { x: 0, y: 0, scale: 1 };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale; // Adjust delta by preview scale
      const dy = (moveEvent.clientY - startY) / scale;
      
      onUpdateData('authorsLayout', {
        ...initialLayout,
        x: initialLayout.x + dx,
        y: initialLayout.y + dy
      });
    };

    const onMouseUp = () => {
      setIsDraggingAuthors(false);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleAuthorsWheel = (e: React.WheelEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    // Prevent page scroll if possible, though passive listeners make this hard in React
    
    const layout = data.authorsLayout || { x: 0, y: 0, scale: 1 };
    // Determine direction
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.min(Math.max(layout.scale + delta, 0.2), 3.0); // Limit scale

    onUpdateData('authorsLayout', {
      ...layout,
      scale: newScale
    });
  };

  // Dimensions
  // Standard (10:16): w-[720px] h-[1152px]
  // Portrait (3:4): w-[864px] h-[1152px]
  
  return (
    <div 
      ref={ref} 
      className={`${isFullPortrait ? 'w-[864px] h-[1180px]' : 'w-[720px] h-[1180px]'} bg-white shadow-xl overflow-hidden relative flex flex-col font-sans transition-all duration-300`} 
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
       {/* TOP SECTION: Cover Image */}
       <div className={`w-full ${isFullPortrait ? 'h-full' : 'h-[940px]'} bg-gray-100 relative shrink-0 group overflow-hidden`}>
          {data.image ? (
            <img src={data.image} alt="Cover" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
               <div className={`border-2 border-dashed border-gray-300 rounded mb-2 w-20 h-28`}></div>
               <span className="text-xs font-bold uppercase tracking-widest">Cover Photo</span>
             </div>
          )}
          
          {/* Subtle Gradient Overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 pointer-events-none"></div>

          {/* LOGOS SECTION */}
          {data.logos && data.logos.length > 0 && (
            <div className="absolute top-6 right-8 z-30 flex items-center gap-4">
               {data.logos.map((logo, index) => (
                 <React.Fragment key={index}>
                    <img src={logo} alt="Logo" className="h-20 w-auto object-contain" />
                    {index < (data.logos?.length || 0) - 1 && (
                       <span 
                        className="text-2xl font-light opacity-80" 
                        style={{ color: data.logoSeparatorColor || '#ffffff' }}
                       >
                        丨
                       </span>
                    )}
                 </React.Fragment>
               ))}
            </div>
          )}

          {/* AUTHORS / TEAM SECTION */}
          {data.authors && data.authors.length > 0 && (
            <div 
              className={`absolute z-40 origin-bottom-left ${isExporting ? '' : 'cursor-move group/authors'}`}
              style={{
                 left: '24px',
                 bottom: '24px',
                 transform: `translate(${data.authorsLayout?.x || 0}px, ${data.authorsLayout?.y || 0}px) scale(${data.authorsLayout?.scale || 1})`
              }}
              onMouseDown={handleAuthorsMouseDown}
              onWheel={handleAuthorsWheel}
            >
               {!isExporting && (
                  <div className="absolute -inset-2 border border-dashed border-white/50 rounded-lg opacity-0 group-hover/authors:opacity-100 transition-opacity pointer-events-none flex items-start justify-end pr-1 pt-1">
                     <div className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md scale-[0.8] origin-top-right whitespace-nowrap">
                        Drag to move • Scroll to scale
                     </div>
                  </div>
               )}

               <div className="flex flex-col gap-4 items-start justify-start">
                  {data.authors.map((author) => (
                    <div key={author.id} className="flex items-center gap-4 backdrop-blur-md bg-black/50 rounded-full pr-5 pl-2 py-2 border border-white/20 select-none">
                        <div 
                          className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white/40 overflow-hidden shadow-md shrink-0 cursor-pointer hover:border-white transition-all duration-200"
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            const file = e.dataTransfer.files?.[0];
                            if (file && file.type.startsWith('image/') && onUpdateData) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const result = reader.result as string;
                                const updatedAuthors = [...(data.authors || [])];
                                const authorIndex = updatedAuthors.findIndex(a => a.id === author.id);
                                if (authorIndex !== -1) {
                                  updatedAuthors[authorIndex] = { ...updatedAuthors[authorIndex], image: result };
                                  onUpdateData('authors', updatedAuthors);
                                }
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          onPaste={(e) => {
                            const items = e.clipboardData.items;
                            for (let i = 0; i < items.length; i++) {
                              if (items[i].type.indexOf('image') !== -1) {
                                const file = items[i].getAsFile();
                                if (file && onUpdateData) {
                                  e.preventDefault();
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    const result = reader.result as string;
                                    const updatedAuthors = [...(data.authors || [])];
                                    const authorIndex = updatedAuthors.findIndex(a => a.id === author.id);
                                    if (authorIndex !== -1) {
                                      updatedAuthors[authorIndex] = { ...updatedAuthors[authorIndex], image: result };
                                      onUpdateData('authors', updatedAuthors);
                                    }
                                  };
                                  reader.readAsDataURL(file);
                                }
                                break;
                              }
                            }
                          }}
                        >
                          {author.image ? (
                            <img src={author.image} alt={author.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center pointer-events-none text-left">
                          <span 
                             className="font-black text-sm tracking-wide drop-shadow-md whitespace-nowrap"
                             style={{ color: data.authorsTextColor || '#ffffff' }}
                          >
                             {author.name || "Name"}
                          </span>
                          <span 
                             className="text-[10px] tracking-wider mt-0.5 drop-shadow-sm whitespace-pre-wrap leading-tight font-medium"
                             style={{ color: data.authorsTextColor || '#ffffff', opacity: 0.9, wordBreak: 'keep-all' }}
                          >
                             {author.title || "Title"}
                          </span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       {/* BOTTOM SECTION: Footer */}
       {!isFullPortrait && (
         <div className="flex-1 bg-white px-12 py-6 flex items-center justify-between border-t border-gray-100 relative z-10">
            
            {/* Left: Text Description */}
            <div className="flex-1 pr-10 flex flex-col justify-center items-start h-full min-w-0">
               <p className="text-[25px] font-light text-gray-500 mb-3 flex items-center gap-5">
                  <span className="w-5 h-5 bg-cyan-500 rounded-full"></span>
                  {data.date || "TODAY"}
               </p>
               <h3 
                 className="font-serif font-black text-gray-800 italic leading-tight mb-5 whitespace-pre-wrap text-left"
                 style={{ fontSize: `${data.footerFontSize || 48}px` }}
               >
                 {data.footerText || "Scan to view memories"}
               </h3>
               <div className="flex items-center gap-4 text-[25px] text-gray-400 truncate w-full">
                  <Feather size={25} /> 
                  <span className="truncate font-light text-gray-500">{data.sender || "Sender"}</span>
               </div>
            </div>

            {/* Right: QR Codes */}
            <div className="flex items-center gap-8 h-full shrink-0">
               {/* QR Code 1 */}
               <div className="flex flex-col items-center gap-4 justify-center h-full">
                  <div className="w-[156px] h-[156px] bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center justify-center relative overflow-hidden shadow-sm">
                     {data.qrCode1 ? (
                        <img src={data.qrCode1} className="w-full h-full object-contain rounded-xl" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} alt="QR1" />
                     ) : (
                        <QrCode className="text-gray-200" size={68} />
                     )}
                  </div>
                  <span className="text-[18px] font-black uppercase tracking-widest text-gray-500 text-center w-[156px] truncate">
                    {data.qr1Text || "Web"}
                  </span>
               </div>

               {/* QR Code 2 */}
               <div className="flex flex-col items-center gap-4 justify-center h-full">
                  <div className="w-[156px] h-[156px] bg-white rounded-2xl border-2 border-gray-100 p-4 flex items-center justify-center relative overflow-hidden shadow-sm">
                     {data.qrCode2 ? (
                        <img src={data.qrCode2} className="w-full h-full object-contain rounded-xl" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} alt="QR2" />
                     ) : (
                        <QrCode className="text-gray-200" size={68} />
                     )}
                  </div>
                  <span className="text-[18px] font-black uppercase tracking-widest text-gray-500 text-center w-[156px] truncate">
                    {data.qr2Text || "Info"}
                  </span>
               </div>
            </div>

         </div>
       )}
    </div>
  );
});

// 9. Code / Dev
const CodeTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ data, scale = 1 }, ref) => {
  return (
    <div ref={ref} className="w-[1080px] h-[720px] bg-[#1e1e1e] shadow-2xl relative overflow-hidden flex flex-col font-mono text-sm" style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}>
       {/* Window Bar */}
       <div className="h-12 bg-[#323233] flex items-center px-8 gap-4 border-b border-[#111] shrink-0">
          <div className="flex gap-2.5">
             <div className="w-4 h-4 rounded-full bg-[#ff5f56]"></div>
             <div className="w-4 h-4 rounded-full bg-[#ffbd2e]"></div>
             <div className="w-4 h-4 rounded-full bg-[#27c93f]"></div>
          </div>
          <div className="ml-8 text-gray-400 text-sm flex items-center gap-8 bg-black/20 rounded-md px-4 py-1.5">
             <div className="flex items-center gap-2 text-white/90"><FileCode size={16} className="text-blue-400" /> profile.tsx</div>
             <div className="flex items-center gap-2 hover:bg-white/5 px-2 rounded"><Layout size={16} /> preview</div>
          </div>
       </div>

       <div className="flex flex-1 min-h-0">
          {/* Sidebar */}
          <div className="w-16 bg-[#252526] flex flex-col items-center py-8 gap-10 text-gray-500 border-r border-[#111] shrink-0">
             <FileCode size={28} className="text-white opacity-80" />
             <Search size={28} />
             <GitBranch size={28} />
             <Settings size={28} className="mt-auto mb-6" />
          </div>

          {/* Split Content */}
          <div className="flex-1 flex min-w-0">
             
             {/* Left: Code Editor */}
             <div className="w-[55%] p-8 text-[#d4d4d4] leading-relaxed text-sm overflow-hidden border-r border-[#111] flex flex-col bg-[#1e1e1e]">
                <div className="flex gap-5 h-full">
                    {/* Line Numbers */}
                   <div className="text-[#6e7681] select-none text-right font-mono min-w-[2.5rem]">
                      {Array.from({length: 15}).map((_, i) => <div key={i}>{i+1}</div>)}
                   </div>
                   
                   {/* Code Content */}
                   <div className="font-mono whitespace-nowrap">
                      <p><span className="text-[#c586c0]">const</span> <span className="text-[#4fc1ff]">Profile</span> = &#123;</p>
                      <p>&nbsp;&nbsp;<span className="text-[#9cdcfe]">name</span>: <span className="text-[#ce9178]">"{data.sender || "Dev"}"</span>,</p>
                      <p>&nbsp;&nbsp;<span className="text-[#9cdcfe]">role</span>: <span className="text-[#ce9178]">"Software Engineer"</span>,</p>
                      <p>&nbsp;&nbsp;<span className="text-[#9cdcfe]">bio</span>: <span className="text-[#ce9178]">"{data.message ? data.message.substring(0, 25) + '...' : 'Loading...'}"</span>,</p>
                      <p>&nbsp;&nbsp;<span className="text-[#9cdcfe]">status</span>: <span className="text-[#ce9178]">'Online'</span></p>
                      <p>&#125;;</p>
                      <p>&nbsp;</p>
                      <p><span className="text-[#569cd6]">export</span> <span className="text-[#569cd6]">default</span> <span className="text-[#dcdcaa]">Profile</span>;</p>
                   </div>
                </div>
             </div>

             {/* Right: Preview Interface */}
             <div className="w-[45%] flex flex-col bg-[#ffffff] h-full relative">
                {/* Browser Toolbar */}
                <div className="h-12 bg-[#f0f0f0] border-b border-[#e0e0e0] flex items-center px-5 gap-4 shrink-0">
                   <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                   </div>
                   <div className="flex-1 bg-white h-7 rounded-md border border-[#e0e0e0] flex items-center px-4">
                      <span className="text-xs text-gray-400">localhost:3000/profile</span>
                   </div>
                </div>

                {/* Simulated Webpage Content */}
                <div className="flex-1 overflow-hidden relative flex flex-col">
                   {/* Hero Image - 4:3 Aspect Ratio */}
                   <div className="w-full aspect-[4/3] bg-gray-100 relative group overflow-hidden shrink-0">
                      {data.image ? (
                        <img src={data.image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                           <ImageIcon size={40} />
                        </div>
                      )}
                      {/* Badge */}
                      <div className="absolute top-5 right-5 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded">
                         v2.0
                      </div>
                   </div>

                   {/* Body Text */}
                   <div className="p-8 flex-1 flex flex-col min-h-0">
                      <h1 className="text-3xl font-black text-gray-800 leading-tight mb-3 truncate">
                         {data.sender || "Name"}
                      </h1>
                      <div className="flex gap-3 mb-5">
                         <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-black rounded uppercase tracking-wider border border-blue-100">
                            Developer
                         </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-sans line-clamp-4">
                         {data.message || "A passionate developer building digital experiences. This card represents my profile."}
                      </p>
                   </div>
                </div>
             </div>

          </div>
       </div>

       {/* Status Bar */}
       <div className="h-8 bg-[#007acc] text-white flex items-center justify-between px-5 text-xs shrink-0">
          <div className="flex items-center gap-5">
             <div className="flex items-center gap-2"><GitBranch size={14} /> main*</div>
          </div>
          <div className="flex items-center gap-5">
             <div>TypeScript React</div>
          </div>
       </div>
    </div>
  );
});

// 10. Livestream Template
export const LIVE_BACKGROUNDS: Record<string, { bg: string; darkBg: string; frameBg: string; darkFrameBg: string; accent: string; label: string }> = {
  default: {
    bg: '#f8f9fa',
    darkBg: '#1a1a1a',
    frameBg: 'transparent',
    darkFrameBg: 'transparent',
    accent: '#6366f1',
    label: '默认',
  },
  starry: {
    bg: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 40%, #ddd6fe 70%, #ede9fe 100%)',
    darkBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #3b0764 70%, #1e1b4b 100%)',
    frameBg: 'rgba(99,102,241,0.08)',
    darkFrameBg: 'rgba(99,102,241,0.15)',
    accent: '#6366f1',
    label: '星空紫',
  },
  ocean: {
    bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 40%, #a5f3fc 70%, #bae6fd 100%)',
    darkBg: 'linear-gradient(135deg, #0c4a6e 0%, #155e75 40%, #164e63 70%, #1e3a5f 100%)',
    frameBg: 'rgba(6,182,212,0.08)',
    darkFrameBg: 'rgba(6,182,212,0.15)',
    accent: '#0891b2',
    label: '海洋蓝',
  },
  sunset: {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 40%, #fed7aa 70%, #fde68a 100%)',
    darkBg: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 40%, #92400e 70%, #78350f 100%)',
    frameBg: 'rgba(249,115,22,0.08)',
    darkFrameBg: 'rgba(249,115,22,0.15)',
    accent: '#ea580c',
    label: '日落橙',
  },
  forest: {
    bg: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 40%, #a7f3d0 70%, #bbf7d0 100%)',
    darkBg: 'linear-gradient(135deg, #064e3b 0%, #065f46 40%, #14532d 70%, #052e16 100%)',
    frameBg: 'rgba(16,185,129,0.08)',
    darkFrameBg: 'rgba(16,185,129,0.15)',
    accent: '#059669',
    label: '翡翠绿',
  },
};

const LivestreamTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ data, scale = 1, onUpdateData, isExporting = false }, ref) => {
  const isDark = data.theme === 'dark';
  const bgKey = data.liveBackground || 'default';
  const bgConfig = LIVE_BACKGROUNDS[bgKey] || LIVE_BACKGROUNDS.default;
  const isGradientBg = bgKey !== 'default';
  const currentBg = isDark ? bgConfig.darkBg : bgConfig.bg;
  const currentFrameBg = isDark ? bgConfig.darkFrameBg : bgConfig.frameBg;
  
  return (
    <div 
      ref={ref} 
      className={`w-[1440px] h-[810px] shadow-2xl relative overflow-hidden flex flex-col font-sans transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} 
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'top left',
        background: currentBg,
      }}
    >
      {/* Top Header Bar */}
      <div className="px-10 py-6 flex items-center justify-between z-20">
        <div className={`flex items-center gap-6 rounded-3xl px-8 py-4 shadow-sm transition-colors duration-500 ${isDark ? 'border' : ''}`}
          style={{
            backgroundColor: isDark ? `${bgConfig.accent}33` : `${bgConfig.accent}22`,
            borderColor: isDark ? `${bgConfig.accent}44` : 'transparent',
          }}
        >
          <span className="text-white text-xl font-black px-5 py-2 rounded-2xl whitespace-nowrap" style={{ backgroundColor: bgConfig.accent }}>直播主题</span>
          <h1 className={`text-4xl font-black tracking-tight truncate max-w-[1000px] transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {data.liveTopic || "直播主题内容"}
          </h1>
        </div>
        
        {/* Logo Area */}
        <div className="flex items-center gap-5">
          {data.logos && data.logos.length > 0 ? (
            <img src={data.logos[0]} alt="Logo" className="h-20 object-contain" />
          ) : (
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl shadow-sm"></div>
               <span className={`font-black italic text-3xl tracking-tighter transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-800'}`}>WaytoAGI</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex px-10 pb-10 gap-8 min-h-0 relative z-10">
        {/* Left: Main Visual Area (Hollow 16:9) */}
        <div 
          className="aspect-[16/9] h-full rounded-[32px] bg-transparent relative shrink-0 z-10"
          style={{ border: `6px solid ${bgConfig.accent}` }}
        >
          {/* The Hole Trick: Only for default bg */}
          {!isGradientBg && (
            <div 
              className="absolute inset-[-2px] -z-10 rounded-[28px] pointer-events-none"
              style={{ 
                boxShadow: `0 0 0 2000px ${isDark ? '#1a1a1a' : '#f8f9fa'}`,
              }}
            ></div>
          )}
          {/* Subtle frame fill for gradient backgrounds */}
          {isGradientBg && (
            <div 
              className="absolute inset-0 -z-10 rounded-[26px] pointer-events-none"
              style={{ backgroundColor: currentFrameBg }}
            ></div>
          )}

          <div className="absolute inset-0 flex flex-col items-center justify-center text-indigo-200/30 pointer-events-none">
             <ImageIcon size={80} className="mb-4 opacity-10" />
          </div>
          
          {/* Corner Accents */}
          <div className="absolute top-6 left-6 w-12 h-12 border-t-4 border-l-4 rounded-tl-lg" style={{ borderColor: `${bgConfig.accent}80` }}></div>
          <div className="absolute top-6 right-6 w-12 h-12 border-t-4 border-r-4 rounded-tr-lg" style={{ borderColor: `${bgConfig.accent}80` }}></div>
          <div className="absolute bottom-6 left-6 w-12 h-12 border-b-4 border-l-4 rounded-bl-lg" style={{ borderColor: `${bgConfig.accent}80` }}></div>
          <div className="absolute bottom-6 right-6 w-12 h-12 border-b-4 border-r-4 rounded-br-lg" style={{ borderColor: `${bgConfig.accent}80` }}></div>
        </div>

        {/* Right: Compressed Sidebar */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          {/* Guests Header */}
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className={`text-2xl font-black pl-4 mb-6 shrink-0 transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ borderLeft: `8px solid ${bgConfig.accent}` }}>直播嘉宾</h2>
            
            <div className="flex-1 flex flex-col justify-start gap-6">
              {data.authors && data.authors.length > 0 ? (
                <div 
                  className={`${data.authors.length >= 4 ? 'grid grid-cols-2 gap-x-8 gap-y-6' : 'flex flex-col gap-6'} items-center transition-all duration-300`}
                  style={{ 
                    transform: `translateX(${data.authors.length >= 4 ? '-50px' : '0px'}) scale(${data.authors.length > 4 ? 0.65 : data.authors.length > 2 ? 0.75 : data.authors.length > 1 ? 0.85 : 1})`,
                    transformOrigin: 'top center',
                    width: data.authors.length >= 4 ? '150%' : '100%'
                  }}
                >
                  {data.authors.map((guest) => (
                    <div key={guest.id} className="flex flex-col items-center text-center w-full">
                      <div 
                        className={`w-24 h-24 rounded-full overflow-hidden border-[4px] shadow-md mb-3 shrink-0 cursor-pointer transition-colors duration-500 ${isDark ? 'border-white/10 bg-white/5 hover:border-white/30' : 'border-gray-100 bg-gray-200 hover:border-gray-300'}`}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          const file = e.dataTransfer.files?.[0];
                          if (file && file.type.startsWith('image/') && onUpdateData) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              const result = reader.result as string;
                              const updatedAuthors = [...(data.authors || [])];
                              const authorIndex = updatedAuthors.findIndex(a => a.id === guest.id);
                              if (authorIndex !== -1) {
                                updatedAuthors[authorIndex] = { ...updatedAuthors[authorIndex], image: result };
                                onUpdateData('authors', updatedAuthors);
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        onPaste={(e) => {
                          const items = e.clipboardData.items;
                          for (let i = 0; i < items.length; i++) {
                            if (items[i].type.indexOf('image') !== -1) {
                              const file = items[i].getAsFile();
                              if (file && onUpdateData) {
                                e.preventDefault();
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const result = reader.result as string;
                                  const updatedAuthors = [...(data.authors || [])];
                                  const authorIndex = updatedAuthors.findIndex(a => a.id === guest.id);
                                  if (authorIndex !== -1) {
                                    updatedAuthors[authorIndex] = { ...updatedAuthors[authorIndex], image: result };
                                    onUpdateData('authors', updatedAuthors);
                                  }
                                };
                                reader.readAsDataURL(file);
                              }
                              break;
                            }
                          }
                        }}
                      >
                        {guest.image ? (
                          <img src={guest.image} alt={guest.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      <span className={`font-black mb-1 truncate w-full px-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: data.authors.length > 4 ? '1rem' : '1.25rem' }}>{guest.name || "嘉宾姓名"}</span>
                      <p className={`leading-tight whitespace-pre-wrap px-4 font-medium transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontSize: data.authors.length > 4 ? '0.75rem' : '0.6875rem', wordBreak: 'keep-all' }}>
                        {guest.title || "嘉宾介绍/头衔"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center opacity-10 py-10">
                   <User size={60} />
                   <span className="text-sm font-black mt-4 uppercase tracking-widest">No Guests</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Area - Shrunk */}
          <div className="mt-6 flex flex-col items-center shrink-0">
            <div className={`w-36 h-36 p-3 rounded-2xl border-2 shadow-sm relative mb-3 transition-colors duration-500 ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
              {data.qrCode1 ? (
                <img src={data.qrCode1} alt="QR" className="w-full h-full object-contain" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-100">
                  <QrCode size={66} className={isDark ? 'text-gray-600' : 'text-gray-100'} />
                </div>
              )}
            </div>
            <span className={`text-xs font-black tracking-tight uppercase text-center px-2 transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-900'}`}>
              {data.qr1Text || "扫码加入群聊"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export const getTemplateComponent = (id: TemplateId) => {
  switch (id) {
    case TemplateId.MODERN: return ModernTemplate;
    case TemplateId.CODE: return CodeTemplate;
    case TemplateId.LIVESTREAM: return LivestreamTemplate;
    default: return ModernTemplate;
  }
};
