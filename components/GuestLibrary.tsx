import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit2, Check, X, User, Upload } from 'lucide-react';
import { GuestRow, getGuests, createGuest, updateGuest, deleteGuest, uploadFile } from '../services/storageService';
import { Author } from '../types';

interface GuestLibraryProps {
  onSelectGuest: (guest: { name: string; title: string; image: string | null }) => void;
}

const GuestLibrary: React.FC<GuestLibraryProps> = ({ onSelectGuest }) => {
  const [guests, setGuests] = useState<GuestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  useEffect(() => {
    loadGuests();
  }, []);

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
      const guest = await createGuest(newName.trim(), newTitle.trim());
      setGuests(prev => [guest, ...prev]);
      setNewName('');
      setNewTitle('');
      setShowAdd(false);
    } catch (err) {
      console.error('Failed to add guest:', err);
    }
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
    try {
      await deleteGuest(id);
      setGuests(prev => prev.filter(g => g.id !== id));
    } catch (err) {
      console.error('Failed to delete guest:', err);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>, guestId: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  const handleSelect = (guest: GuestRow) => {
    onSelectGuest({
      name: guest.name,
      title: guest.title,
      image: guest.avatar_url,
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Guest Library</label>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Add new guest */}
      {showAdd && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-2 border border-gray-100">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name"
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
          />
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Title / Description"
            className="w-full bg-white border border-gray-200 rounded-md px-3 py-1.5 text-xs outline-none focus:border-indigo-400"
          />
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 bg-indigo-500 text-white rounded-md py-1.5 text-xs font-bold hover:bg-indigo-600 transition-colors">
              Add
            </button>
            <button onClick={() => setShowAdd(false)} className="px-3 text-gray-400 hover:text-gray-600 text-xs">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Guest list */}
      {loading ? (
        <div className="text-center py-4 text-xs text-gray-400">Loading...</div>
      ) : guests.length === 0 ? (
        <div className="text-center py-4 text-xs text-gray-400">No saved guests</div>
      ) : (
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {guests.map((guest) => (
            <div key={guest.id} className="flex items-center gap-2 bg-gray-50 hover:bg-indigo-50 rounded-lg p-2 group transition-colors">
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden shrink-0 cursor-pointer relative"
                onClick={() => {
                  setUploadingFor(guest.id);
                  avatarInputRef.current?.click();
                }}
              >
                {uploadingFor === guest.id ? (
                  <div className="w-full h-full flex items-center justify-center bg-gray-300">
                    <div className="animate-spin w-3 h-3 border border-indigo-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : guest.avatar_url ? (
                  <img src={guest.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <User size={14} />
                  </div>
                )}
              </div>

              {/* Info */}
              {editingId === guest.id ? (
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs outline-none focus:border-indigo-400"
                  />
                  <input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] outline-none focus:border-indigo-400"
                  />
                  <div className="flex gap-1">
                    <button onClick={() => handleUpdate(guest.id)} className="text-green-500 hover:text-green-700"><Check size={12} /></button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600"><X size={12} /></button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => handleSelect(guest)}>
                  <p className="text-xs font-bold text-gray-700 truncate">{guest.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{guest.title}</p>
                </div>
              )}

              {/* Actions */}
              {editingId !== guest.id && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => { setEditingId(guest.id); setEditName(guest.name); setEditTitle(guest.title); }} className="text-gray-400 hover:text-indigo-500 p-0.5">
                    <Edit2 size={11} />
                  </button>
                  <button onClick={() => handleDelete(guest.id)} className="text-gray-400 hover:text-red-500 p-0.5">
                    <Trash2 size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (uploadingFor) handleAvatarUpload(e, uploadingFor);
        }}
      />
    </div>
  );
};

export default GuestLibrary;
