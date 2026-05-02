import React, { useState, useEffect, useRef } from 'react';
import { AppState, TemplateId } from '../types';
import { TEMPLATES } from '../constants';
import { 
  Sparkles, MousePointerClick, Code, Image as ImageIcon, Box,
  X, LayoutGrid
} from 'lucide-react';

interface IntroBoxProps {
  onOpen: () => void;
  onClose: () => void;
  onSelectTemplate: (id: TemplateId) => void;
  appState: AppState;
}

const IntroBox: React.FC<IntroBoxProps> = ({ onOpen, onClose, onSelectTemplate, appState }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync internal state with AppState, but avoid dependency loops
  useEffect(() => {
    if (appState === AppState.SELECTION) {
      setIsOpen(true);
    } else if (appState === AppState.INTRO) {
      setIsOpen(false);
    }
  }, [appState]);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleBoxClick = () => {
    if (!isOpen) {
      setIsOpen(true);
      // Delay state update to allow animation to start
      setTimeout(() => {
        onOpen();
      }, 800);
    }
  };

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false); // Immediate visual feedback
    onClose(); // Update global state
  };

  const getIconForTemplate = (id: TemplateId) => {
    switch (id) {
      case TemplateId.CODE: return <Code size={16} className="text-blue-500" />;
      case TemplateId.LIVESTREAM: return <Sparkles size={16} className="text-indigo-500" />;
      default: return <ImageIcon size={16} className="text-gray-500" />;
    }
  };

  // Dimensions - Smaller Box for tighter fit
  const boxWidth = 540;
  const boxHeight = 360;
  const boxDepth = 100; // Thickness of the box
  
  // Card Grid Logic
  const renderCard = (template: typeof TEMPLATES[0], idx: number) => {
    const isHovered = hoveredCard === idx;
    
    // Grid Calculation (2 rows of 4)
    const row = Math.floor(idx / 4);
    const col = idx % 4;
    
    const cardWidth = 140; 
    const cardHeight = 170;
    
    // Overlap Logic: Step is smaller than width to create overlap
    const xStep = 85; // Overlap by (140 - 85) = 55px
    const yStep = 120; // Tight vertical stacking
    
    // Calculate total grid dimensions to center content
    const totalGridWidth = cardWidth + (3 * xStep);
    const totalGridHeight = cardHeight + yStep;
    
    const startX = -(totalGridWidth / 2) + (cardWidth / 2);
    const startY = -(totalGridHeight / 2) + (cardHeight / 2);
    
    const x = startX + col * xStep;
    const y = startY + row * yStep;

    return (
      <div
        key={template.id}
        // IMPORTANT: pointer-events-auto is needed here because the parent box-group is pointer-events-none when open
        className={`absolute preserve-3d transition-all duration-300 ease-out ${isOpen ? 'pointer-events-auto cursor-pointer' : ''}`}
        style={{
          width: cardWidth,
          height: cardHeight,
          // Position in 3D space relative to box center
          transform: `
            translateX(${x}px) 
            translateY(${y}px) 
            translateZ(${isHovered ? 80 : idx * 2}px)
            rotateX(${isHovered ? -5 : 0}deg)
            rotateY(${isHovered ? 0 : -2}deg)
            scale(${isHovered ? 1.15 : 1})
          `,
          zIndex: isHovered ? 100 : idx, // Stack by index, pop to top on hover
        }}
        onMouseEnter={() => isOpen && setHoveredCard(idx)}
        onMouseLeave={() => isOpen && setHoveredCard(null)}
        onClick={(e) => {
          if (!isOpen) return; // Should not happen due to pointer-events on parent, but safe guard
          e.stopPropagation();
          onSelectTemplate(template.id);
        }}
      >
        <div 
          className="w-full h-full rounded-xl shadow-md border-[3px] border-white overflow-hidden relative group transition-all"
          style={{
            backgroundColor: template.previewColor,
            boxShadow: isHovered 
              ? '0 25px 50px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.8)' 
              : '0 4px 6px -1px rgba(0,0,0,0.2), 0 2px 4px -1px rgba(0,0,0,0.1)',
          }}
        >
          {/* Card Content */}
          <div className="absolute inset-0 flex flex-col p-4 bg-gradient-to-br from-white/10 to-transparent">
             <div className="flex-1 bg-white/40 rounded-lg mb-3 flex items-center justify-center backdrop-blur-md border border-white/40 relative overflow-hidden shadow-inner">
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-5" style={{backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '8px 8px'}}></div>
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg z-10 transition-transform duration-300 group-hover:scale-110 text-slate-700">
                  {getIconForTemplate(template.id)}
                </div>
             </div>
             
             <div className="space-y-2">
                <div className="h-2 w-3/4 bg-black/10 rounded-full"></div>
                <div className="h-2 w-1/2 bg-black/5 rounded-full"></div>
             </div>

             {/* Hover Overlay */}
             <div className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center transition-all duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-white text-xs font-bold tracking-widest uppercase mb-3 drop-shadow-md text-center px-2">{template.name}</span>
                <span className="text-[10px] bg-white text-black px-4 py-1.5 rounded-full font-extrabold shadow-lg transform transition-transform hover:scale-105 tracking-wide">
                  SELECT
                </span>
             </div>
          </div>
        </div>
        
        {/* Shadow on floor when floating */}
        {isHovered && (
           <div className="absolute -bottom-12 left-2 right-2 h-4 bg-black/20 blur-xl rounded-full transition-all duration-300"></div>
        )}
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="w-full h-full flex flex-col items-center justify-center overflow-hidden relative selection:bg-cyan-200"
      style={{
        background: 'linear-gradient(135deg, #f0f4f8 0%, #dbeafe 100%)'
      }}
    >
      {/* --- Ambient Scene Background --- */}
      <div className="absolute inset-0 pointer-events-none opacity-50">
        <div className="absolute top-[5%] left-[15%] w-[500px] h-[500px] bg-cyan-200 rounded-full blur-[140px] mix-blend-multiply animate-pulse" style={{animationDuration: '8s'}}></div>
        <div className="absolute bottom-[5%] right-[15%] w-[500px] h-[500px] bg-purple-200 rounded-full blur-[140px] mix-blend-multiply" style={{animationDuration: '10s'}}></div>
      </div>

      {/* --- Close Button (Only when open) --- */}
      <div className={`absolute top-8 right-8 z-50 transition-all duration-500 ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}`}>
        <button 
          onClick={handleCloseClick}
          className="group flex items-center gap-2 px-4 py-2 bg-white/60 hover:bg-white/80 backdrop-blur-xl rounded-full text-slate-600 transition-all border border-white/50 shadow-sm hover:shadow-lg cursor-pointer"
        >
          <span className="text-xs font-bold uppercase tracking-wider pr-1">Close Box</span>
          <div className="bg-white p-1 rounded-full group-hover:rotate-90 transition-transform duration-300">
             <X size={14} />
          </div>
        </button>
      </div>

      {/* --- Header --- */}
      <div className={`absolute top-12 transition-all duration-700 z-10 flex flex-col items-center pointer-events-none ${isOpen ? 'opacity-0 -translate-y-10' : 'opacity-100 translate-y-0'}`}>
         <div className="bg-white/60 backdrop-blur-md px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase text-slate-600 border border-white/60 shadow-sm mb-6 flex items-center gap-2">
            <LayoutGrid size={14} className="text-cyan-600" /> The Collection
         </div>
         <h1 className="text-6xl md:text-8xl font-serif text-slate-800 tracking-tighter drop-shadow-sm mb-3 opacity-90">
            Memories
         </h1>
         <p className="text-slate-500 text-sm font-sans tracking-wide uppercase flex items-center gap-2">
            <span className="w-8 h-[1px] bg-slate-400"></span>
            Curated Templates
            <span className="w-8 h-[1px] bg-slate-400"></span>
         </p>
      </div>

      {/* --- 3D Scene --- */}
      <div 
        className="relative z-20 scene perspective-[1600px]"
        style={{
          transform: `translateY(${isOpen ? '40px' : '0px'})`
        }}
      >
        <div 
           // IMPORTANT: pointer-events-none on the container when open allows clicks to pass through transparent faces to the cards
           // The cards themselves re-enable pointer-events-auto
           className={`relative box-group transition-transform duration-100 ease-linear ${isOpen ? 'pointer-events-none' : 'cursor-pointer'}`}
           style={{ 
             width: boxWidth, 
             height: boxHeight,
             transformStyle: 'preserve-3d',
             transform: isOpen 
                ? `rotateX(${15 + mousePos.y * -3}deg) rotateY(${mousePos.x * 3}deg) scale(1.05)` 
                : `rotateX(${mousePos.y * -8}deg) rotateY(${mousePos.x * 12}deg)`
           }}
           onClick={handleBoxClick}
         >
            {/* ---------------- ACRYLIC BOX STRUCTURE ---------------- */}
            {/* All structural elements are pointer-events-none to avoid blocking card interactions */}

            {/* 1. Back Face */}
            <div 
               className="absolute inset-0 rounded-2xl border border-white/40 shadow-xl backdrop-blur-2xl pointer-events-none"
               style={{ 
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.4))',
                 transform: `translateZ(-${boxDepth/2}px)`,
                 boxShadow: 'inset 0 0 100px rgba(255,255,255,0.8)'
               }}
            >
               {/* Decorative grid on back */}
               <div className="absolute inset-6 border border-white/30 rounded-lg opacity-30 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border border-white/20"></div>
               </div>
            </div>

            {/* 2. Side Faces */}
            {/* Left Wall */}
            <div 
               className="absolute top-0 bottom-0 rounded-sm border border-white/20 bg-gradient-to-b from-white/30 to-white/10 pointer-events-none backdrop-blur-sm"
               style={{ 
                 width: boxDepth, 
                 left: -boxDepth/2, 
                 transform: 'rotateY(-90deg)',
                 transformOrigin: 'center',
               }}
            ></div>
             {/* Right Wall */}
             <div 
               className="absolute top-0 bottom-0 rounded-sm border border-white/20 bg-gradient-to-b from-white/30 to-white/10 pointer-events-none backdrop-blur-sm"
               style={{ 
                 width: boxDepth, 
                 right: -boxDepth/2, 
                 transform: 'rotateY(90deg)',
                 transformOrigin: 'center',
               }}
            ></div>
             {/* Bottom Floor */}
             <div 
               className="absolute left-0 right-0 rounded-sm border border-white/20 bg-white/40 pointer-events-none backdrop-blur-md"
               style={{ 
                 height: boxDepth, 
                 bottom: -boxDepth/2, 
                 transform: 'rotateX(-90deg)',
                 transformOrigin: 'center',
                 boxShadow: 'inset 0 0 50px rgba(255,255,255,0.5)'
               }}
            ></div>

            {/* 3. CONTENTS (Cards Container) */}
            <div 
               className="absolute inset-0 flex items-center justify-center preserve-3d"
               style={{ transform: 'translateZ(0px)' }}
            >
               {TEMPLATES.map((t, i) => renderCard(t, i))}
            </div>

            {/* 4. LID */}
            <div 
               className="absolute top-0 left-0 w-full h-full preserve-3d transition-all duration-[1.2s] ease-[cubic-bezier(0.68,-0.55,0.265,1.55)] pointer-events-none"
               style={{
                  transform: isOpen 
                    ? `translateY(-550px) translateZ(150px) rotateX(60deg) rotateY(20deg) rotateZ(10deg)` 
                    : `translateY(0) translateZ(${boxDepth/2 + 2}px)`,
                  opacity: isOpen ? 0 : 1
               }}
            >
               {/* Lid Top Surface */}
               <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl border-2 border-white/60 rounded-2xl flex items-center justify-center overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.1)]">
                  {/* Glossy Sheen */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/60 via-transparent to-transparent opacity-70"></div>
                  
                  {/* Branding */}
                  <div className="relative border border-white/50 px-12 py-10 rounded-xl flex flex-col items-center backdrop-blur-lg shadow-[inset_0_0_40px_rgba(255,255,255,0.4)] bg-white/10">
                     <Box size={48} className="text-white drop-shadow-lg mb-4 opacity-90" strokeWidth={1} />
                     <span className="text-4xl font-serif text-white font-bold tracking-[0.25em] drop-shadow-xl">ACRYLIC</span>
                     <div className="w-12 h-[1px] bg-white/70 my-3"></div>
                     <span className="text-[9px] text-white uppercase tracking-[0.4em] font-medium drop-shadow-md">Box of Memories</span>
                  </div>
               </div>
            </div>

            {/* 5. Front Face (Glass Window) */}
            <div 
               className="absolute inset-0 rounded-2xl border border-white/50 pointer-events-none transition-all duration-700"
               style={{ 
                 transform: `translateZ(${boxDepth/2}px)`,
                 background: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0.15) 100%)',
                 boxShadow: isOpen ? 'none' : 'inset 0 0 60px rgba(255,255,255,0.4)',
                 // When open, we reduce opacity to almost invisible so it looks like "open air" but still retains a faint glass feel if noticed
                 opacity: isOpen ? 0.05 : 1 
               }}
            >
               {/* Reflections */}
               <div className={`absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-white/30 to-transparent opacity-50 transition-opacity ${isOpen ? 'opacity-0' : 'opacity-50'}`}></div>
               <div className="absolute bottom-10 left-10 w-20 h-20 bg-white/10 blur-3xl rounded-full"></div>
            </div>

         </div>
      </div>

      {/* --- Footer Hint --- */}
      <div className={`absolute bottom-12 transition-all duration-500 delay-200 z-50 pointer-events-none ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
        <div className="bg-white/70 backdrop-blur-lg px-6 py-3 rounded-full flex items-center gap-3 text-slate-700 shadow-2xl border border-white">
           <MousePointerClick size={16} className="text-cyan-600 animate-bounce" />
           <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Select a template</span>
        </div>
      </div>

      {!isOpen && (
         <div className="absolute bottom-24 animate-pulse text-slate-400 flex flex-col items-center pointer-events-none z-10">
            <div className="w-[1px] h-12 bg-gradient-to-b from-transparent via-slate-400 to-transparent mb-4"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Tap to Open</span>
         </div>
      )}

    </div>
  );
};

export default IntroBox;