import React from 'react';
import { UserRole, SchoolSettings } from '../types';
import { ShieldCheck, User, Settings, Table, Lock, Unlock, Menu, ShieldAlert, Sparkles, GraduationCap, RefreshCw } from 'lucide-react';

interface NavbarProps {
  role: UserRole;
  settings: SchoolSettings;
  onToggleRole: () => void;
  onOpenSheetsModal: () => void;
  onOpenSettingsModal: () => void;
  onToggleMobileSidebar: () => void;
  urgentAlertCount: number;
  onReloadData?: () => void;
  isReloading?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  role,
  settings,
  onToggleRole,
  onOpenSheetsModal,
  onOpenSettingsModal,
  onToggleMobileSidebar,
  urgentAlertCount,
  onReloadData,
  isReloading = false
}) => {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(new Date());

  return (
    <header className="bg-emerald-950 text-white border-b border-emerald-800/80 sticky top-0 z-40 shadow-md no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900 transition cursor-pointer"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-900 border border-amber-400/80 flex items-center justify-center shadow-md">
                <span className="font-extrabold text-amber-300 text-sm tracking-wider">SI</span>
                <span className="font-black text-white text-xs">TAMU</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                    <span>SI TAMU</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/40">
                      v2.0 Pro
                    </span>
                  </h1>
                </div>
                <p className="text-[11px] text-emerald-300 font-medium hidden sm:block truncate max-w-xs">
                  {settings.schoolName}
                </p>
              </div>
            </div>
          </div>

          {/* Right: Date, Refresh Data, Sheets Sync, Role Switcher, Settings */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Live date badge */}
            <div className="hidden md:flex items-center text-xs text-emerald-300 bg-emerald-900/60 px-3 py-1.5 rounded-lg border border-emerald-800">
              <span>{currentDate}</span>
            </div>

            {/* Quick Fast Data Refresh Button */}
            {onReloadData && (
              <button
                onClick={onReloadData}
                disabled={isReloading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-lg text-xs font-semibold border border-emerald-700/60 transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Muat Ulang & Sinkronkan Data Cepat"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isReloading ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isReloading ? 'Memuat...' : 'Muat Ulang'}</span>
              </button>
            )}

            {/* Google Sheets Sync Button */}
            {role === 'staff' && (
              <button
                onClick={onOpenSheetsModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 hover:text-white rounded-lg text-xs font-semibold border border-emerald-700/60 transition shadow-sm cursor-pointer"
                title="Integrasi Database Google Spreadsheet"
              >
                <Table className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Google Sheets</span>
              </button>
            )}

            {/* Role Badge & Switcher */}
            <button
              onClick={onToggleRole}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer border ${
                role === 'staff'
                  ? 'bg-emerald-800/90 text-emerald-100 hover:bg-emerald-700 border-amber-400/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-emerald-950 border-amber-400'
              }`}
            >
              {role === 'staff' ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-amber-300" />
                  <span>Mode Guru / Petugas</span>
                  <span className="text-[10px] opacity-75 font-normal ml-0.5 hidden sm:inline">(Keluar)</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-emerald-950" />
                  <span>Mode Publik (Siswa/Ortu)</span>
                  <span className="text-[10px] font-extrabold uppercase bg-emerald-950 text-amber-300 px-1.5 py-0.5 rounded ml-1">
                    Login Guru
                  </span>
                </>
              )}
            </button>

            {/* Settings Button */}
            {role === 'staff' && (
              <button
                onClick={onOpenSettingsModal}
                className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-900 rounded-lg transition cursor-pointer"
                title="Pengaturan Sekolah"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

