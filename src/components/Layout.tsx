import React, { useState, useEffect } from 'react';
import { LayoutDashboard, BookOpen, Wallet, BrainCircuit, Target, LogOut, Menu, X, Upload, Check, AlertCircle, Library, Newspaper } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  const { user, logout, updateProfile, isUsernameUnique } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User';
  const photoURL = user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${displayName}&background=3b82f6&color=fff`;
  const appLogoURL = user?.user_metadata?.app_logo_url || '/api/attachments/a7122851-4034-4531-9025-667793656783';

  const [profileData, setProfileData] = useState({
    displayName: displayName,
    photoURL: photoURL,
    appLogoURL: appLogoURL
  });
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileData({
        displayName: user.user_metadata?.display_name || user.email?.split('@')[0] || '',
        photoURL: user.user_metadata?.avatar_url || '',
        appLogoURL: user.user_metadata?.app_logo_url || ''
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError(null);

    if (!profileData.displayName.trim()) {
      setProfileError('Username is required');
      return;
    }

    // Only check uniqueness if the name changed
    if (profileData.displayName !== displayName) {
      const isUnique = await isUsernameUnique(profileData.displayName);
      if (!isUnique) {
        setProfileError('Username is already taken');
        return;
      }
    }

    try {
      await updateProfile(profileData);
      setIsProfileModalOpen(false);
    } catch (error) {
      setProfileError('Failed to update profile');
    }
  };

  const handleFileUpload = (file: File, type: 'avatar' | 'logo' = 'avatar') => {
    if (!file.type.startsWith('image/')) {
      setProfileError('Please upload an image file');
      return;
    }

    if (type === 'avatar') setIsUploading(true);
    else setIsUploadingLogo(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'avatar') {
        setProfileData({ ...profileData, photoURL: reader.result as string });
        setIsUploading(false);
      } else {
        setProfileData({ ...profileData, appLogoURL: reader.result as string });
        setIsUploadingLogo(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Accounts', icon: Wallet },
    { id: 'journal', label: 'Journal', icon: BookOpen },
    { id: 'strategy', label: 'Strategy', icon: Target },
    { id: 'ai', label: 'AI Insights', icon: BrainCircuit },
    { id: 'news', label: 'Market Intelligence', icon: Newspaper },
    { id: 'reference', label: 'Reference', icon: Library },
  ];

  const SidebarContent = () => {
    const [hoveredItem, setHoveredItem] = useState<{ label: string; top: number } | null>(null);

    return (
      <div className="flex flex-col h-full overflow-visible">
        {/* Logo - Sticky at top */}
        <div className="flex flex-col items-center px-2 py-8 flex-shrink-0 sticky top-0 bg-slate-950/80 backdrop-blur-3xl z-30 border-b border-white/5">
          <div className="w-16 h-16 rounded-[28px] overflow-hidden shadow-2xl shadow-blue-500/30 border border-white/20 hover:scale-110 hover:rotate-3 transition-all duration-700 bg-slate-900 relative group cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-transparent to-purple-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="absolute inset-0 bg-blue-500/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <img 
              src={appLogoURL} 
              alt="Logo" 
              className="w-full h-full object-cover relative z-10 p-1"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/trading/200/200';
              }}
            />
          </div>
        </div>

        {/* Navigation - Scrollable area */}
        <div className="flex-1 overflow-y-auto no-scrollbar py-6 overflow-x-visible">
          <nav className="flex flex-col items-center space-y-8 overflow-visible">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setView(item.id);
                  setIsSidebarOpen(false);
                }}
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setHoveredItem({ label: item.label, top: rect.top + rect.height / 2 });
                }}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  "w-14 h-14 flex items-center justify-center rounded-2xl transition-all duration-500 group relative",
                  currentView === item.id 
                    ? "text-white scale-110" 
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                )}
              >
                {currentView === item.id && (
                  <motion.div
                    layoutId="nav-active-bg"
                    className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-400 rounded-2xl -z-10 shadow-[0_0_25px_rgba(59,130,246,0.6)]"
                    transition={{ type: "spring", bounce: 0.25, duration: 0.6 }}
                  />
                )}
                
                <item.icon 
                  size={22} 
                  strokeWidth={currentView === item.id ? 2.5 : 2} 
                  className={cn(
                    "transition-all duration-500 relative z-10",
                    currentView === item.id ? "scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]" : "group-hover:scale-125 group-hover:rotate-6"
                  )} 
                />
              </button>
            ))}
          </nav>
        </div>

        {/* Fixed Tooltip Overlay */}
        {hoveredItem && (
          <div 
            className="fixed left-28 px-5 py-3 bg-slate-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.25em] z-[100] whitespace-nowrap shadow-[0_10px_40px_rgba(0,0,0,0.5)] text-blue-400 border-l-4 border-l-blue-500 pointer-events-none"
            style={{ 
              top: hoveredItem.top,
              transform: 'translateY(-50%)'
            }}
          >
            {hoveredItem.label}
            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rotate-45" />
          </div>
        )}

        {/* Profile - Sticky at bottom */}
        <div className="pt-8 border-t border-slate-800/50 flex flex-col items-center space-y-8 flex-shrink-0 pb-8 sticky bottom-0 bg-slate-950/80 backdrop-blur-3xl z-30">
          <div 
            className="flex flex-col items-center gap-3 group cursor-pointer"
            onClick={() => {
              setProfileData({
                displayName: displayName,
                photoURL: photoURL,
                appLogoURL: appLogoURL
              });
              setIsProfileModalOpen(true);
            }}
          >
            <div className="relative p-0.5 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-700 group-hover:from-blue-500 group-hover:to-purple-500 transition-all duration-500">
              <img 
                src={photoURL} 
                alt={displayName} 
                className="w-10 h-10 rounded-[10px] object-cover shadow-2xl group-hover:scale-105 transition-transform duration-500"
                referrerPolicy="no-referrer"
              />
              <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-950 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
            </div>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest group-hover:text-blue-400 transition-colors truncate max-w-[70px] text-center">
              {displayName}
            </span>
          </div>

          <button
            onClick={logout}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoveredItem({ label: 'Logout', top: rect.top + rect.height / 2 });
            }}
            onMouseLeave={() => setHoveredItem(null)}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all group relative border border-transparent hover:border-red-500/20"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 backdrop-blur-xl sticky top-0 z-[100] shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-800 shadow-lg shadow-blue-500/10">
            <img 
              src={appLogoURL} 
              alt="Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="p-3 -mr-2 text-slate-400 hover:text-white transition-all active:scale-95 bg-slate-900/50 rounded-xl border border-slate-800"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* Sidebar (Desktop) */}
      <aside 
        className="hidden md:flex border-r border-white/10 flex-col sticky top-0 h-screen bg-slate-950/80 backdrop-blur-3xl w-28 z-20 overflow-visible shadow-[10px_0_50px_rgba(0,0,0,0.5)]"
      >
        <SidebarContent />
      </aside>

      {/* Sidebar (Mobile Overlay) */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-slate-950 border-r border-slate-800 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Profile Editing Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 max-w-md w-full shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black uppercase tracking-widest text-white">Edit Profile</h3>
              <button onClick={() => setIsProfileModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            {profileError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={18} />
                <p>{profileError}</p>
              </div>
            )}
            
            <form onSubmit={handleProfileUpdate} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Username</label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={e => setProfileData({ ...profileData, displayName: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-white"
                  placeholder="Enter username"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">Profile Picture</label>
                  <div 
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    onPaste={(e) => {
                      const item = e.clipboardData.items[0];
                      if (item?.type.indexOf('image') !== -1) {
                        const file = item.getAsFile();
                        if (file) handleFileUpload(file, 'avatar');
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.focus()}
                    tabIndex={0}
                    className="relative group cursor-pointer outline-none"
                  >
                    <div className="w-full h-32 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-2 hover:border-blue-500/50 transition-all overflow-hidden focus:border-blue-500/50">
                      {profileData.photoURL ? (
                        <img src={profileData.photoURL} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      ) : (
                        <Upload size={24} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest text-center px-2">
                          {isUploading ? 'Uploading...' : 'Avatar'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'avatar')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-500 uppercase font-black tracking-widest ml-1">App Logo</label>
                  <div 
                    onDragOver={onDragOver}
                    onDrop={(e) => {
                      e.preventDefault();
                      const file = e.dataTransfer.files[0];
                      if (file) handleFileUpload(file, 'logo');
                    }}
                    onPaste={(e) => {
                      const item = e.clipboardData.items[0];
                      if (item?.type.indexOf('image') !== -1) {
                        const file = item.getAsFile();
                        if (file) handleFileUpload(file, 'logo');
                      }
                    }}
                    onMouseEnter={(e) => e.currentTarget.focus()}
                    tabIndex={0}
                    className="relative group cursor-pointer outline-none"
                  >
                    <div className="w-full h-32 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex flex-col items-center justify-center space-y-2 hover:border-blue-500/50 transition-all overflow-hidden focus:border-blue-500/50">
                      {profileData.appLogoURL ? (
                        <img src={profileData.appLogoURL} alt="Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-30 transition-opacity" />
                      ) : (
                        <Upload size={24} className="text-zinc-600 group-hover:text-blue-500 transition-colors" />
                      )}
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-[8px] text-zinc-500 uppercase font-black tracking-widest text-center px-2">
                          {isUploadingLogo ? 'Uploading...' : 'App Logo'}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0], 'logo')}
                          className="absolute inset-0 opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="flex-1 h-14 bg-zinc-800 text-white font-bold rounded-xl hover:bg-zinc-700 transition-all flex items-center justify-center shadow-lg"
                  title="Cancel"
                >
                  <X size={24} />
                </button>
                <button
                  type="submit"
                  className="flex-1 h-14 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center"
                  title="Save Profile"
                >
                  <Check size={24} />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden relative z-10">
        <div className="w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
