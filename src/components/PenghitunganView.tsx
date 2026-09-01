import React, { useState, useMemo } from 'react';
import { Student, StudentScoreSummary, CompensationRecord, SchoolSettings, ViolationRecord } from '../types';
import {
  Calculator,
  Search,
  Filter,
  Download,
  Plus,
  ShieldAlert,
  Printer,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  FileSpreadsheet,
  HeartHandshake,
  Clock,
  Trash2,
  X,
  AlertCircle,
  Crown,
  Star,
  Award,
  ShieldCheck,
  GraduationCap
} from 'lucide-react';
import { exportPenghitunganToExcel } from '../utils/excel';
import { openWhatsApp, generateThresholdWAMessage } from '../utils/whatsapp';
import { SertifikatTeladanModal } from './SertifikatTeladanModal';
import { PRIMARY_SCHOOL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';

interface PenghitunganViewProps {
  summaries: StudentScoreSummary[];
  compensations: CompensationRecord[];
  violations: ViolationRecord[];
  settings: SchoolSettings;
  onAddCompensation: (compensation: CompensationRecord) => void;
  onDeleteCompensation: (id: string) => void;
  onOpenSurat: (summary: StudentScoreSummary, type: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500') => void;
}

export const PenghitunganView: React.FC<PenghitunganViewProps> = ({
  summaries,
  compensations,
  violations,
  settings,
  onAddCompensation,
  onDeleteCompensation,
  onOpenSurat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [compensationModalOpen, setCompensationModalOpen] = useState(false);
  const [selectedStudentForComp, setSelectedStudentForComp] = useState<Student | null>(null);

  // Teladan Modal State
  const [teladanSelectorOpen, setTeladanSelectorOpen] = useState(false);
  const [activeTeladanCertSummary, setActiveTeladanCertSummary] = useState<StudentScoreSummary | null>(null);
  const [teladanSelectedClassTab, setTeladanSelectedClassTab] = useState<string>('ALL');

  // Form for compensation
  const [compTask, setCompTask] = useState('');
  const [compPoints, setCompPoints] = useState<number>(10);
  const [compSupervisor, setCompSupervisor] = useState(settings.bkCoordinatorName || 'Ibu Ratna, M.Pd.');
  const [compNotes, setCompNotes] = useState('');

  const allStudents = useMemo(() => summaries.map(s => s.student), [summaries]);
  const availableClasses = useMemo(() => getAvailableClasses(allStudents), [allStudents]);

  // Teladan Candidates: STRICT REQUIREMENT: Total Violations === 0 and Active Points === 0
  const teladanCandidates = useMemo(() => {
    return summaries
      .filter(s => s.totalViolationPoints === 0 && s.violationsCount === 0)
      .sort((a, b) => b.totalRewardPoints - a.totalRewardPoints || a.student.name.localeCompare(b.student.name));
  }, [summaries]);

  // Group Teladan Candidates by Class
  const teladanByClass = useMemo(() => {
    const map: Record<string, StudentScoreSummary[]> = {};
    availableClasses.forEach(cls => {
      map[cls] = teladanCandidates.filter(s => matchClassFilter(s.student.class, cls));
    });
    return map;
  }, [availableClasses, teladanCandidates]);

  const filteredSummaries = summaries.filter(s => {
    const matchesCls = matchClassFilter(s.student.class, selectedClass);
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'peringatan' && s.activeViolationPoints >= 100 && s.activeViolationPoints < 300) ||
      (selectedStatus === 'skorsing' && s.activeViolationPoints >= 300 && s.activeViolationPoints < 500) ||
      (selectedStatus === 'pembinaan_rumah' && s.activeViolationPoints >= 500) ||
      (selectedStatus === 'normal' && s.activeViolationPoints < 100);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      s.student.name.toLowerCase().includes(q) ||
      s.student.nisn.toLowerCase().includes(q) ||
      s.student.parentName.toLowerCase().includes(q) ||
      s.student.class.toLowerCase().includes(q);
    return matchesCls && matchesStatus && matchesSearch;
  });

  const handleOpenCompensationModal = (student: Student) => {
    setSelectedStudentForComp(student);
    setCompTask('');
    setCompPoints(10);
    setCompNotes('');
    setCompensationModalOpen(true);
  };

  const handleSaveCompensation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentForComp) return;

    const newComp: CompensationRecord = {
      id: `COMP-${Date.now()}`,
      studentId: selectedStudentForComp.id,
      studentName: selectedStudentForComp.name,
      studentClass: selectedStudentForComp.class,
      taskName: compTask,
      deductedPoints: Number(compPoints) || 0,
      date: new Date().toISOString().slice(0, 10),
      supervisorName: compSupervisor,
      status: 'Disetujui',
      notes: compNotes,
      academicYear: settings.academicYear || '2026/2027',
      createdAt: new Date().toISOString()
    };

    onAddCompensation(newComp);
    setCompensationModalOpen(false);
  };

  const handleSendThresholdWA = (summary: StudentScoreSummary) => {
    const msg = generateThresholdWAMessage(summary, settings);
    openWhatsApp(summary.student.parentPhone, msg);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-800" />
            Penghitungan & Manajemen Akumulasi Poin Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kalkulasi otomatis poin aktif <span className="font-semibold text-emerald-950">(Pelanggaran - Kompensasi)</span>, penanganan berjenjang, serta penetapan Murid Teladan per kelas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTeladanSelectorOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold rounded-xl text-xs transition shadow cursor-pointer"
          >
            <Crown className="w-4 h-4 text-emerald-950" />
            Tentukan Murid Teladan Tiap Kelas
          </button>

          <button
            onClick={() => exportPenghitunganToExcel(summaries)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Rekap Poin Excel
          </button>
        </div>
      </div>

      {/* Threshold Guide Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-200 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-bold text-amber-950 mb-1">
              <span>Tingkat 1: Ambang ≥100 Poin</span>
              <span className="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full text-[10px]">Peringatan</span>
            </div>
            <p className="text-amber-900 font-medium">Sekolah Menghubungi Orang Tua</p>
            <p className="text-slate-600 text-[11px] mt-1">
              Penerbitan Surat Pemanggilan Orang Tua Tahap I untuk koordinasi bimbingan konseling dan pencegahan berlanjut.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-bold text-red-950 mb-1">
              <span>Tingkat 2: Ambang ≥300 Poin</span>
              <span className="bg-red-200 text-red-900 px-2 py-0.5 rounded-full text-[10px]">Skorsing</span>
            </div>
            <p className="text-red-950 font-medium">Sanksi Skorsing & Perjanjian Khusus</p>
            <p className="text-slate-600 text-[11px] mt-1">
              Pemberlakuan skorsing sementara. Murid dapat mengajukan <strong>pengurangan poin melalui tugas kompensasi positif</strong>.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between font-bold text-rose-950 mb-1">
              <span>Tingkat 3: Ambang ≥500 Poin</span>
              <span className="bg-rose-200 text-rose-900 px-2 py-0.5 rounded-full text-[10px]">Maksimal</span>
            </div>
            <p className="text-rose-950 font-medium">Pembinaan di Rumah</p>
            <p className="text-slate-600 text-[11px] mt-1">
              Murid diserahkan kembali kepada orang tua untuk pembinaan intensif di lingkungan keluarga.
            </p>
          </div>
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
            placeholder="Cari Siswa, NISN..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Status:</span>
            {[
              { id: 'ALL', label: 'Semua' },
              { id: 'normal', label: '🟢 Aman (<100)' },
              { id: 'peringatan', label: '⚠️ ≥100 Pt' },
              { id: 'skorsing', label: '⛔ ≥300 Pt' },
              { id: 'pembinaan_rumah', label: '🔴 ≥500 Pt' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setSelectedStatus(st.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedStatus === st.id
                    ? 'bg-emerald-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 ml-0 lg:ml-2">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-800" />
            <span className="text-xs text-slate-500 font-medium">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="ALL">Semua Kelas</option>
              <optgroup label="Kelas SD (Utama)">
                {PRIMARY_SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </optgroup>
              {availableClasses.filter(c => !PRIMARY_SCHOOL_CLASSES.includes(c)).length > 0 && (
                <optgroup label="Kelas Lain">
                  {availableClasses.filter(c => !PRIMARY_SCHOOL_CLASSES.includes(c)).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Class Pills for instant filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">Filter Cepat:</span>
        <button
          onClick={() => setSelectedClass('ALL')}
          className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
            selectedClass === 'ALL'
              ? 'bg-emerald-950 text-white shadow'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
          }`}
        >
          Semua Kelas ({summaries.length})
        </button>
        {PRIMARY_SCHOOL_CLASSES.map(cls => {
          const count = summaries.filter(s => matchClassFilter(s.student.class, cls)).length;
          return (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1 ${
                selectedClass === cls
                  ? 'bg-emerald-900 text-amber-300 ring-1 ring-amber-400 shadow'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span>{cls}</span>
              <span className="text-[10px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-emerald-100 border-b border-emerald-900">
                <th className="py-3 px-4 font-semibold">Nama Siswa / NISN</th>
                <th className="py-3 px-4 font-semibold">Kelas</th>
                <th className="py-3 px-4 font-semibold text-center">Total Pelanggaran</th>
                <th className="py-3 px-4 font-semibold text-center">Kompensasi (Pengurangan)</th>
                <th className="py-3 px-4 font-semibold text-center">Poin Pelanggaran Aktif</th>
                <th className="py-3 px-4 font-semibold text-center">Poin Reward</th>
                <th className="py-3 px-4 font-semibold text-center">Tingkat Status</th>
                <th className="py-3 px-4 font-semibold text-center">Tindakan Resmi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSummaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredSummaries.map((item) => {
                  const s = item.student;
                  const activePts = item.activeViolationPoints;

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{s.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">NISN: {s.nisn}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {s.class}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-rose-700">
                          {item.totalViolationPoints} Pt ({item.violationsCount}x)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className="font-bold text-emerald-700">
                            -{item.totalCompensationPoints} Pt
                          </span>
                          <button
                            onClick={() => handleOpenCompensationModal(s)}
                            className="p-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-md transition cursor-pointer"
                            title="Beri Tugas Kompensasi Pengurangan Poin"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black text-sm px-3 py-1 rounded-full ${
                            activePts >= 500
                              ? 'bg-rose-600 text-white'
                              : activePts >= 300
                              ? 'bg-red-500 text-white'
                              : activePts >= 100
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {activePts} Poin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                          +{item.totalRewardPoints} Pt
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.statusColor}`}>
                          {item.statusBadge}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Surat Tindakan Sesuai Level */}
                          {activePts >= 500 ? (
                            <button
                              onClick={() => onOpenSurat(item, 'pembinaan_500')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-700 hover:bg-rose-600 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                              title="Cetak Berita Acara Penyerahan ke Orang Tua"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Surat Penyerahan</span>
                            </button>
                          ) : activePts >= 300 ? (
                            <button
                              onClick={() => onOpenSurat(item, 'skorsing_300')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                              title="Cetak Surat Skorsing & Perjanjian"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Surat Skorsing</span>
                            </button>
                          ) : activePts >= 100 ? (
                            <button
                              onClick={() => onOpenSurat(item, 'panggilan_100')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                              title="Cetak Surat Panggilan Orang Tua"
                            >
                              <Printer className="w-3 h-3" />
                              <span>Surat Panggilan</span>
                            </button>
                          ) : item.totalViolationPoints === 0 && item.violationsCount === 0 ? (
                            <button
                              onClick={() => setActiveTeladanCertSummary(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold rounded-lg text-[11px] transition shadow-xs cursor-pointer"
                              title="Cetak Sertifikat Siswa Teladan (0 Pelanggaran)"
                            >
                              <Crown className="w-3 h-3" />
                              <span>Sertifikat Teladan</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">Dalam Batas Aman</span>
                          )}

                          {/* Tombol WA Alert */}
                          {activePts >= 100 && (
                            <button
                              onClick={() => handleSendThresholdWA(item)}
                              className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                              title="Kirim Notifikasi WA Sesuai Level Poin"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
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

      {/* Kompensasi History List */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-700" />
              Riwayat Tugas Kompensasi (Pengurangan Poin Pelanggaran)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Kegiatan positif dan pembiasaan yang telah diselesaikan murid untuk mereduksi akumulasi poin pelanggaran.
            </p>
          </div>
        </div>

        {compensations.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            Belum ada data kompensasi pengurangan poin yang dicatat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-xs">
            {compensations.map((c) => (
              <div key={c.id} className="py-3 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{c.studentName}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-medium rounded text-[10px]">
                      Kelas {c.studentClass}
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                      ✓ {c.status}
                    </span>
                  </div>
                  <p className="text-slate-800 font-medium">{c.taskName}</p>
                  <p className="text-[11px] text-slate-400">
                    {c.date} • Pembina/Saksi: {c.supervisorName} {c.notes ? `• "${c.notes}"` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    -{c.deductedPoints} Poin
                  </span>
                  <button
                    onClick={() => {
                      if (window.confirm(`Hapus catatan kompensasi ini?`)) {
                        onDeleteCompensation(c.id);
                      }
                    }}
                    className="p-1 text-slate-300 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compensation Dialog */}
      {compensationModalOpen && selectedStudentForComp && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 text-xs">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <div>
                <h3 className="font-bold text-base text-emerald-100">Beri Tugas Kompensasi</h3>
                <p className="text-emerald-300 text-[11px]">Pengurangan Poin Pelanggaran Siswa</p>
              </div>
              <button
                onClick={() => setCompensationModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompensation} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-900 block text-sm">{selectedStudentForComp.name}</span>
                <span className="text-slate-500">Kelas {selectedStudentForComp.class} • NISN: {selectedStudentForComp.nisn}</span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Tugas / Kegiatan Positif
                </label>
                <input
                  type="text"
                  required
                  value={compTask}
                  onChange={(e) => setCompTask(e.target.value)}
                  placeholder="Contoh: Resume 2 Buku Perpustakaan & Bakti Sosial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Jumlah Pengurangan Poin
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={compPoints}
                    onChange={(e) => setCompPoints(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-emerald-800 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Guru Pembina / Saksi
                  </label>
                  <input
                    type="text"
                    required
                    value={compSupervisor}
                    onChange={(e) => setCompSupervisor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pelaksanaan (Opsional)
                </label>
                <textarea
                  rows={2}
                  value={compNotes}
                  onChange={(e) => setCompNotes(e.target.value)}
                  placeholder="Siswa telah menyelesaikan tugas resume dengan baik dan tertib."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCompensationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow cursor-pointer"
                >
                  Simpan Kompensasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PENETAPAN MURID TELADAN TIAP KELAS */}
      {teladanSelectorOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 text-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 border border-amber-300">
            {/* Header */}
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-amber-300">Penetapan & Cetak Piagam Murid Teladan</h3>
                  <p className="text-xs text-emerald-300">
                    Syarat Mutlak: <strong className="text-amber-300">0 (Nol) Poin Pelanggaran</strong> & Disiplin Berprestasi
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTeladanSelectorOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Criteria Banner */}
            <div className="p-4 bg-amber-50/80 border-b border-amber-200 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div className="text-slate-700 leading-relaxed">
                <span className="font-bold text-amber-950 block">Standar Kriteria Penentuan Siswa Teladan:</span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Siswa wajib memiliki <strong>0 (NOL) catatan poin pelanggaran</strong> dan rekam jejak tata tertib prima. Siswa dengan perolehan <strong>Poin Reward prestasi tertinggi</strong> otomatis diprioritaskan sebagai bintang teladan di kelasnya.
                </p>
              </div>
            </div>

            {/* Class Filter Tabs */}
            <div className="px-6 pt-4 pb-2 border-b border-slate-200 flex flex-wrap items-center gap-2 bg-slate-50">
              <span className="font-bold text-slate-600 text-xs mr-2">Pilih Kelas:</span>
              <button
                onClick={() => setTeladanSelectedClassTab('ALL')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                  teladanSelectedClassTab === 'ALL'
                    ? 'bg-emerald-950 text-white shadow'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                Semua Kelas ({teladanCandidates.length} Siswa)
              </button>
              {availableClasses.map(cls => {
                const count = (teladanByClass[cls] || []).length;
                return (
                  <button
                    key={cls}
                    onClick={() => setTeladanSelectedClassTab(cls)}
                    className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                      teladanSelectedClassTab === cls
                        ? 'bg-emerald-950 text-white shadow'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {cls} ({count})
                  </button>
                );
              })}
            </div>

            {/* Candidate List per Class */}
            <div className="p-6 max-h-[65vh] overflow-y-auto space-y-6">
              {(teladanSelectedClassTab === 'ALL' ? availableClasses : [teladanSelectedClassTab]).map(cls => {
                const classCandidates = teladanByClass[cls] || [];
                const topCandidate = classCandidates[0];

                return (
                  <div key={cls} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    {/* Class Section Header */}
                    <div className="bg-slate-100 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{cls}</span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-semibold text-[10px]">
                          {classCandidates.length} Siswa 0 Pelanggaran
                        </span>
                      </div>
                      {topCandidate && (
                        <div className="flex items-center gap-1.5 text-amber-700 font-bold text-xs">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>Peringkat 1: {topCandidate.student.name} (+{topCandidate.totalRewardPoints} Pts)</span>
                        </div>
                      )}
                    </div>

                    {classCandidates.length === 0 ? (
                      <div className="p-6 text-center text-slate-400">
                        Belum ada siswa di kelas {cls} yang memenuhi syarat (0 pelanggaran).
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {classCandidates.map((cand, idx) => {
                          const isTop = idx === 0;
                          return (
                            <div
                              key={cand.student.id}
                              className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-50/40 transition ${
                                isTop ? 'bg-amber-50/20' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${
                                    isTop
                                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-300'
                                      : 'bg-slate-200 text-slate-700'
                                  }`}
                                >
                                  {isTop ? <Crown className="w-4 h-4" /> : `#${idx + 1}`}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900 text-sm">{cand.student.name}</span>
                                    {isTop && (
                                      <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-emerald-950 font-black text-[10px] rounded-full uppercase tracking-wider shadow-xs">
                                        ★ Murid Teladan Kelas
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                                    <span>NISN: {cand.student.nisn}</span>
                                    <span>•</span>
                                    <span className="text-emerald-700 font-bold">✓ 0 Poin Pelanggaran</span>
                                    <span>•</span>
                                    <span className="text-amber-800 font-semibold bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                                      +{cand.totalRewardPoints} Poin Reward ({cand.rewardsCount}x prestasi)
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                <button
                                  onClick={() => {
                                    const text = `*PIAGAM PENGHARGAAN SISWA TELADAN ${settings.schoolName.toUpperCase()}*\n\n` +
                                      `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${cand.student.name}* (Kelas ${cand.student.class}),\n\n` +
                                      `Kami dengan bangga menginformasikan bahwa ananda ditetapkan sebagai *SISWA TELADAN KELAS ${cand.student.class}* atas kedisiplinan prima (0 Pelanggaran) dan perolehan +${cand.totalRewardPoints} Poin Reward Prestasi.\n\n` +
                                      `Selamat dan terima kasih atas bimbingan luar biasa Bapak/Ibu di rumah!`;
                                    openWhatsApp(cand.student.parentPhone, text);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg font-semibold transition flex items-center gap-1 cursor-pointer"
                                  title="Kirim Ucapan Selamat ke WhatsApp Orang Tua"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                  <span>Kirim WA</span>
                                </button>

                                <button
                                  onClick={() => setActiveTeladanCertSummary(cand)}
                                  className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${
                                    isTop
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 shadow'
                                      : 'bg-emerald-950 hover:bg-emerald-900 text-white'
                                  }`}
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Cetak Piagam Teladan</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setTeladanSelectorOpen(false)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SERTIFIKAT TELADAN RESMI */}
      {activeTeladanCertSummary && (
        <SertifikatTeladanModal
          summary={activeTeladanCertSummary}
          settings={settings}
          onClose={() => setActiveTeladanCertSummary(null)}
        />
      )}
    </div>
  );
};
