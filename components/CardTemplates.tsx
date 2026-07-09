
import React, { forwardRef, useState, useMemo, useEffect } from 'react';
import { PostcardData, TemplateId } from '../types';
import { Feather, FileCode, GitBranch, Search, Settings, Layout, QrCode, User, Image as ImageIcon } from 'lucide-react';
import { FOOTER_BG_PRESETS, LIVESTREAM_BG_PRESETS } from './bgPresets';
import { OVERLAY_EFFECTS } from './overlayEffects';

// Grain noise SVG data URI for granular texture overlay
const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`;

// Reusable grain overlay component
const GrainOverlay = ({ opacity = 0.08 }: { opacity?: number }) => (
  <div
    className="absolute inset-0 pointer-events-none z-[1]"
    style={{
      backgroundImage: GRAIN_SVG,
      backgroundRepeat: 'repeat',
      backgroundSize: '300px 300px',
      opacity,
      mixBlendMode: 'overlay',
    }}
  />
);

// Build an SVG data URI for an emoji tiled pattern
function buildEmojiPatternUrl(emoji: string): string {
  const encoded = encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>` +
    `<text x='10' y='28' font-size='22' opacity='0.18'>${emoji}</text>` +
    `<text x='50' y='62' font-size='22' opacity='0.18'>${emoji}</text>` +
    `</svg>`
  );
  return `url("data:image/svg+xml,${encoded}")`;
}

// Reusable effect overlay (patterns, emoji, etc.)
const EffectOverlay = ({ effectId, emoji }: { effectId?: string; emoji?: string }) => {
  if (!effectId || effectId === 'none') return null;
  const effect = OVERLAY_EFFECTS.find(e => e.id === effectId);
  if (!effect) return null;

  // Dynamic emoji pattern
  const emojiUrl = useMemo(() => {
    if (effect.isDynamicEmoji && emoji) return buildEmojiPatternUrl(emoji);
    return null;
  }, [effect.isDynamicEmoji, emoji]);

  if (effect.isDynamicEmoji) {
    if (!emoji) return null;
    return (
      <div
        className="absolute inset-0 pointer-events-none z-[2]"
        style={{
          backgroundImage: emojiUrl!,
          backgroundRepeat: 'repeat',
          backgroundSize: '80px 80px',
        }}
      />
    );
  }

  return (
    <>
      <div className="absolute inset-0 pointer-events-none z-[2]" style={effect.style} />
      {effect.style2 && <div className="absolute inset-0 pointer-events-none z-[2]" style={effect.style2} />}
      {effect.style3 && <div className="absolute inset-0 pointer-events-none z-[2]" style={effect.style3} />}
    </>
  );
};

// Convert a #rrggbb hex color to an rgba() string with the given alpha
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface TemplateProps {
  data: PostcardData;
  scale?: number;
  onUpdateData?: (key: keyof PostcardData, value: any) => void;
  isExporting?: boolean;
  /** When set (0..1), forces a deterministic animation phase — used for video frame capture */
  exportAnimPhase?: number;
}

