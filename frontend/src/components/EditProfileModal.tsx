import { useState, useEffect } from 'react';
import { useSession } from '@/hooks/useSession';
import { X, Check, Loader2, Sparkles, Image as ImageIcon, RotateCcw } from 'lucide-react';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  {
    name: 'Cosmic Bot',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=LuckyBot&backgroundColor=b6e3f4',
  },
  {
    name: 'Cosmic Otter',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=CosmicOtter302&backgroundColor=d1d4f9',
  },
  {
    name: 'Sunny Lorelei',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=sunny_vibes&backgroundColor=ffd5dc',
  },
  {
    name: 'Adventurer',
    url: 'https://api.dicebear.com/7.x/adventurer/svg?seed=wholesome_charlie&backgroundColor=c0aede',
  },
  {
    name: 'Caesar',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=caesar_enjoyer&backgroundColor=b6e3f4',
  },
  {
    name: 'Zen Capybara',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=ChillCapybara520&backgroundColor=b6e3f4',
  },
  {
    name: 'Spicy Raccoon',
    url: 'https://api.dicebear.com/7.x/bottts/svg?seed=SpicyRaccoon993&backgroundColor=ffd5dc',
  },
  {
    name: 'Vintage Doge',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=vintage_doge&backgroundColor=ffdfbf',
  },
  {
    name: 'Meme Sommelier',
    url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=meme_sommelier&backgroundColor=b6e3f4',
  },
  {
    name: 'Fun Emoji',
    url: 'https://api.dicebear.com/7.x/fun-emoji/svg?seed=skibidi_philosopher&backgroundColor=ffdfbf',
  },
];

export default function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { session, profile, updateProfile } = useSession();

  const [nickname, setNickname] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const initialNickname = profile?.nickname || session?.nickname || '';
      const initialBio = profile?.bio || session?.bio || '';
      const initialAvatar = profile?.avatar_url || session?.avatar_url || null;

      setNickname(initialNickname);
      setBio(initialBio);
      setAvatarUrl(initialAvatar);
      setCustomUrl(initialAvatar && !AVATAR_PRESETS.some(p => p.url === initialAvatar) ? initialAvatar : '');
      setShowCustomInput(Boolean(initialAvatar && !AVATAR_PRESETS.some(p => p.url === initialAvatar)));
      setError(null);
    }
  }, [isOpen, session, profile]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) {
      setError('Nickname cannot be empty.');
      return;
    }
    if (nickname.trim().length < 2) {
      setError('Nickname must be at least 2 characters.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await updateProfile({
        nickname: nickname.trim(),
        bio: bio.trim(),
        avatar_url: avatarUrl || undefined,
      });
      onClose();
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Failed to update profile';
      setError(detail);
    } finally {
      setIsSaving(false);
    }
  };

  const displayName = nickname || session?.username || 'You';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-rose-50/60">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#fe3c72]/10 text-[#fe3c72]">
              <Sparkles size={18} />
            </span>
            <h3 className="font-extrabold text-lg text-slate-900">Edit Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200/60 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Live Avatar Preview */}
          <div className="flex flex-col items-center justify-center gap-3">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md bg-[#fe3c72] flex items-center justify-center text-white font-black text-3xl">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarUrl(null)}
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="absolute bottom-0 right-0 p-1.5 bg-slate-800/80 hover:bg-slate-900 text-white rounded-full shadow-xs text-xs"
                  title="Remove avatar (use initials)"
                >
                  <RotateCcw size={12} />
                </button>
              )}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {avatarUrl ? 'Avatar selected' : 'Initial avatar active'}
            </span>
          </div>

          {/* Avatar Preset Picker */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Choose an Avatar
              </label>
              <button
                type="button"
                onClick={() => setShowCustomInput(!showCustomInput)}
                className="text-xs font-bold text-[#fe3c72] hover:underline flex items-center gap-1"
              >
                <ImageIcon size={13} />
                <span>{showCustomInput ? 'Hide URL input' : 'Custom Image URL'}</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-2.5 sm:gap-3">
              {AVATAR_PRESETS.map((preset) => {
                const isSelected = avatarUrl === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setAvatarUrl(preset.url);
                      setError(null);
                    }}
                    className={`relative rounded-2xl p-1 border-2 transition-all group aspect-square flex items-center justify-center overflow-hidden ${
                      isSelected
                        ? 'border-[#fe3c72] bg-rose-50 shadow-sm scale-105'
                        : 'border-slate-100 bg-slate-50 hover:border-slate-300 hover:scale-102'
                    }`}
                    title={preset.name}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="w-full h-full object-contain rounded-xl"
                      loading="lazy"
                    />
                    {isSelected && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-[#fe3c72] text-white rounded-full flex items-center justify-center shadow-xs">
                        <Check size={10} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom URL Input Accordion */}
            {showCustomInput && (
              <div className="mt-3 p-3 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Paste Direct Image / Avatar URL:
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://images.example.com/my-avatar.png"
                    className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-[#fe3c72]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrl.trim()) {
                        setAvatarUrl(customUrl.trim());
                      }
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-900 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nickname Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
              Display Nickname
            </label>
            <input
              type="text"
              value={nickname}
              maxLength={30}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. MemeLord99"
              className="w-full px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:border-[#fe3c72] focus:ring-2 focus:ring-rose-100 transition-all font-semibold text-slate-800"
              required
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Between 2 and 30 characters
            </span>
          </div>

          {/* Bio Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Bio / Description
              </label>
              <span className={`text-[11px] font-medium ${
                bio.length > 280 ? 'text-rose-500 font-bold' : 'text-slate-400'
              }`}>
                {bio.length}/300
              </span>
            </div>
            <textarea
              value={bio}
              maxLength={300}
              rows={3}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell others what kind of memes make you laugh, your humor quirks, or favorite jokes..."
              className="w-full px-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:outline-none focus:border-[#fe3c72] focus:ring-2 focus:ring-rose-100 transition-all text-slate-800 resize-none leading-relaxed"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check size={14} strokeWidth={2.5} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
