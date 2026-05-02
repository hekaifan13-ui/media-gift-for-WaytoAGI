import React, { useState } from 'react';
import { generateCoverImage } from '../services/geminiService';
import { Sparkles, Loader2, X, Image as ImageIcon, Check, Download } from 'lucide-react';

interface ImageGenModalProps {
  onSelect: (base64Image: string) => void;
  onClose: () => void;
  initialPrompt?: string;
}

const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1', icon: 'square' },
  { label: 'Portrait', value: '3:4', icon: 'portrait' },
  { label: 'Landscape', value: '4:3', icon: 'landscape' },
  { label: 'Wide', value: '16:9', icon: 'wide' },
  { label: 'Tall', value: '9:16', icon: 'tall' },
];

const ImageGenModal: React.FC<ImageGenModalProps> = ({ onSelect, onClose, initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState('3:4');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedImage(null);

    try {
      const result = await generateCoverImage(prompt, aspectRatio);
      if (result) {
        setGeneratedImage(result);
      } else {
        setError("No image generated. Please try a different prompt.");
      }
    } catch (err) {
      setError("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[600px] md:h-[500px]">
        
        {/* Left: Controls */}
        <div className="w-full md:w-1/2 p-6 flex flex-col border-r border-gray-100 bg-gray-50">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
              <Sparkles size={20} />
              <span>AI Image Studio</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 md:hidden">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe the image you want (e.g., A watercolor painting of a cafe in Paris...)"
                className="w-full h-32 p-3 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm leading-relaxed text-gray-900 placeholder:text-gray-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Aspect Ratio</label>
              <div className="grid grid-cols-3 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    className={`flex flex-col items-center justify-center p-2 rounded-lg border text-xs font-medium transition-all ${
                      aspectRatio === ratio.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="mb-1 opacity-80">{ratio.value}</span>
                    <span className="text-[10px] uppercase">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="mt-6 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin" size={18} /> Generating...
              </>
            ) : (
              <>
                <Sparkles size={18} /> Generate Image
              </>
            )}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="w-full md:w-1/2 bg-[#e5e5f7] relative flex items-center justify-center p-6 overflow-hidden">
           {/* Geometric background pattern from main css */}
           <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
              backgroundImage: 'linear-gradient(#4f46e5 1px, transparent 1px), linear-gradient(90deg, #4f46e5 1px, transparent 1px)',
              backgroundSize: '20px 20px'
           }}></div>

           <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 hidden md:block z-30 bg-white/50 rounded-full p-1 hover:bg-white transition-colors cursor-pointer">
              <X size={20} />
            </button>

           {generatedImage ? (
             <div className="flex flex-col items-center w-full h-full relative z-20">
                <div className="flex-1 w-full flex items-center justify-center min-h-0">
                  <img 
                    src={generatedImage} 
                    alt="AI Generated" 
                    className="max-w-full max-h-full rounded-lg shadow-2xl object-contain border-4 border-white"
                  />
                </div>
                <div className="mt-6 w-full flex gap-3">
                   <button 
                     onClick={() => onSelect(generatedImage)}
                     className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 transition-transform hover:scale-105 cursor-pointer z-20 relative"
                   >
                     <Check size={18} /> Use This
                   </button>
                   <button 
                     onClick={handleDownloadImage}
                     className="px-3 bg-white hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-bold shadow-md border border-gray-200 cursor-pointer z-20 relative flex items-center justify-center transition-colors"
                     title="Download Image"
                   >
                     <Download size={18} />
                   </button>
                   <button 
                     onClick={() => setGeneratedImage(null)}
                     className="px-4 bg-white hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-bold shadow-md border border-gray-200 cursor-pointer z-20 relative"
                   >
                     Discard
                   </button>
                </div>
             </div>
           ) : (
             <div className="text-center text-gray-400 flex flex-col items-center relative z-20">
                {error ? (
                  <div className="bg-red-50 text-red-500 p-4 rounded-xl text-sm max-w-xs border border-red-100 mb-4">
                    {error}
                  </div>
                ) : null}
                <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-4 shadow-inner">
                   {isGenerating ? (
                     <Sparkles className="text-indigo-400 animate-pulse" size={40} />
                   ) : (
                     <ImageIcon className="text-gray-300" size={40} />
                   )}
                </div>
                <p className="text-sm font-medium">
                  {isGenerating ? "Dreaming up your image..." : "Your creation will appear here"}
                </p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ImageGenModal;