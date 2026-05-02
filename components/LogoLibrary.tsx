import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import { LogoRow, getLogos, createLogo, updateLogo, deleteLogo, uploadFile } from '../services/storageService';

interface LogoLibraryProps {
  onSelectLogo: (url: string) => void;
}

const LogoLibrary: React.FC<LogoLibraryProps> = ({ onSelectLogo }) => {
  const [logos, setLogos] = useState<LogoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadLogos();
  }, []);

  const loadLogos = async () => {
    try {
      const data = await getLogos();
      setLogos(data);
    } catch (err) {
      console.error('Failed to load logos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setUploading(true);
      const url = await uploadFile(file, 'logos');
      const name = file.name.replace(/\.[^.]+$/, '');
      const logo = await createLogo(name, url);
      setLogos(prev => [logo, ...prev]);
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRename = async (id: string) => {
    try {
      await updateLogo(id, { name: editName });
      setLogos(prev => prev.map(l => l.id === id ? { ...l, name: editName } : l));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update logo:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLogo(id);
      setLogos(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete logo:', err);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Logo Library</label>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="animate-spin w-3.5 h-3.5 border border-indigo-500 border-t-transparent rounded-full"></div>
          ) : (
            <Plus size={14} />
          )}
        </button>
      </div>

      {/* Logo grid */}
      {loading ? (
        <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
      ) : logos.length === 0 ? (
        <div className="text-center py-4 text-xs text-gray-400">
          <p>No saved logos</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-indigo-500 hover:text-indigo-600 font-medium"
          >
            Upload first logo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto pr-1">
          {logos.map((logo) => (
            <div key={logo.id} className="relative group">
              <div
                className="aspect-square bg-gray-50 border border-gray-100 rounded-lg p-2 flex items-center justify-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-all"
                onClick={() => onSelectLogo(logo.url)}
              >
                <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain" />
              </div>
              {/* Actions overlay */}
              <div className="absolute top-0.5 right-0.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingId(logo.id); setEditName(logo.name); }} className="bg-white shadow-sm border border-gray-200 rounded p-0.5 text-gray-400 hover:text-indigo-500">
                  <Edit2 size={9} />
                </button>
                <button onClick={() => handleDelete(logo.id)} className="bg-white shadow-sm border border-gray-200 rounded p-0.5 text-gray-400 hover:text-red-500">
                  <Trash2 size={9} />
                </button>
              </div>
              {/* Inline rename */}
              {editingId === logo.id && (
                <div className="absolute inset-0 bg-white/95 rounded-lg flex flex-col items-center justify-center p-1.5 z-10">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full text-[9px] border border-gray-200 rounded px-1.5 py-0.5 outline-none focus:border-indigo-400 mb-1"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => handleRename(logo.id)} className="text-green-500"><Check size={11} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={11} /></button>
                  </div>
                </div>
              )}
              {/* Name */}
              <p className="text-[9px] text-gray-500 text-center mt-0.5 truncate px-1">{logo.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleUpload}
      />
    </div>
  );
};

export default LogoLibrary;
