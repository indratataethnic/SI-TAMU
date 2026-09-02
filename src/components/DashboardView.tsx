import React, { useState, useMemo } from 'react';
import {
  Student,
  ViolationRecord,
  RewardRecord,
  CompensationRecord,
  StudentScoreSummary,
  SchoolSettings,
  UserRole
} from '../types';
import {
  Users,
  AlertTriangle,
  Award,
  ShieldAlert,
  PlusCircle,
  Sparkles,
  TrendingUp,
  FileText,
  Clock,
  ArrowRight,
  Printer,
  ChevronRight,
  BarChart3,
  PieChart as PieChartIcon,
  Layers,
  MapPin,
  Calendar,
  Filter
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { NavTab } from './Sidebar';

interface DashboardViewProps {
  students: Student[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  compensations: CompensationRecord[];
  summaries: StudentScoreSummary[];
  settings: SchoolSettings;
  role: UserRole;
  onNavigate: (tab: NavTab) => void;
  onSelectStudentForSurat: (
    summary: StudentScoreSummary,
    type: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500'
  ) => void;
  onSelectRewardForCert: (reward: RewardRecord) => void;
}

// Color palette for charts
const PIE_COLORS = [
  '#e11d48', // Rose 600
  '#d97706', // Amber 600
  '#059669', // Emerald 600
  '#0284c7', // Sky 600
  '#7c3aed', // Violet 600
  '#db2777', // Pink 600
  '#475569', // Slate 600
  '#ca8a04'  // Yellow 600
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  students,
  violations,
  rewards,
  compensations,
  summaries,
  settings,
  role,
  onNavigate,
  onSelectStudentForSurat,
  onSelectRewardForCert
}) => {
  const [chartMetric, setChartMetric] = useState<'points' | 'count'>('points');
  const [classChartMetric, setClassChartMetric] = useState<'points' | 'count'>('points');

  const totalStudents = students.length;
  const totalViolationsCount = violations.length;
  const totalViolationPoints = violations.reduce((acc, v) => acc + (Number(v.points) || 0), 0);
  const totalRewardsCount = rewards.length;
  const totalRewardPoints = rewards.reduce((acc, r) => acc + (Number(r.points) || 0), 0);

  // Threshold alerts
  const alert100 = summaries.filter(s => s.activeViolationPoints >= 100 && s.activeViolationPoints < 300);
  const alert300 = summaries.filter(s => s.activeViolationPoints >= 300 && s.activeViolationPoints < 500);
  const alert500 = summaries.filter(s => s.activeViolationPoints >= 500);
  const urgentCount = alert100.length + alert300.length + alert500.length;

  // Breakdown by category
  const beratCount = violations.filter(v => v.category === 'berat').length;
  const sedangCount = violations.filter(v => v.category === 'sedang').length;
  const ringanCount = violations.filter(v => v.category === 'ringan').length;

  // Recent records
  const recentViolations = useMemo(() => {
    return [...violations]
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 5);
  }, [violations]);

  const recentRewards = useMemo(() => {
    return [...rewards]
      .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
      .slice(0, 5);
  }, [rewards]);

  // 1. DATA FOR TIMELINE / TREND CHART (Pelanggaran vs Reward)
  const timelineData = useMemo(() => {
    const datesMap = new Map<
      string,
      { date: string; displayDate: string; violationPoints: number; violationCount: number; rewardPoints: number; rewardCount: number }
    >();

    // Process violations
    violations.forEach(v => {
      const dateKey = v.date || '2026-08-01';
      if (!datesMap.has(dateKey)) {
        const d = new Date(dateKey);
        const displayDate = isNaN(d.getTime())
          ? dateKey
          : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
        datesMap.set(dateKey, {
          date: dateKey,
          displayDate,
          violationPoints: 0,
          violationCount: 0,
          rewardPoints: 0,
          rewardCount: 0
        });
      }
      const entry = datesMap.get(dateKey)!;
      entry.violationPoints += Number(v.points) || 0;
      entry.violationCount += 1;
    });

    // Process rewards
    rewards.forEach(r => {
      const dateKey = r.date || '2026-08-01';
      if (!datesMap.has(dateKey)) {
        const d = new Date(dateKey);
        const displayDate = isNaN(d.getTime())
          ? dateKey
          : new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(d);
        datesMap.set(dateKey, {
          date: dateKey,
          displayDate,
          violationPoints: 0,
          violationCount: 0,
          rewardPoints: 0,
          rewardCount: 0
        });
      }
      const entry = datesMap.get(dateKey)!;
      entry.rewardPoints += Number(r.points) || 0;
      entry.rewardCount += 1;
    });

    // Sort chronologically
    const sorted = Array.from(datesMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // If empty or single, provide at least a baseline range
    if (sorted.length === 0) {
      return [
        { displayDate: 'Minggu 1', violationPoints: 0, violationCount: 0, rewardPoints: 0, rewardCount: 0 },
        { displayDate: 'Minggu 2', violationPoints: 0, violationCount: 0, rewardPoints: 0, rewardCount: 0 },
        { displayDate: 'Minggu 3', violationPoints: 0, violationCount: 0, rewardPoints: 0, rewardCount: 0 },
        { displayDate: 'Minggu 4', violationPoints: 0, violationCount: 0, rewardPoints: 0, rewardCount: 0 }
      ];
    }

    return sorted;
  }, [violations, rewards]);

  // 2. DATA FOR CLASS COMPARISON CHART (Pelanggaran vs Reward per Kelas)
  const classComparisonData = useMemo(() => {
    // Collect all unique classes
    const classSet = new Set<string>();
    students.forEach(s => s.class && classSet.add(s.class.trim()));
    violations.forEach(v => v.studentClass && classSet.add(v.studentClass.trim()));
    rewards.forEach(r => r.studentClass && classSet.add(r.studentClass.trim()));

    const classes = Array.from(classSet).sort();

    return classes.map(cls => {
      const classViolations = violations.filter(v => v.studentClass?.trim() === cls);
      const classRewards = rewards.filter(r => r.studentClass?.trim() === cls);
      const classStudents = students.filter(s => s.class?.trim() === cls);

      const vPoints = classViolations.reduce((sum, v) => sum + (Number(v.points) || 0), 0);
      const rPoints = classRewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);

      return {
        className: cls,
        violationPoints: vPoints,
        violationCount: classViolations.length,
        rewardPoints: rPoints,
        rewardCount: classRewards.length,
        studentCount: classStudents.length
      };
    });
  }, [students, violations, rewards]);

  // 3. DATA FOR VIOLATION LOCATION (Diagram Lingkaran Lokasi)
  const locationData = useMemo(() => {
    const locMap = new Map<string, { name: string; count: number; points: number }>();

    violations.forEach(v => {
      let loc = (v.location || '').trim();
      if (!loc) {
        loc = 'Ruang Kelas / Sekitar Kelas';
      }
      // Clean up common location variations
      if (loc.toLowerCase().includes('kantin')) loc = 'Kantin Sekolah';
      else if (loc.toLowerCase().includes('gerbang')) loc = 'Gerbang Depan Sekolah';
      else if (loc.toLowerCase().includes('parkir')) loc = 'Area Parkiran Belakang';
      else if (loc.toLowerCase().includes('lapangan')) loc = 'Lapangan Upacara / Olahraga';
      else if (loc.toLowerCase().includes('toilet')) loc = 'Toilet Siswa';
      else if (loc.toLowerCase().includes('lab')) loc = 'Laboratorium';
      else if (loc.toLowerCase().includes('perpustakaan')) loc = 'Perpustakaan';
      else if (loc.toLowerCase().includes('koridor')) loc = 'Koridor & Tangga';

      if (!locMap.has(loc)) {
        locMap.set(loc, { name: loc, count: 0, points: 0 });
      }
      const item = locMap.get(loc)!;
      item.count += 1;
      item.points += Number(v.points) || 0;
    });

    const list = Array.from(locMap.values()).sort((a, b) => b.count - a.count);

    if (list.length === 0) {
      return [
        { name: 'Kantin Sekolah', count: 1, points: 10, percent: '33%' },
        { name: 'Gerbang Utama', count: 1, points: 10, percent: '33%' },
        { name: 'Lapangan', count: 1, points: 5, percent: '34%' }
      ];
    }

    const totalCount = list.reduce((acc, curr) => acc + curr.count, 0);

    return list.map((item, idx) => ({
      ...item,
      color: PIE_COLORS[idx % PIE_COLORS.length],
      percent: totalCount > 0 ? `${Math.round((item.count / totalCount) * 100)}%` : '0%'
    }));
  }, [violations]);

  return (
    <div className="space-y-6">
      {/* Welcome Banner in Bottle Green */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden border border-emerald-800">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 rounded-full bg-emerald-700/20 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 border border-amber-400/40 text-amber-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Sistem Informasi Tata Tertib Murid Terintegrasi</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">
            Selamat Datang di SI TAMU
          </h2>
          <p className="text-emerald-200 text-xs sm:text-sm leading-relaxed">
            Platform modern untuk pemantauan disiplin positif, rekam jejak poin pelanggaran & reward prestasi, serta otomatisasi administrasi tata tertib di <span className="text-amber-300 font-semibold">{settings.schoolName}</span>.
          </p>

          {/* Quick Action Buttons */}
          {role === 'staff' && (
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={() => onNavigate('input_pelanggaran')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition shadow cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                Catat Pelanggaran
              </button>
              <button
                onClick={() => onNavigate('input_reward')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl text-xs transition shadow cursor-pointer"
              >
                <Award className="w-4 h-4" />
                Catat Prestasi / Reward
              </button>
              <button
                onClick={() => onNavigate('penghitungan')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold rounded-xl text-xs transition border border-emerald-700 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Cek Akumulasi Poin
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Emergency Alert Banner */}
      {urgentCount > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                  Peringatan Tindak Lanjut Siswa ({urgentCount} Siswa Perlu Penanganan)
                </h3>
                <p className="text-xs text-amber-800">
                  Terdapat siswa yang telah mencapai ambang batas akumulasi poin 100, 300, atau 500 poin.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('penghitungan')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              <span>Buka Menu Penghitungan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            {/* 100 Poin Warning */}
            <div className="bg-white p-3.5 rounded-xl border border-amber-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-1">
                  <span>Panggilan Orang Tua I (≥100 Pt)</span>
                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">{alert100.length} Siswa</span>
                </div>
                <p className="text-[11px] text-slate-600">Siswa perlu koordinasi bimbingan konseling dan pemanggilan wali murid.</p>
              </div>
              {alert100.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {alert100.slice(0, 2).map((item, idx) => (
                    <div key={`${item.student.id || 'stu'}-${idx}`} className="flex items-center justify-between text-xs bg-amber-50/70 p-1.5 rounded">
                      <span className="font-semibold text-slate-900 truncate max-w-[130px]">{item.student.name}</span>
                      <button
                        onClick={() => onSelectStudentForSurat(item, 'panggilan_100')}
                        className="text-[11px] text-amber-900 font-bold hover:underline cursor-pointer"
                      >
                        Surat Panggilan →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 300 Poin Skorsing */}
            <div className="bg-white p-3.5 rounded-xl border border-red-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-red-900 mb-1">
                  <span>Sanksi Skorsing (≥300 Pt)</span>
                  <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded-full">{alert300.length} Siswa</span>
                </div>
                <p className="text-[11px] text-slate-600">Penandatanganan Surat Perjanjian Khusus & skorsing sementara.</p>
              </div>
              {alert300.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {alert300.slice(0, 2).map((item, idx) => (
                    <div key={`${item.student.id || 'stu'}-${idx}`} className="flex items-center justify-between text-xs bg-red-50/70 p-1.5 rounded">
                      <span className="font-semibold text-slate-900 truncate max-w-[130px]">{item.student.name}</span>
                      <button
                        onClick={() => onSelectStudentForSurat(item, 'skorsing_300')}
                        className="text-[11px] text-red-800 font-bold hover:underline cursor-pointer"
                      >
                        Surat Skorsing →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 500 Poin Dikembalikan ke Ortu */}
            <div className="bg-white p-3.5 rounded-xl border border-rose-300 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-rose-950 mb-1">
                  <span>Pembinaan di Rumah (≥500 Pt)</span>
                  <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">{alert500.length} Siswa</span>
                </div>
                <p className="text-[11px] text-slate-600">Siswa diserahkan kembali kepada orang tua untuk pembinaan keluarga.</p>
              </div>
              {alert500.length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {alert500.slice(0, 2).map((item, idx) => (
                    <div key={`${item.student.id || 'stu'}-${idx}`} className="flex items-center justify-between text-xs bg-rose-50/70 p-1.5 rounded">
                      <span className="font-semibold text-slate-900 truncate max-w-[130px]">{item.student.name}</span>
                      <button
                        onClick={() => onSelectStudentForSurat(item, 'pembinaan_500')}
                        className="text-[11px] text-rose-800 font-bold hover:underline cursor-pointer"
                      >
                        Berita Acara →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Siswa */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Siswa Terdaftar</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalStudents}</h3>
            <p className="text-[11px] text-emerald-700 font-medium mt-1">Aktif di sistem database</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Total Kasus Pelanggaran */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pelanggaran</p>
            <h3 className="text-2xl font-black text-rose-700 mt-1">{totalViolationsCount} <span className="text-xs font-normal text-slate-500">Kasus</span></h3>
            <p className="text-[11px] text-rose-600 font-medium mt-1">{totalViolationPoints} Total Poin Minus</p>
          </div>
          <div className="p-3 bg-rose-50 text-rose-700 rounded-2xl border border-rose-100">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        {/* Total Reward Prestasi */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prestasi & Reward</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{totalRewardsCount} <span className="text-xs font-normal text-slate-500">Piagam</span></h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">+{totalRewardPoints} Total Poin Apresiasi</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Award className="w-6 h-6" />
          </div>
        </div>

        {/* Status Siswa Perlu Pembinaan */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Perlu Tindak Lanjut</p>
            <h3 className="text-2xl font-black text-emerald-950 mt-1">{urgentCount} <span className="text-xs font-normal text-slate-500">Siswa</span></h3>
            <p className="text-[11px] text-amber-700 font-medium mt-1">Ambang batas 100/300/500 Pt</p>
          </div>
          <div className="p-3 bg-teal-50 text-teal-800 rounded-2xl border border-teal-100">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 SECTION 1: GRAFIK TREN PELANGGARAN & REWARD */}
      {/* ========================================================================= */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-100 text-emerald-900 rounded-lg">
                <TrendingUp className="w-4 h-4 text-emerald-800" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Grafik Tren Pelanggaran & Reward Prestasi
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Komparasi dinamika poin kedisiplinan (pelanggaran) dan apresiasi prestasi siswa dari waktu ke waktu.
            </p>
          </div>

          {/* Toggle Metrics: Poin vs Jumlah Kasus */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs self-start sm:self-auto">
            <button
              onClick={() => setChartMetric('points')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                chartMetric === 'points'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Akumulasi Poin
            </button>
            <button
              onClick={() => setChartMetric('count')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                chartMetric === 'count'
                  ? 'bg-emerald-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jumlah Kasus / Piagam
            </button>
          </div>
        </div>

        {/* Chart Area */}
        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timelineData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPelanggaran" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#e11d48" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#e11d48" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorReward" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="displayDate"
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <YAxis
                stroke="#64748b"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: '#cbd5e1' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#022c22',
                  borderColor: '#065f46',
                  borderRadius: '12px',
                  color: '#ffffff',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)'
                }}
                formatter={(value: any, name: any) => {
                  if (name === 'Pelanggaran') {
                    return [
                      chartMetric === 'points' ? `${value} Poin Minus` : `${value} Kejadian`,
                      '⚠️ Pelanggaran'
                    ];
                  }
                  return [
                    chartMetric === 'points' ? `+${value} Poin Reward` : `${value} Piagam`,
                    '🏆 Prestasi / Reward'
                  ];
                }}
                labelFormatter={(label) => `Periode: ${label}`}
              />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
              />
              <Area
                type="monotone"
                name="Pelanggaran"
                dataKey={chartMetric === 'points' ? 'violationPoints' : 'violationCount'}
                stroke="#e11d48"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorPelanggaran)"
              />
              <Area
                type="monotone"
                name="Reward / Prestasi"
                dataKey={chartMetric === 'points' ? 'rewardPoints' : 'rewardCount'}
                stroke="#059669"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorReward)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-rose-700">
              <span className="w-3 h-3 rounded-full bg-rose-600 inline-block"></span>
              Pelanggaran: {totalViolationPoints} Poin ({totalViolationsCount} Kasus)
            </span>
            <span className="flex items-center gap-1.5 font-medium text-emerald-800">
              <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
              Reward Prestasi: +{totalRewardPoints} Poin ({totalRewardsCount} Piagam)
            </span>
          </div>
          <span className="text-[11px] text-slate-400">
            *Data diperbarui otomatis dari pencatatan harian
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 SECTION 2: GRAFIK KELAS & DIAGRAM LINGKARAN LOKASI (2-COLUMN GRID) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT (7 COLS): GRAFIK PERBANDINGAN KELAS */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-amber-100 text-amber-900 rounded-lg">
                  <BarChart3 className="w-4 h-4 text-amber-800" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">
                  Perbandingan Kelas: Pelanggaran vs Reward
                </h3>
              </div>

              {/* Toggle metric */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px]">
                <button
                  onClick={() => setClassChartMetric('points')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                    classChartMetric === 'points'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Poin
                </button>
                <button
                  onClick={() => setClassChartMetric('count')}
                  className={`px-2.5 py-1 rounded font-semibold transition cursor-pointer ${
                    classChartMetric === 'count'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Kasus
                </button>
              </div>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Rasio tingkat ketertiban dan prestasi murid yang terakumulasi di setiap rombongan belajar (kelas).
            </p>

            {/* Bar Chart Container */}
            <div className="h-72 w-full pt-4">
              {classComparisonData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Belum ada data kelas terdaftar
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={classComparisonData}
                    margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                      dataKey="className"
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis
                      stroke="#64748b"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#022c22',
                        borderColor: '#065f46',
                        borderRadius: '12px',
                        color: '#ffffff',
                        fontSize: '12px'
                      }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Pelanggaran Kelas') {
                          return [
                            classChartMetric === 'points' ? `${value} Poin Minus` : `${value} Kasus`,
                            '⚠️ Pelanggaran'
                          ];
                        }
                        return [
                          classChartMetric === 'points' ? `+${value} Poin Prestasi` : `${value} Piagam`,
                          '🏆 Reward'
                        ];
                      }}
                      labelFormatter={(label) => `Kelas: ${label}`}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      iconType="rect"
                      wrapperStyle={{ fontSize: '11px', paddingBottom: '8px' }}
                    />
                    <Bar
                      name="Pelanggaran Kelas"
                      dataKey={classChartMetric === 'points' ? 'violationPoints' : 'violationCount'}
                      fill="#e11d48"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                    <Bar
                      name="Reward Kelas"
                      dataKey={classChartMetric === 'points' ? 'rewardPoints' : 'rewardCount'}
                      fill="#059669"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80 text-xs text-emerald-950 flex items-center justify-between">
            <span className="font-semibold">💡 Evaluasi Wali Kelas:</span>
            <span className="text-[11px] text-emerald-800">
              Kelas dengan reward tertinggi mendapat predikat *Kelas Teladan*.
            </span>
          </div>
        </div>

        {/* RIGHT (5 COLS): DIAGRAM LINGKARAN LOKASI PALING BANYAK MELANGGAR */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-rose-100 text-rose-900 rounded-lg">
                <MapPin className="w-4 h-4 text-rose-700" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">
                Lokasi Paling Banyak Melanggar
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Distribusi titik lokasi rawan pelanggaran tata tertib di lingkungan sekolah.
            </p>

            {/* Donut Chart */}
            <div className="h-56 w-full relative flex items-center justify-center my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={locationData}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {locationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#022c22',
                      borderColor: '#065f46',
                      borderRadius: '12px',
                      color: '#ffffff',
                      fontSize: '12px'
                    }}
                    formatter={(value: any, name: any, item: any) => [
                      `${value} Kejadian (${item.payload.percent || ''}) • ${item.payload.points} Poin`,
                      `Lokasi: ${name}`
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat Inside Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total</span>
                <span className="text-xl font-black text-slate-900">{totalViolationsCount}</span>
                <span className="text-[9px] text-rose-600 font-semibold">Kasus</span>
              </div>
            </div>

            {/* Ranked Location List with badges */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1 custom-scrollbar">
              {locationData.map((loc, idx) => (
                <div
                  key={loc.name}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-slate-100 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: loc.color || PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-semibold text-slate-800 truncate">
                      {idx + 1}. {loc.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-bold text-slate-900">{loc.count} Kasus</span>
                    <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      {loc.percent}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-[11px] text-rose-900 font-medium flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>Fokuskan piket pengawasan guru pada lokasi dengan persentase tertinggi.</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📊 SECTION 3: RECENT ACTIVITIES (PELANGGARAN & REWARD FEEDS) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Recent Violations Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-rose-600" />
              Catatan Pelanggaran Terakhir
            </h3>
            <button
              onClick={() => onNavigate('data_pelanggaran')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentViolations.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada catatan pelanggaran yang diinput.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentViolations.map((v, idx) => (
                <div key={`${v.id || 'viol'}-${idx}`} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{v.studentName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {v.studentClass}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          v.category === 'berat'
                            ? 'bg-rose-100 text-rose-800'
                            : v.category === 'sedang'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {v.category.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">{v.ruleName}</p>
                    <p className="text-[11px] text-slate-400">
                      {v.date} {v.location ? `• 📍 ${v.location}` : ''} • Pencatat: {v.reporterName}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-extrabold text-rose-600 text-sm">+{v.points} Poin</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Recent Rewards Feed */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Prestasi & Apresiasi Terakhir
            </h3>
            <button
              onClick={() => onNavigate('data_reward')}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-900 hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Lihat Semua</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentRewards.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada catatan prestasi yang diinput.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentRewards.map((r, idx) => (
                <div key={`${r.id || 'rew'}-${idx}`} className="py-3 flex items-start justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{r.studentName}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                        {r.rank}
                      </span>
                      <span className="text-[10px] font-medium text-slate-500">{r.level}</span>
                    </div>
                    <p className="text-slate-800 font-medium">{r.competitionName}</p>
                    <p className="text-[11px] text-slate-400">{r.date} {r.organizer ? `• ${r.organizer}` : ''}</p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <span className="font-extrabold text-amber-600 text-sm">+{r.points} Poin</span>
                    <button
                      onClick={() => onSelectRewardForCert(r)}
                      className="p-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-lg transition cursor-pointer"
                      title="Lihat & Cetak Piagam"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
