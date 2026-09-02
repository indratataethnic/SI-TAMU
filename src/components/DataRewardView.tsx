import React, { useState } from 'react';
import { RewardRecord, Student, SchoolSettings } from '../types';
import {
  Award,
  Search,
  Filter,
  Download,
  Plus,
  MessageSquare,
  Printer,
  Trash2,
  Eye,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2,
  X
} from 'lucide-react';
import { exportRewardsToExcel } from '../utils/excel';
import { openWhatsApp, generateRewardWAMessage } from '../utils/whatsapp';

interface DataRewardViewProps {
  rewards: RewardRecord[];
  students: Student[];
  settings: SchoolSettings;
  onDeleteReward: (id: string) => void;
  onNavigateToInput: () => void;
  onOpenSertifikat: (reward: RewardRecord) => void;
}

export const DataRewardView: React.FC<DataRewardViewProps> = ({
  rewards,
  students,
  settings,
  onDeleteReward,
  onNavigateToInput,
  onOpenSertifikat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');

  const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
  const levelsList = ['ALL', 'Nasional', 'Provinsi', 'Kota/Kab', 'Sekolah', 'Umum'];
  const classesList = ['ALL', ...Array.from(new Set(rewards.map(r => r.studentClass))).sort()];

  const filteredRewards = rewards.filter(r => {
    const matchesLvl = selectedLevel === 'ALL' || r.level === selectedLevel;
    const matchesCls = selectedClass === 'ALL' || r.studentClass === selectedClass;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.studentName.toLowerCase().includes(q) ||
      r.competitionName.toLowerCase().includes(q) ||
      r.rank.toLowerCase().includes(q) ||
      (r.organizer && r.organizer.toLowerCase().includes(q));
    return matchesLvl && matchesCls && matchesSearch;
  });

  const handleSendWA = (reward: RewardRecord) => {
    const student = studentMap.get(reward.studentId);
    if (!student) {
      alert('Data siswa tidak ditemukan.');
      return;
    }
    const studentRewards = rewards.filter(r => r.studentId === reward.studentId);
    const totalPts = studentRewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
    const msg = generateRewardWAMessage(student, reward, totalPts, settings);
    openWhatsApp(student.parentPhone, msg);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Data Reward & Piagam Prestasi Murid
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Rekam jejak kejuaraan, olimpiade, dan perilaku positif siswa beserta penerbitan piagam penghargaan resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportRewardsToExcel(rewards)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={onNavigateToInput}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Input Prestasi Baru
          </button>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Siswa, Nama Lomba, Penyelenggara..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Tingkat:</span>
            {levelsList.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedLevel === lvl
                    ? 'bg-emerald-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'Semua Tingkat' : lvl}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-500 font-medium">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
            >
              {classesList.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'Semua Kelas' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-emerald-100 border-b border-emerald-900">
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                <th className="py-3 px-4 font-semibold">Kelas</th>
                <th className="py-3 px-4 font-semibold">Capaian / Peringkat</th>
                <th className="py-3 px-4 font-semibold">Tingkat</th>
                <th className="py-3 px-4 font-semibold">Nama Ajang / Prestasi</th>
                <th className="py-3 px-4 font-semibold text-center">Poin</th>
                <th className="py-3 px-4 font-semibold text-center">Menu Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRewards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Belum ada data reward/prestasi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredRewards.map((r, idx) => {
                  const student = studentMap.get(r.studentId);

                  return (
                    <tr key={`${r.id || 'r'}-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">{r.date}</td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{r.studentName}</span>
                        {student && <span className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {r.studentClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-900 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[11px]">
                          <Sparkles className="w-3 h-3 text-amber-500" />
                          {r.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{r.level}</td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-900 block max-w-xs truncate">{r.competitionName}</span>
                        {r.organizer && <span className="text-[10px] text-slate-400 block">{r.organizer}</span>}
                        {r.reporterName && <span className="text-[10px] text-emerald-800 font-medium block">Pembina: {r.reporterName}</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                          +{r.points} Pt
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Cetak Piagam */}
                          <button
                            onClick={() => onOpenSertifikat(r)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg transition shadow-xs cursor-pointer"
                            title="Buka & Cetak Piagam Penghargaan"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Piagam</span>
                          </button>

                          {/* 1-Click WA */}
                          <button
                            onClick={() => handleSendWA(r)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Kirim Apresiasi ke WhatsApp Orang Tua"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus catatan prestasi ${r.competitionName} untuk ${r.studentName}?`)) {
                                onDeleteReward(r.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
