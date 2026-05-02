// @ts-nocheck
import React, { useState, useEffect, useRef } from 'react';
import { Author } from '../types';
import { fetchGuests, createGuest, updateGuest, deleteGuest, GuestItem } from '../services/api';
import { X, Plus, Trash2, Edit2, UserPlus, User, Check, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface GuestLibraryProps {
  onClose: () => void;
  onAddToPost: (guest: Author) => void;
}

const GuestLibrary: React.FC<GuestLibraryProps> = ({ onClose, onAddToPost }) => {
  const [guests, setGuests] = useState<GuestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formImage, setFormImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      const data = await fetchGuests();
      setGuests(data);
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormTitle('');
    setFormImage(null);
    setEditingId(null);
    setIsCreating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    try {
      if (editingId) {
        await updateGuest(editingId, { name: formName, title: formTitle, image: formImage });
      } else {
        await createGuest({ name: formName, title: formTitle, image: formImage });
      }
      await loadGuests();
      resetForm();
    } catch (err) {
      console.error('Failed to save guest:', err);
      alert('保存嘉宾失败');
    }
  };

  const handleEdit = (guest: GuestItem) => {
    setEditingId(guest.id);
    setFormName(guest.name);
    setFormTitle(guest.title ?? '');
    setFormImage(guest.image);
    setIsCreating(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`确定要删除嘉宾「${name}」吗？`)) return;
    try {
      await deleteGuest(id);
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete guest:', err);
    }
  };

  const handleAddToPost = (guest: GuestItem) => {
    onAddToPost({
      id: Date.now().toString(),
      name: guest.name,
      title: guest.title ?? '',
      image: guest.image,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-800">嘉宾库</h2>
            <p className="text-xs text-gray-400">管理嘉宾信息，快速添加到海报中</p>
          </div>
          <div className="flex items-center gap-2">
            {!isCreating && (
              <button
                onClick={() => { resetForm(); setIsCreating(true); }}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
              >
                <Plus size={14} /> 新建嘉宾
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>
        </div>

        {/* Create/Edit Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 space-y-3">
                <div className="flex gap-3">
                  {/* Avatar upload */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-16 rounded-full bg-gray-200 shrink-0 cursor-pointer hover:bg-gray-300 transition-colors overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-indigo-400"
                  >
                    {formImage ? (
                      <img src={formImage} className="w-full h-full object-cover" alt="" />
                    ) : (
                      <Upload size={20} className="text-gray-400" />
                    )}
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={formName}
                      onChange={e => setFormName(e.target.value)}
                      placeholder="嘉宾姓名 *"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={formTitle}
                      onChange={e => setFormTitle(e.target.value)}
                      placeholder="头衔 / 介绍"
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <button onClick={resetForm} className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-200 rounded-lg transition-colors">
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!formName.trim()}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-40"
                  >
                    <Check size={14} /> {editingId ? '更新' : '保存'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Guest List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
          ) : guests.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-gray-400">
              <User size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">暂无嘉宾</p>
              <p className="text-xs">点击上方「新建嘉宾」添加</p>
            </div>
          ) : (
            guests.map(guest => (
              <div
                key={guest.id}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors group"
              >
                <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {guest.image ? (
                    <img src={guest.image} className="w-full h-full object-cover" alt={guest.name} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User size={18} />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-800 truncate">{guest.name}</p>
                  <p className="text-[11px] text-gray-400 truncate">{guest.title || '未设置头衔'}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleAddToPost(guest)}
                    className="p-1.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-600 rounded-lg transition-colors"
                    title="添加到海报"
                  >
                    <UserPlus size={14} />
                  </button>
                  <button
                    onClick={() => handleEdit(guest)}
                    className="p-1.5 hover:bg-gray-200 text-gray-400 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(guest.id, guest.name)}
                    className="p-1.5 hover:bg-red-100 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                    title="删除"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default GuestLibrary;
