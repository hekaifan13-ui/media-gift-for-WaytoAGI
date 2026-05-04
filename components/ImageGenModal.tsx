import React, { useState, useRef } from 'react';
import { Sparkles, Loader2, X, Image as ImageIcon, Check, Download, Upload, Trash2 } from 'lucide-react';
import { useAIImage } from '../hooks/useAIImage';
import { useResourceUpload } from '../hooks/useResourceUpload';

interface ImageGenModalProps {
  onSelect: (imageUrl: string) => void;
  onClose: () => void;
  initialPrompt?: string;
}

const ASPECT_RATIOS = [
  { label: 'Square', value: '1:1' },
  { label: 'Portrait', value: '3:4' },
  { label: 'Landscape', value: '4:3' },
  { label: 'Wide', value: '16:9' },
  { label: 'Tall', value: '9:16' },
];

const ImageGenModal: React.FC<ImageGenModalProps> = ({ onSelect, onClose, initialPrompt = '' }) => {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [mode, setMode] = useState<'txt_2_img' | 'img_2_img'>('txt_2_img');
  const { images, error, isLoading, isSubmitting, isPolling, submitAndPoll, clearImages } = useAIImage();
  const refUpload = useResourceUpload();
  const refInputRef = useRef<HTMLInputElement>(null);

  const generatedImage = images.length > 0 ? images[0].url : null;

  const handleRefImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await refUpload.uploadFile(file);
    if (refInputRef.current) refInputRef.current.value = '';
  };

  const handleRefImageDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await refUpload.uploadFile(file);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    // GPT Image 2 only supports txt_2_img; use Seedream 4.5 for img_2_img
    const model = mode === 'img_2_img' ? 'doubao/seedream-4.5' : 'openai/gpt-image-2';

    const options: any = {
      model,
      prompt: prompt.trim(),
      type: mode,
      ratio: aspectRatio,
      resolution: '2k',
      format: 'png',
    };

    if (mode === 'img_2_img' && refUpload.resourcePath) {
      options.resource_path = refUpload.resourcePath;
    }

    await submitAndPoll(options);
  };

  const handleDownloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `ai-generated-${Date.now()}.png`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col md:flex-row h-[650px] md:h-[540px]">
        
        {/* Left: Controls */}
        <div className="w-full md:w-1/2 p-5 flex flex-col border-r border-gray-100 bg-gray-50 overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
              <Sparkles size={20} />
              <span>AI Image Studio</span>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 md:hidden">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-3 flex-1">
            {/* Mode Toggle */}
            <div className="flex gap-1 bg-gray-200 p-1 rounded-lg">
              <button
                onClick={() => setMode('txt_2_img')}
                className={`flex-1 py-1.5 text-[11px] font-bold uppercase rounded-md transition-all ${mode === 'txt_2_img' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
              >
                Text to Image
              </button>
              <button
                onClick={() => setMode('img_2_img')}
                className={`flex-1 py-1.5 text-[11px] font-bold uppercase rounded-md transition-all ${mode === 'img_2_img' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
              >
                Image + Text
              </button>
            </div>

            {/* Reference Image (img_2_img mode) */}
            {mode === 'img_2_img' && (
              <div>
                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Reference Image</label>
                {refUpload.previewUrl ? (
                  <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-white">
                    <img src={refUpload.previewUrl} alt="Reference" className="w-full h-28 object-cover" />
                    {refUpload.isUploading && (
                      <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                        <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                          <Loader2 className="animate-spin" size={16} />
                          Uploading...
                        </div>
                      </div>
                    )}
                    {refUpload.resourcePath && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Ready</div>
                    )}
                    <button
                      onClick={() => refUpload.reset()}
                      className="absolute top-2 right-2 bg-red-500 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-600 shadow-md"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-28 border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-white"
                    onClick={() => refInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleRefImageDrop}
                  >
                    <Upload size={22} className="text-gray-400 mb-1" />
                    <span className="text-xs text-gray-500 font-medium">Drop or click to upload</span>
                    <span className="text-[10px] text-gray-400">jpg, png, webp (max 10MB)</span>
                  </div>
                )}
                {refUpload.error && (
                  <p className="text-xs text-red-500 mt-1">{refUpload.error}</p>
                )}
              </div>
            )}

            {/* Prompt */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Prompt</label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={mode === 'img_2_img' 
                  ? "Describe how to transform the reference image..." 
                  : "Describe the image you want..."}
                className="w-full h-24 p-3 rounded-xl border border-gray-200 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none resize-none text-sm leading-relaxed text-gray-900 placeholder:text-gray-400"
                disabled={isLoading}
              />
            </div>

            {/* Aspect Ratio */}
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Aspect Ratio</label>
              <div className="grid grid-cols-5 gap-1.5">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio.value}
                    onClick={() => setAspectRatio(ratio.value)}
                    disabled={isLoading}
                    className={`flex flex-col items-center justify-center py-1.5 rounded-lg border text-[10px] font-medium transition-all ${
                      aspectRatio === ratio.value
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <span className="font-bold">{ratio.value}</span>
                    <span className="text-[8px] uppercase opacity-80">{ratio.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[10px] text-gray-400 bg-gray-100 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <span className="font-bold text-indigo-500">{mode === 'img_2_img' ? 'Seedream 4.5' : 'GPT Image 2'}</span>
              <span className="opacity-70">|</span>
              <span>{mode === 'img_2_img' ? 'Fast · Supports image transform' : 'High quality · 2K resolution'}</span>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isLoading || (mode === 'img_2_img' && !refUpload.resourcePath)}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] text-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin" size={16} /> Submitting...</>
            ) : isPolling ? (
              <><Loader2 className="animate-spin" size={16} /> Generating...</>
            ) : (
              <><Sparkles size={16} /> Generate Image</>
            )}
          </button>
        </div>

        {/* Right: Preview */}
        <div className="w-full md:w-1/2 bg-[#e5e5f7] relative flex items-center justify-center p-6 overflow-hidden">
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
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="mt-4 w-full flex gap-2">
                   <button 
                     onClick={() => onSelect(generatedImage)}
                     className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-bold shadow-lg flex items-center justify-center gap-2 text-sm"
                   >
                     <Check size={16} /> Use This
                   </button>
                   <button 
                     onClick={handleDownloadImage}
                     className="px-3 bg-white hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-bold shadow-md border border-gray-200 flex items-center justify-center"
                     title="Download"
                   >
                     <Download size={16} />
                   </button>
                   <button 
                     onClick={() => clearImages()}
                     className="px-3 bg-white hover:bg-gray-100 text-gray-700 py-2 rounded-lg font-bold shadow-md border border-gray-200 text-sm"
                   >
                     Retry
                   </button>
                </div>
             </div>
           ) : (
             <div className="text-center text-gray-400 flex flex-col items-center relative z-20">
                {error && (
                  <div className="bg-red-50 text-red-500 p-3 rounded-xl text-sm max-w-xs border border-red-100 mb-4">
                    {error}
                  </div>
                )}
                <div className="w-20 h-20 bg-white/50 rounded-full flex items-center justify-center mb-3 shadow-inner">
                   {isLoading ? (
                     <Sparkles className="text-indigo-400 animate-pulse" size={36} />
                   ) : (
                     <ImageIcon className="text-gray-300" size={36} />
                   )}
                </div>
                <p className="text-sm font-medium">
                  {isPolling ? "AI is generating..." : isSubmitting ? "Submitting..." : "Your creation will appear here"}
                </p>
             </div>
           )}
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={refInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleRefImageSelect}
      />
    </div>
  );
};

export default ImageGenModal;