// Individual logo image with click-to-select + wheel-to-scale (independent per logo)
const LogoImage = ({
  logo,
  index,
  data,
  isExporting,
  onUpdateData,
  selected,
  onSelect,
  isDark,
  heightClass = 'h-20',
}: {
  logo: string;
  index: number;
  data: PostcardData;
  isExporting: boolean;
  onUpdateData?: (key: keyof PostcardData, value: any) => void;
  selected: boolean;
  onSelect: (index: number) => void;
  isDark?: boolean;
  heightClass?: string;
}) => {
  const logoScale = data.logoScales?.[index] ?? 1;

  const handleWheel = (e: React.WheelEvent) => {
    if (isExporting || !onUpdateData || !selected) return;
    e.stopPropagation();
    e.preventDefault();
    const scales = [...(data.logoScales || [])];
    while (scales.length < (data.logos?.length || 0)) scales.push(1);
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    scales[index] = Math.min(Math.max((scales[index] ?? 1) + delta, 0.3), 4.0);
    onUpdateData('logoScales', scales);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isExporting) return;
    e.stopPropagation();
    onSelect(index);
  };

  return (
    <div
      className={`relative ${isExporting ? '' : 'cursor-pointer'}`}
      style={{ transform: `scale(${logoScale})`, transformOrigin: 'center' }}
      onWheel={handleWheel}
      onMouseDown={handleClick}
    >
      {!isExporting && selected && (
        <div
          className="absolute -inset-1.5 border-2 border-dashed rounded-md pointer-events-none flex items-start justify-center"
          style={{ borderColor: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(99,102,241,0.8)' }}
        >
          <span
            className={`absolute -top-5 text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap ${isDark ? 'bg-white/25 text-white' : 'bg-indigo-500 text-white'}`}
          >
            Scroll to resize
          </span>
        </div>
      )}
      <img src={logo} alt="Logo" crossOrigin="anonymous" className={`${heightClass} w-auto object-contain select-none pointer-events-none`} />
    </div>
  );
};


// 1. Modern (10:16 Vertical OR 3:4 Portrait Full)
const ModernTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ data, scale = 1, onUpdateData, isExporting = false }, ref) => {
  const isFullPortrait = data.modernLayout === 'portrait-full';
  const footerPreset = FOOTER_BG_PRESETS[data.footerBgStyle || 'mint'] ?? FOOTER_BG_PRESETS['mint'];

  // --- Authors Drag & Scale Logic ---
  const [isDraggingAuthors, setIsDraggingAuthors] = useState(false);
  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);
  
  const handleAuthorsMouseDown = (e: React.MouseEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingAuthors(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialLayout = data.authorsLayout || { x: 0, y: 0, scale: 1 };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
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
    const layout = data.authorsLayout || { x: 0, y: 0, scale: 1 };
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.min(Math.max(layout.scale + delta, 0.2), 3.0);
    onUpdateData('authorsLayout', { ...layout, scale: newScale });
  };

  // --- Logos Drag & Scale Logic ---
  const handleLogosMouseDown = (e: React.MouseEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialLayout = data.logosLayout || { x: 0, y: 0, scale: 1 };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      onUpdateData('logosLayout', { ...initialLayout, x: initialLayout.x + dx, y: initialLayout.y + dy });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleLogosWheel = (e: React.WheelEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    const layout = data.logosLayout || { x: 0, y: 0, scale: 1 };
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.min(Math.max(layout.scale + delta, 0.2), 3.0);
    onUpdateData('logosLayout', { ...layout, scale: newScale });
  };

  return (
    <div 
      ref={ref} 
      className={`${isFullPortrait ? 'w-[864px] h-[1180px]' : 'w-[720px] h-[1180px]'} bg-white shadow-xl overflow-hidden relative flex flex-col font-sans transition-all duration-300`} 
      style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
    >
       {/* TOP SECTION: Cover Image */}
       <div className={`w-full ${isFullPortrait ? 'h-full' : 'h-[940px]'} bg-gray-100 relative shrink-0 group overflow-hidden`}>
          {data.image ? (
            <img src={data.image} alt="Cover" crossOrigin="anonymous" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
          ) : (
             <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-gray-300">
               <div className="border-2 border-dashed border-gray-300 rounded mb-2 w-20 h-28"></div>
               <span className="text-xs font-bold uppercase tracking-widest">Cover Photo</span>
             </div>
          )}
          
          {/* Gradient Overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 h-60 bg-gradient-to-t from-black/30 via-black/10 to-transparent opacity-80 pointer-events-none"></div>

          {/* LOGOS SECTION - draggable/scalable */}
          {data.logos && data.logos.length > 0 && (
            <div 
              className={`absolute z-30 origin-top-right ${isExporting ? '' : 'cursor-move group/logos'}`}
              style={{
                top: '24px',
                right: '32px',
                transform: `translate(${data.logosLayout?.x || 0}px, ${data.logosLayout?.y || 0}px) scale(${data.logosLayout?.scale || 1})`
              }}
              onMouseDown={handleLogosMouseDown}
              onWheel={handleLogosWheel}
            >
              {!isExporting && (
                <div className="absolute -inset-2 border border-dashed border-white/40 rounded-lg opacity-0 group-hover/logos:opacity-100 transition-opacity pointer-events-none flex items-start justify-end pr-1 pt-1">
                  <div className="bg-black/50 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-md scale-[0.8] origin-top-right whitespace-nowrap">
                    Drag group · Click a logo to resize it
                  </div>
                </div>
              )}
              <div className="flex items-center" style={{ gap: `${data.logoGap ?? 16}px` }}>
                {data.logos.map((logo, index) => (
                  <React.Fragment key={index}>
                    <LogoImage
                      logo={logo}
                      index={index}
                      data={data}
                      isExporting={isExporting}
                      onUpdateData={onUpdateData}
                      selected={selectedLogo === index}
                      onSelect={setSelectedLogo}
                    />
                    {index < (data.logos?.length || 0) - 1 && (
                      <span className="text-2xl font-light opacity-80 select-none" style={{ color: data.logoSeparatorColor || '#ffffff' }}>丨</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
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
                            <img src={author.image} alt={author.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-500">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center pointer-events-none text-left">
                          <span className="font-black text-sm tracking-wide drop-shadow-md whitespace-nowrap" style={{ color: data.authorsTextColor || '#ffffff' }}>
                             {author.name || "Name"}
                          </span>
                          <span className="text-[10px] tracking-wider mt-0.5 drop-shadow-sm whitespace-pre-wrap leading-tight font-medium" style={{ color: data.authorsTextColor || '#ffffff', opacity: 0.9, wordBreak: 'keep-all' }}>
                             {author.title || "Title"}
                          </span>
                        </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
       </div>

       {/* BOTTOM SECTION: Footer with selectable background */}
       {!isFullPortrait && (
         <div className="flex-1 px-12 py-6 flex items-center justify-between relative z-10 overflow-hidden">
            {/* Base gradient background */}
            <div className="absolute inset-0 -z-10" style={{ background: footerPreset.bg }} />

            {/* Radial glow accents (only if preset has glows) */}
            {footerPreset.glowA && (
              <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full -z-10 opacity-100 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${footerPreset.glowA} 0%, transparent 70%)` }} />
            )}
            {footerPreset.glowB && (
              <div className="absolute -bottom-16 -right-10 w-64 h-64 rounded-full -z-10 opacity-100 pointer-events-none"
                style={{ background: `radial-gradient(circle, ${footerPreset.glowB} 0%, transparent 70%)` }} />
            )}

            {/* Grain overlay */}
            {footerPreset.grainOpacity > 0 && <GrainOverlay opacity={footerPreset.grainOpacity} />}
            
            {/* Effect overlay (holographic, foil, stamp) */}
            <EffectOverlay effectId={data.overlayEffect} emoji={data.emojiPattern} />
            
            {/* Left: Text Description */}
            <div className="flex-1 pr-10 flex flex-col justify-center items-start h-full min-w-0 relative z-10">
               <p className={`text-[25px] font-light mb-3 flex items-center gap-5 ${footerPreset.isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span className="w-5 h-5 bg-cyan-500 rounded-full"></span>
                  {data.date || "TODAY"}
               </p>
               <h3 
                 className={`font-serif font-black italic leading-tight mb-5 whitespace-pre-wrap text-left ${footerPreset.isDark ? 'text-white' : 'text-gray-800'}`}
                 style={{ fontSize: `${data.footerFontSize || 48}px` }}
               >
                 {data.footerText || "Scan to view memories"}
               </h3>
               <div className={`flex items-center gap-4 text-[25px] truncate w-full ${footerPreset.isDark ? 'text-gray-400' : 'text-gray-400'}`}>
                  <Feather size={25} /> 
                  <span className={`truncate font-light ${footerPreset.isDark ? 'text-gray-300' : 'text-gray-500'}`}>{data.sender || "Sender"}</span>
               </div>
            </div>

            {/* Right: QR Codes */}
            <div className="flex items-center gap-8 h-full shrink-0 relative z-10">
               {/* QR Code 1 */}
               <div className="flex flex-col items-center gap-4 justify-center h-full">
                  <div className="w-[156px] h-[156px] bg-white rounded-2xl border-2 border-white/60 p-4 flex items-center justify-center relative overflow-hidden shadow-md">
                     {data.qrCode1 ? (
                        <img src={data.qrCode1} crossOrigin="anonymous" className="w-full h-full object-contain rounded-xl" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} alt="QR1" />
                     ) : (
                        <QrCode className="text-gray-200" size={68} />
                     )}
                  </div>
                  <span className={`text-[18px] font-black uppercase tracking-widest text-center w-[156px] truncate ${footerPreset.isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {data.qr1Text || "Web"}
                  </span>
               </div>

               {/* QR Code 2 */}
               <div className="flex flex-col items-center gap-4 justify-center h-full">
                  <div className="w-[156px] h-[156px] bg-white rounded-2xl border-2 border-white/60 p-4 flex items-center justify-center relative overflow-hidden shadow-md">
                     {data.qrCode2 ? (
                        <img src={data.qrCode2} crossOrigin="anonymous" className="w-full h-full object-contain rounded-xl" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} alt="QR2" />
                     ) : (
                        <QrCode className="text-gray-200" size={68} />
                     )}
                  </div>
                  <span className={`text-[18px] font-black uppercase tracking-widest text-center w-[156px] truncate ${footerPreset.isDark ? 'text-gray-300' : 'text-gray-500'}`}>
                    {data.qr2Text || "Info"}
                  </span>
               </div>
            </div>

         </div>
       )}
    </div>
  );
});

// 2. Code / Dev
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
                   <div className="text-[#6e7681] select-none text-right font-mono min-w-[2.5rem]">
                      {Array.from({length: 15}).map((_, i) => <div key={i}>{i+1}</div>)}
                   </div>
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
                <div className="h-12 bg-[#f0f0f0] border-b border-[#e0e0e0] flex items-center px-5 gap-4 shrink-0">
                   <div className="flex gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300"></div>
                   </div>
                   <div className="flex-1 bg-white h-7 rounded-md border border-[#e0e0e0] flex items-center px-4">
                      <span className="text-xs text-gray-400">localhost:3000/profile</span>
                   </div>
                </div>
                <div className="flex-1 overflow-hidden relative flex flex-col">
                   <div className="w-full aspect-[4/3] bg-gray-100 relative group overflow-hidden shrink-0">
                      {data.image ? (
                        <img src={data.image} alt="Preview" crossOrigin="anonymous" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                           <ImageIcon size={40} />
                        </div>
                      )}
                      <div className="absolute top-5 right-5 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1.5 rounded">v2.0</div>
                   </div>
                   <div className="p-8 flex-1 flex flex-col min-h-0">
                      <h1 className="text-3xl font-black text-gray-800 leading-tight mb-3 truncate">{data.sender || "Name"}</h1>
                      <div className="flex gap-3 mb-5">
                         <span className="px-3 py-1.5 bg-blue-50 text-blue-600 text-xs font-black rounded uppercase tracking-wider border border-blue-100">Developer</span>
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

// 3. Livestream Template
const LivestreamTemplate = forwardRef<HTMLDivElement, TemplateProps>(({ data, scale = 1, onUpdateData, isExporting = false, exportAnimPhase }, ref) => {
  // Resolve background preset — fallback to theme-based solid for backwards compat
  const bgKey = data.bgStyle || (data.theme === 'dark' ? 'solid-dark' : 'nebula-light');
  const bgPreset = LIVESTREAM_BG_PRESETS[bgKey] ?? LIVESTREAM_BG_PRESETS['nebula-light'];
  const isDark = bgPreset.isDark;

  // Accent color adapts to the selected background (falls back to indigo)
  const accent = bgPreset.accent || '#6366f1';
  const accentSoft = bgPreset.accentSoft || '#c7d2fe';
  // Badge text color on the accent-filled "直播主题" label — dark accents get white text
  const badgeBg = isDark ? hexToRgba(accent, 0.85) : accent;

  const [selectedLogo, setSelectedLogo] = useState<number | null>(null);

  // --- Live animation phase (0..1 looping). Driven by rAF in preview; overridden during video capture. ---
  const [livePhase, setLivePhase] = useState(0);
  useEffect(() => {
    if (exportAnimPhase !== undefined) return; // deterministic capture mode
    let raf = 0;
    const loop = (t: number) => {
      // 2.4s breathing cycle
      setLivePhase((t % 2400) / 2400);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exportAnimPhase]);

  const phase = exportAnimPhase !== undefined ? exportAnimPhase : livePhase;
  // Smooth 0..1..0 breathing curve
  const breath = (1 - Math.cos(phase * Math.PI * 2)) / 2; // 0 → 1 → 0
  const topicGlow = 6 + breath * 26;            // shadow blur px
  const topicGlowOpacity = 0.35 + breath * 0.5; // glow alpha
  const topicScale = 1 + breath * 0.015;        // subtle pulse
  const liveDotScale = 0.85 + breath * 0.4;
  const liveDotOpacity = 0.55 + breath * 0.45;


  // --- Logos Drag & Scale Logic ---
  const handleLogosMouseDown = (e: React.MouseEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialLayout = data.logosLayout || { x: 0, y: 0, scale: 1 };

    const onMouseMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / scale;
      const dy = (moveEvent.clientY - startY) / scale;
      onUpdateData('logosLayout', { ...initialLayout, x: initialLayout.x + dx, y: initialLayout.y + dy });
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const handleLogosWheel = (e: React.WheelEvent) => {
    if (isExporting || !onUpdateData) return;
    e.stopPropagation();
    const layout = data.logosLayout || { x: 0, y: 0, scale: 1 };
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    const newScale = Math.min(Math.max(layout.scale + delta, 0.2), 3.0);
    onUpdateData('logosLayout', { ...layout, scale: newScale });
  };

  return (
    <div 
      ref={ref} 
      className={`w-[1440px] h-[810px] shadow-2xl relative overflow-hidden flex flex-col font-sans transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} 
      style={{ 
        transform: `scale(${scale})`, 
        transformOrigin: 'top left',
        background: bgPreset.bg,
      }}
    >
      {/* Radial glow accents */}
      {bgPreset.glowA && (
        <div className="absolute top-0 left-0 w-[600px] h-[600px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at top left, ${bgPreset.glowA} 0%, transparent 65%)` }} />
      )}
      {bgPreset.glowB && (
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse at bottom right, ${bgPreset.glowB} 0%, transparent 65%)` }} />
      )}
      {bgPreset.glowA && bgPreset.glowB && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] pointer-events-none"
          style={{ background: `radial-gradient(ellipse, ${bgPreset.glowA.replace('0.', '0.0')} 0%, transparent 70%)` }} />
      )}

      {/* Grain overlay */}
      {bgPreset.grainOpacity > 0 && <GrainOverlay opacity={bgPreset.grainOpacity} />}

      {/* Effect overlay (holographic, foil, stamp) */}
      <EffectOverlay effectId={data.overlayEffect} emoji={data.emojiPattern} />

      {/* Top Header Bar */}
      <div className="px-10 py-6 flex items-center justify-between z-20">
        <div
          className={`flex items-center gap-6 rounded-3xl px-8 py-4 shadow-sm transition-colors duration-500 ${isDark ? 'border' : ''}`}
          style={{
            transform: `scale(${topicScale})`,
            transformOrigin: 'left center',
            background: isDark ? hexToRgba(accent, 0.18) : accentSoft,
            borderColor: isDark ? hexToRgba(accent, 0.4) : 'transparent',
            boxShadow: `0 0 ${topicGlow}px ${hexToRgba(accent, topicGlowOpacity)}`,
          }}
        >
          <span
            className="flex items-center gap-2.5 text-white text-xl font-black px-5 py-2 rounded-2xl whitespace-nowrap"
            style={{ background: badgeBg }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#ff3b3b]"
              style={{
                transform: `scale(${liveDotScale})`,
                opacity: liveDotOpacity,
                boxShadow: `0 0 ${4 + breath * 10}px rgba(255,59,59,${0.6 * liveDotOpacity + 0.3})`,
              }}
            />
            直播主题
          </span>
          <h1 
            className={`text-4xl font-black truncate max-w-[1000px] transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ letterSpacing: `${data.liveTopicSpacing ?? 0}em` }}
          >
            {data.liveTopic || "直播主题内容"}
          </h1>
        </div>
        
        {/* Logo Area - all logos with separators, draggable, contrast-adapted */}
        <div 
          className={`flex items-center ${isExporting ? '' : 'cursor-move group/logos'}`}
          style={{
            gap: `${data.logoGap ?? 16}px`,
            transform: `translate(${data.logosLayout?.x || 0}px, ${data.logosLayout?.y || 0}px) scale(${data.logosLayout?.scale || 1})`,
            transformOrigin: 'center',
          }}
          onMouseDown={handleLogosMouseDown}
          onWheel={handleLogosWheel}
        >
          {!isExporting && (
            <div className="absolute -inset-2 border border-dashed rounded-lg opacity-0 group-hover/logos:opacity-100 transition-opacity pointer-events-none flex items-start justify-end pr-1 pt-1" style={{ borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)' }}>
              <div className={`text-[10px] px-2 py-0.5 rounded backdrop-blur-md scale-[0.8] origin-top-right whitespace-nowrap ${isDark ? 'bg-white/20 text-white' : 'bg-black/10 text-gray-700'}`}>
                Drag · Click a logo to resize it
              </div>
            </div>
          )}
          {data.logos && data.logos.length > 0 ? (
            data.logos.map((logo, index) => (
              <React.Fragment key={index}>
                <LogoImage
                  logo={logo}
                  index={index}
                  data={data}
                  isExporting={isExporting}
                  onUpdateData={onUpdateData}
                  selected={selectedLogo === index}
                  onSelect={setSelectedLogo}
                  isDark={isDark}
                  heightClass="h-10"
                />
                {index < (data.logos?.length || 0) - 1 && (
                  <span className="text-3xl font-light select-none pointer-events-none" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)' }}>丨</span>
                )}
              </React.Fragment>
            ))
          ) : (
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600 rounded-2xl shadow-sm pointer-events-none"></div>
               <span className={`font-black italic text-3xl tracking-tighter transition-colors duration-500 pointer-events-none ${isDark ? 'text-white' : 'text-gray-800'}`}>WaytoAGI</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex px-10 pb-10 gap-8 min-h-0 relative z-10">
        {/* Left: Main Visual Area (Hollow 16:9 frame) — transparent interior, background shows through */}
        <div className="aspect-[16/9] h-full border-[3px] rounded-[32px] relative shrink-0 z-10 overflow-hidden" style={{ background: 'transparent', borderColor: accent }}>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <ImageIcon size={80} className="mb-4 opacity-[0.08]" style={{ color: isDark ? '#ffffff' : accent }} />
          </div>
          
          {/* Corner Accents */}
          <div className="absolute top-5 left-5 w-10 h-10 border-t-[3px] border-l-[3px] rounded-tl-lg" style={{ borderColor: hexToRgba(accent, 0.6) }}></div>
          <div className="absolute top-5 right-5 w-10 h-10 border-t-[3px] border-r-[3px] rounded-tr-lg" style={{ borderColor: hexToRgba(accent, 0.6) }}></div>
          <div className="absolute bottom-5 left-5 w-10 h-10 border-b-[3px] border-l-[3px] rounded-bl-lg" style={{ borderColor: hexToRgba(accent, 0.6) }}></div>
          <div className="absolute bottom-5 right-5 w-10 h-10 border-b-[3px] border-r-[3px] rounded-br-lg" style={{ borderColor: hexToRgba(accent, 0.6) }}></div>
        </div>

        {/* Right: Sidebar */}
        <div className="flex-1 flex flex-col min-w-0 relative z-10">
          <div className="flex-1 flex flex-col min-h-0">
            <h2 className={`text-2xl font-black border-l-[8px] pl-4 mb-6 shrink-0 transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ borderColor: accent }}>直播嘉宾</h2>
            
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
                        className={`w-24 h-24 rounded-full overflow-hidden border-[4px] shadow-md mb-3 shrink-0 cursor-pointer transition-colors duration-500 ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}
                        style={{ borderColor: isDark ? hexToRgba(accent, 0.25) : hexToRgba(accent, 0.35) }}
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
                          <img src={guest.image} alt={guest.name} crossOrigin="anonymous" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User size={40} />
                          </div>
                        )}
                      </div>
                      <span className={`font-black mb-1 truncate w-full px-2 transition-colors duration-500 ${isDark ? 'text-white' : 'text-gray-900'}`} style={{ fontSize: data.authors.length > 4 ? '1rem' : '1.25rem' }}>
                        {guest.name || "嘉宾姓名"}
                      </span>
                      <p className={`leading-tight whitespace-pre-wrap px-4 font-medium transition-colors duration-500 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} style={{ fontSize: data.authors.length > 4 ? '0.75rem' : '0.6875rem', wordBreak: 'keep-all' }}>
                        {guest.title || "嘉宾介绍/头衔"}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`flex flex-col items-center py-10 ${isDark ? 'text-white/10' : 'text-gray-900/10'}`}>
                   <User size={60} />
                   <span className="text-sm font-black mt-4 uppercase tracking-widest">No Guests</span>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Area */}
          <div className="mt-6 flex flex-col items-center shrink-0">
            <div className={`w-36 h-36 p-3 rounded-2xl border-2 shadow-sm relative mb-3 transition-colors duration-500 ${isDark ? 'bg-white/5' : 'bg-white'}`} style={{ borderColor: isDark ? hexToRgba(accent, 0.2) : hexToRgba(accent, 0.25) }}>
              {data.qrCode1 ? (
                <img src={data.qrCode1} alt="QR" crossOrigin="anonymous" className="w-full h-full object-contain" style={{ transform: 'scale(1.15)', transformOrigin: 'center' }} />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
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
