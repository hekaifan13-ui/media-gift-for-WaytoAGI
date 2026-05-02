// @ts-nocheck
import React, { useState } from 'react';
import { generatePostcardMessage } from '../services/geminiService';
import { Wand2, Loader2, X } from 'lucide-react';

interface AIGeneratorProps {
  onSelect: (text: string) => void;
  onClose: () => void;
  recipient: string;
  location: string;
}

const AIGenerator: React.FC<AIGeneratorProps> = ({ onSelect, onClose, recipient, location }) => {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState<'casual' | 'funny' | 'romantic' | 'poetic'>('casual');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!topic) return;
    setIsGenerating(true);
    const text = await generatePostcardMessage(topic, tone, recipient, location);
    setResult(text);
    setIsGenerating(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2 text-purple-800 font-semibold">
            <Wand2 size={20} />
            <span>Magic Writer</span>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What's happening?</label>
            <input
              type="text"
              className="w-full border rounded-lg p-2 focus:ring-2 focus:ring-purple-200 outline-none"
              placeholder="e.g. Saw a beautiful sunset, ate amazing pasta..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <div className="flex gap-2">
              {(['casual', 'funny', 'romantic', 'poetic'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                    tone === t ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {result && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mt-2">
              <p className="text-gray-800 text-sm italic">"{result}"</p>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!result ? (
              <button
                onClick={handleGenerate}
                disabled={!topic || isGenerating}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 transition-colors"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                Generate
              </button>
            ) : (
              <>
                 <button
                  onClick={handleGenerate}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
                <button
                  onClick={() => onSelect(result)}
                  className="w-1/2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium transition-colors"
                >
                  Use This
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;