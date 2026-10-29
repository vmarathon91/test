import React from 'react';
import { ActiveScreen, UserSession } from '../types';
import { Flame, PlusCircle, UserPlus, Trophy, BookOpen, Database, UserCheck, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentScreen: ActiveScreen;
  onNavigate: (screen: ActiveScreen) => void;
  currentUser: UserSession;
  onOpenUserModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenRulesModal: () => void;
  isSupabaseConfigured: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onNavigate,
  currentUser,
  onOpenUserModal,
  onOpenSupabaseModal,
  onOpenRulesModal,
  isSupabaseConfigured,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#090D16]/95 backdrop-blur-md border-b border-slate-800/80 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Zone 1: Brand Wordmark */}
          <div 
            onClick={() => onNavigate('directory')} 
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#EA3E18] to-[#FF6B35] flex items-center justify-center shadow-md shadow-orange-600/30 group-hover:scale-105 transition-transform">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-athletic text-2xl font-black tracking-wider uppercase text-white group-hover:text-orange-400 transition-colors flex items-center gap-1.5">
                MARATHON <span className="text-[#FF5722]">SQUAD</span>
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links (3 Main Screens + Rules) */}
          <nav className="hidden md:flex items-center gap-2 lg:gap-3">
            <button
              onClick={() => onNavigate('directory')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                currentScreen === 'directory'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Trophy className="w-4 h-4" />
              <span>Danh sách Đội đua</span>
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                currentScreen === 'create'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo nhóm mới</span>
            </button>

            <button
              onClick={() => onNavigate('join')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 ${
                currentScreen === 'join'
                  ? 'bg-orange-500/15 text-orange-400 border border-orange-500/30 shadow-inner'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Gia nhập nhóm</span>
            </button>

            <button
              onClick={onOpenRulesModal}
              className="px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="Xem thể lệ cơ cấu 18 VĐV"
            >
              <BookOpen className="w-4 h-4 text-orange-400" />
              <span className="hidden xl:inline">Thể lệ 18 VĐV</span>
            </button>
          </nav>

          {/* Zone 3: Actions & Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Supabase status indicator & config button */}
            <button
              onClick={onOpenSupabaseModal}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
                isSupabaseConfigured
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Cấu hình kết nối Supabase & Lấy SQL tạo bảng"
            >
              <Database className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">
                {isSupabaseConfigured ? 'Supabase Cloud' : 'Supabase SQL'}
              </span>
            </button>

            {/* Current user & Role badge */}
            <button
              onClick={onOpenUserModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
              title="Đổi tài khoản thử nghiệm"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-xs">
                <div className="font-semibold text-slate-200 leading-tight max-w-[120px] truncate">
                  {currentUser.name}
                </div>
                <div className="text-[11px] text-orange-400 font-mono-num flex items-center gap-1">
                  {currentUser.isCaptain ? (
                    <span className="flex items-center gap-0.5 text-amber-400">
                      <ShieldCheck className="w-3 h-3" /> Đội trưởng
                    </span>
                  ) : (
                    <span>VĐV</span>
                  )}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation tab strip */}
      <div className="md:hidden grid grid-cols-3 border-t border-slate-800/80 bg-[#070A11] px-2 py-1 text-center">
        <button
          onClick={() => onNavigate('directory')}
          className={`py-2 text-xs font-medium rounded flex flex-col items-center gap-1 ${
            currentScreen === 'directory' ? 'text-orange-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Danh sách</span>
        </button>
        <button
          onClick={() => onNavigate('create')}
          className={`py-2 text-xs font-medium rounded flex flex-col items-center gap-1 ${
            currentScreen === 'create' ? 'text-orange-400 font-bold' : 'text-slate-400'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tạo nhóm</span>
        </button>
        <button
          onClick={() => onNavigate('join')}
          className={`py-2 text-xs font-medium rounded flex flex-col items-center gap-1 ${
            currentScreen === 'join' ? 'text-orange-400 font-bold' : 'text-slate-400'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          <span>Gia nhập</span>
        </button>
      </div>
    </header>
  );
};
