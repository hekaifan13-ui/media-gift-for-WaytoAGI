import React, { useState, useEffect, useRef, DragEvent } from 'react';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, User, Upload, UserPlus } from 'lucide-react';
import { GuestRow, getGuests, createGuest, updateGuest, deleteGuest, uploadFile } from '../services/storageService';

interface GuestLibraryProps {
  onBack: () => void;
  onSelectGuest?: (guest: { name: string; title: string; image: string | null }) => void;
}

const GuestLibrary: React.FC<GuestLibraryProps> = ({ onBack, onSelectGuest }) => {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAvatarFile, setNewAvatarFile] = useState<File | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const [draggingOver, setDraggingOver] = useState(false);
  const [draggingOverId, setDraggingOverId] = useState<string | null>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [avatarTargetId, setAvatarTargetId] = useState<string | null>(null);

  useEffect(() => { loadGuests(); }, []);

  const loadGuests = async () => {
    try {
      const data = await getGuests();
      setGuests(data);
    } catch (err) {
      console.error('Failed to load guests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    try {
      let avatarUrl: string | undefined;
      if (newAvatarFile) {
        avatarUrl = await uploadFile(newAvatarFile, 'avatars');
      }
      const guest = await createGuest(newName.trim(), newTitle.trim(), avatarUrl);
      setGuests(prev => [{ ...guest, avatar_url: avatarUrl || null }, ...prev]);
      setNewName('');
      setNewTitle('');
      setNewAvatarFile(null);
      setNewAvatarPreview(null);
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add guest:', err);
    }
  };

  const handleNewAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewAvatarFile(file);
    const url = URL.createObjectURL(file);
    setNewAvatarPreview(url);
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateGuest(id, { name: editName, title: editTitle });
      setGuests(prev => prev.map(g => g.id === id ? { ...g, name: editName, title: editTitle } : g));
      setEditingId(null);
    } catch (err) {
      console.error('Failed to update guest:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this guest?')) return;
    try {
      await deleteGuest(id);
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete guest:', err);
    }
  };

  const handleAvatarUpload = async (file: File, guestId: string) => {
    try {
      setUploadingFor(guestId);
      const url = await uploadFile(file, 'avatars');
      await updateGuest(guestId, { avatar_url: url });
      setGuests(prev => prev.map(g => g.id === guestId ? { ...g, avatar_url: url } : g));
    } catch (err) {
      console.error('Failed to upload avatar:', err);
    } finally {
      setUploadingFor(null);
    }
  };

  // Drag-and-drop: create new guest from dropped image
  const handlePageDrop = async (e: DragEvent) => {
    e.preventDefault();
    setDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    
    try {
      setUploadingFor('new');
      const url = await uploadFile(file, 'avatars');
      const name = file.name.replace(/\.[^.]+$/, '').slice(0, 20) || 'New Guest';
      const guest = await createGuest(name, '');
      await updateGuest(guest.id, { avatar_url: url });
      setGuests(prev => [{ ...guest, avatar_url: url }, ...prev]);
    } catch (err) {
      console.error('Failed to create guest from drop:', err);
    } finally {
      setUploadingFor(null);
    }
  };

  // Drag-and-drop on existing guest card to replace avatar
  const handleGuestDrop = async (e: DragEvent, guestId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingOverId(null);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    await handleAvatarUpload(file, guestId);
  };

  const handleSelect = (guest: GuestRow) => {
    if (onSelectGuest) {
      onSelectGuest({ name: guest.name, title: guest.title, image: guest.avatar_url });
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
            <p className="text-lg font-bold text-indigo-700">Drop image to create new guest</p>
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
              <h1 className="text-2xl font-black text-gray-900">Guest Library</h1>
              <p className="text-sm text-gray-500">Manage guests. Drag images here to add new guests.</p>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-200"
          >
            <UserPlus size={16} />
            Add Guest
          </button>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="bg-white rounded-xl p-5 mb-6 border border-gray-200 shadow-sm">
            <div className="flex gap-4 items-start">
              {/* Avatar upload */}
              <div className="shrink-0">
                <label className="block w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 hover:border-indigo-400 cursor-pointer overflow-hidden transition-colors relative">
                  {newAvatarPreview ? (
                    <img src={newAvatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                      <Upload size={18} />
                      <span className="text-[9px] mt-0.5">Avatar</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleNewAvatarSelect}
                  />
                </label>
              </div>
              <div className="flex-1 space-y-2">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Guest name"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                />
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Title / Description"
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
                />
              </div>
              <div className="flex gap-2 shrink-0 pt-2">
                <button onClick={handleAdd} className="px-5 py-2.5 bg-indigo-500 text-white rounded-lg font-bold text-sm hover:bg-indigo-600">Save</button>
                <button onClick={() => { setShowAdd(false); setNewAvatarFile(null); setNewAvatarPreview(null); }} className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm font-medium">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* Guest Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full mr-3"></div>
            Loading...
          </div>
        ) : guests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
            <User size={48} className="mb-3 opacity-30" />
            <p className="text-lg font-medium mb-1">No guests yet</p>
            <p className="text-sm">Drag images here or click "Add Guest" to start</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {guests.map((guest) => (
              <div
                key={guest.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-lg transition-all group ${draggingOverId === guest.id ? 'border-indigo-400 ring-2 ring-indigo-200 scale-[1.02]' : 'border-gray-200 hover:border-indigo-200'}`}
                onDragOver={(e) => { e.preventDefault(); setDraggingOverId(guest.id); }}
                onDragLeave={() => setDraggingOverId(null)}
                onDrop={(e) => handleGuestDrop(e, guest.id)}
              >
                {/* Avatar */}
                <div
                  className="aspect-square bg-gray-100 relative overflow-hidden cursor-pointer"
                  onClick={() => { setAvatarTargetId(guest.id); avatarInputRef.current?.click(); }}
                >
                  {uploadingFor === guest.id ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    </div>
                  ) : guest.avatar_url ? (
                    <img src={guest.avatar_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <User size={48} />
                      <span className="text-[10px] mt-1 font-medium">Drop or click</span>
                    </div>
                  )}
                  {/* Drag hint overlay */}
                  {draggingOverId === guest.id && (
                    <div className="absolute inset-0 bg-indigo-500/20 flex items-center justify-center">
                      <Upload size={32} className="text-indigo-600" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {editingId === guest.id ? (
                    <div className="space-y-2">
                      <input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-sm outline-none focus:border-indigo-400"
                      />
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-md px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleUpdate(guest.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                        <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h3 className="font-bold text-gray-900 text-sm truncate">{guest.name || 'Unnamed'}</h3>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{guest.title || 'No title'}</p>
                      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100">
                        {onSelectGuest && (
                          <button
                            onClick={() => handleSelect(guest)}
                            className="flex-1 text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 rounded-lg transition-colors"
                          >
                            Use in Project
                          </button>
                        )}
                        <button onClick={() => { setEditingId(guest.id); setEditName(guest.name); setEditTitle(guest.title); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-indigo-600 transition-colors">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(guest.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Hidden file input for avatar upload */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file && avatarTargetId) handleAvatarUpload(file, avatarTargetId);
          if (avatarInputRef.current) avatarInputRef.current.value = '';
        }}
      />
    </div>
  );
};

export default GuestLibrary;
