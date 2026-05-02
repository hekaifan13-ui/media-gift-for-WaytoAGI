import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Image as ImageIcon, Upload } from 'lucide-react';
import { LogoRow, getLogos, createLogo, updateLogo, deleteLogo, uploadFile } from '../services/storageService';

interface LogoLibraryProps {
  onBack: () => void;
  onSelectLogo?: (url: string) => void;
}

const LogoLibrary: React.FC<LogoLibraryProps> = ({ onBack, onSelectLogo }) => {
  const [logos, setLogos] = useState<LogoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [draggingOver, setDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadLogos(); }, []);

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

  const handleUploadFile = async (file: File) => {
    try {
      setUploading(true);
      const url = await uploadFile(file, 'logos');
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 30);
      const logo = await createLogo(name, url);
      setLogos(prev => [logo, ...prev]);
    } catch (err) {
      console.error('Failed to upload logo:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePageDrop = (e: DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleUploadFile(file);
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
    if (!confirm('Delete this logo?')) return;
    try {
      await deleteLogo(id);
      setLogos(prev => prev.filter(l => l.id !== id));
    } catch (err) {
      console.error('Failed to delete logo:', err);
    }
  };

  return (
    <div
      className="w-full h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-auto"
      onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDraggingOver(false); }}
      onDrop={handlePageDrop}
    >
      {/* Drag overlay */}
      {draggingOver && (
        <div className="fixed inset-0 bg-indigo-500/10 border-4 border-dashed border-indigo-400 z-50 flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md rounded-2xl px-8 py-6 shadow-xl">
            <Upload size={40} className="mx-auto mb-2 text-indigo-500" />
            <p className="text-lg font-bold text-indigo-700">Drop image to upload logo</p>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-white rounded-xl transition-colors shadow-sm border border-gray-200">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900">Logo Library</h1>
              <p className="text-sm text-gray-500">Manage logos. Drag images here to upload.</p>
            </div>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
          >
            {uploading ? (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <Plus size={16} />
            )}
            Upload Logo
          </button>
        </div>

        {/* Logo Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mr-3"></div>
            Loading...
          </div>
        ) : logos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <ImageIcon size={48} className="mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">No logos yet</p>
            <p className="text-sm">Drag logo images here or click "Upload Logo"</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {logos.map((logo) => (
              <div
                key={logo.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-lg hover:border-indigo-200 transition-all group"
              >
                {/* Logo image */}
                <div
                  className="aspect-square bg-gray-50 p-6 flex items-center justify-center cursor-pointer relative"
                  onClick={() => onSelectLogo?.(logo.url)}
                >
                  <img src={logo.url} alt={logo.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform" />
                  {onSelectLogo && (
                    <div className="absolute inset-0 bg-indigo-500/0 group-hover:bg-indigo-500/5 transition-colors flex items-center justify-center">
                      <span className="bg-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                        Use in Project
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 border-t border-gray-100">
                  {editingId === logo.id ? (
                    <div className="flex items-center gap-2">
                      <input
                        autoFocus
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                        onKeyDown={(e) => { if (e.key === 'Enter') handleRename(logo.id); }}
                      />
                      <button onClick={() => handleRename(logo.id)} className="text-green-600"><Check size={16} /></button>
                      <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-gray-900 truncate flex-1">{logo.name}</h3>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                        <button onClick={() => { setEditingId(logo.id); setEditName(logo.name); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(logo.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileInput}
      />
    </div>
  );
};

export default LogoLibrary;
