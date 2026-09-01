import React from 'react';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Award,
  Calculator,
  SlidersHorizontal,
  PenTool,
  Sparkles,
  BookOpen,
  Search,
  ShieldCheck,
  ChevronRight,
  X,
  GraduationCap
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'data_siswa'
  | 'data_guru'
  | 'data_pelanggaran'
  | 'data_reward'
  | 'penghitungan'
  | 'kelola_poin'
  | 'input_pelanggaran'
  | 'input_reward'
  | 'edukasi'
  | 'portal_publik';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  role: UserRole;
  urgentAlertCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onRequireStaffLogin: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  role,
  urgentAlertCount,
  mobileOpen,
  onCloseMobile,
  onRequireStaffLogin
}) => {
  const navItems = [
    {
      id: 'dashboard' as NavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      staffOnly: false,
      badge: urgentAlertCount > 0 ? `${urgentAlertCount} Peringatan` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    {
      id: 'data_siswa' as NavTab,
      label: 'Data Siswa',
      icon: Users,
      staffOnly: true,
      description: 'Import & Export Excel'
    },
    {
      id: 'data_guru' as NavTab,
      label: 'Data Guru & GTK',
      icon: GraduationCap,
      staffOnly: true,
      description: 'Wali Kelas & Guru Piket'
    },
    {
      id: 'data_pelanggaran' as NavTab,
      label: 'Data Pelanggaran',
      icon: AlertTriangle,
      staffOnly: true,
      description: 'Aksi WA & Cetak Surat'
    },
    {
      id: 'data_reward' as NavTab,
      label: 'Data Reward',
      icon: Award,
      staffOnly: true,
      description: 'Cetak Piagam Resmi'
    },
    {
      id: 'penghitungan' as NavTab,
      label: 'Penghitungan Poin',
      icon: Calculator,
      staffOnly: true,
      badge: urgentAlertCount > 0 ? `${urgentAlertCount}` : undefined,
      badgeColor: 'bg-amber-500 text-slate-900',
      description: 'Ambang 100/300/500 Pt & Kompensasi'
    },
    {
      id: 'kelola_poin' as NavTab,
      label: 'Kelola Poin',
      icon: SlidersHorizontal,
      staffOnly: true,
      description: 'Katalog Pelanggaran & Reward'
    },
    {
      id: 'input_pelanggaran' as NavTab,
      label: 'Input Pelanggaran',
      icon: PenTool,
      staffOnly: true,
      highlight: true
    },
    {
      id: 'input_reward' as NavTab,
      label: 'Input Reward',
      icon: Sparkles,
      staffOnly: true,
      highlightReward: true
    },
    {
      id: 'edukasi' as NavTab,
      label: 'Edukasi & Tata Tertib',
      icon: BookOpen,
      staffOnly: false
    },
    {
      id: 'portal_publik' as NavTab,
      label: 'Cek Poin Mandiri (Siswa/Ortu)',
      icon: Search,
      staffOnly: false,
      publicHighlight: true
    }
  ];

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.staffOnly && role !== 'staff') {
      onRequireStaffLogin();
    } else {
      onSelectTab(item.id);
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden no-print"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-16 bottom-0 left-0 z-40 w-64 bg-emerald-950/95 backdrop-blur-md border-r border-emerald-900/80 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 no-print ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Navigation List */}
        <div className="p-4 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            <span>Menu Navigasi</span>
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1 text-emerald-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            const isLocked = item.staffOnly && role !== 'staff';

            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer group text-left ${
                  isActive
                    ? 'bg-emerald-800 text-white shadow-md border border-amber-400/40'
                    : isLocked
                    ? 'text-emerald-300/70 hover:bg-emerald-900/40 hover:text-emerald-200'
                    : item.highlight
                    ? 'text-rose-200 hover:bg-rose-950/50 hover:text-white border border-rose-900/30'
                    : item.highlightReward
                    ? 'text-amber-200 hover:bg-amber-950/50 hover:text-white border border-amber-900/30'
                    : item.publicHighlight
                    ? 'text-teal-200 hover:bg-teal-950/50 hover:text-white border border-teal-800/40'
                    : 'text-emerald-100 hover:bg-emerald-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg transition shrink-0 ${
                      isActive
                        ? 'bg-emerald-950 text-amber-400'
                        : isLocked
                        ? 'bg-emerald-900/40 text-emerald-400/60'
                        : item.highlight
                        ? 'bg-rose-900/50 text-rose-300'
                        : item.highlightReward
                        ? 'bg-amber-900/50 text-amber-300'
                        : 'bg-emerald-900 text-emerald-300 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="truncate">
                    <span className="block truncate">{item.label}</span>
                    {item.description && (
                      <span className="text-[10px] text-emerald-400/80 font-normal block truncate">
                        {item.description}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Badges */}
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isLocked && (
                    <span className="text-[10px] bg-emerald-900 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                      Guru
                    </span>
                  )}
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Status Card */}
        <div className="p-4 border-t border-emerald-900/80">
          <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-800 text-xs">
            <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                {role === 'staff' ? 'Petugas Aktif' : 'Portal Publik'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </div>
            <p className="text-[11px] text-emerald-200/80 leading-tight">
              {role === 'staff'
                ? 'Hak akses penuh kelola poin & cetak dokumen.'
                : 'Data privasi murid dilindungi kode akses & NISN.'}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};
