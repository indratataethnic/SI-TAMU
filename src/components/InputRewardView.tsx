import React, { useState, useMemo } from 'react';
import { Student, RewardRule, RewardRecord, SchoolSettings } from '../types';
import {
  Award,
  Sparkles,
  Calendar,
  FileText,
  Send,
  CheckCircle2,
  Search,
  MessageSquare,
  Printer,
  GraduationCap
} from 'lucide-react';
import { openWhatsApp, generateRewardWAMessage } from '../utils/whatsapp';
import { PRIMARY_SCHOOL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';

interface InputRewardViewProps {
  students: Student[];
  rewardRules: RewardRule[];
  settings: SchoolSettings;
  preselectedStudent?: Student | null;
  onSaveReward: (reward: RewardRecord) => void;
  onOpenCertificate: (reward: RewardRecord) => void;
  onNavigateToData: () => void;
}

export const InputRewardView: React.FC<InputRewardViewProps> = ({
  students,
  rewardRules,
  settings,
  preselectedStudent,
  onSaveReward,
  onOpenCertificate,
  onNavigateToData
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent ? preselectedStudent.id : (students[0]?.id || '')
  );
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [competitionName, setCompetitionName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [rank, setRank] = useState<'Juara I' | 'Juara II' | 'Juara III' | 'Peserta Lomba' | 'Apresiasi Khusus'>('Juara I');
  const [level, setLevel] = useState<'Nasional' | 'Provinsi' | 'Kota/Kab' | 'Sekolah' | 'Umum'>('Kota/Kab');
  const [points, setPoints] = useState<number>(3);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [autoSendWA, setAutoSendWA] = useState<boolean>(true);
  const [feedbackRecord, setFeedbackRecord] = useState<RewardRecord | null>(null);

  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Auto calculate reward points according to user's formula
  const updatePoints = (newRank: string, newLevel: string) => {
    let pts = 0;
    if (newRank === 'Juara I') {
      if (newLevel === 'Nasional') pts = 9;
      else if (newLevel === 'Provinsi') pts = 6;
      else pts = 3; // Kota/Kab or Sekolah
    } else if (newRank === 'Juara II') {
      if (newLevel === 'Nasional') pts = 8;
      else if (newLevel === 'Provinsi') pts = 5;
      else pts = 2;
    } else if (newRank === 'Juara III') {
      if (newLevel === 'Nasional') pts = 7;
      else if (newLevel === 'Provinsi') pts = 4;
      else pts = 1;
    } else {
      pts = 0; // Peserta lomba
    }
    setPoints(pts);
  };

  const handleRankChange = (r: any) => {
    setRank(r);
    updatePoints(r, level);
  };

  const handleLevelChange = (l: any) => {
    setLevel(l);
    updatePoints(rank, l);
  };

  // Filter students for search with class option
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = matchClassFilter(s.class, selectedClass);
      const q = studentSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.includes(q) ||
        s.class.toLowerCase().includes(q);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, studentSearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !competitionName.trim()) {
      alert('Isi data nama siswa dan ajang lomba.');
      return;
    }

    const newReward: RewardRecord = {
      id: `REW-${Date.now()}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      ruleId: 'REWARD_GENERAL',
      ruleName: competitionName.trim(),
      competitionName: competitionName.trim(),
      rank,
      level,
      organizer: organizer.trim() || undefined,
      points: Number(points) || 0,
      date,
      reporterName: 'Koordinator Prestasi & Kesiswaan',
      certificateNumber: `PIAGAM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      notes,
      createdAt: new Date().toISOString()
    };

    onSaveReward(newReward);
    setFeedbackRecord(newReward);

    if (autoSendWA) {
      const msg = generateRewardWAMessage(selectedStudent, newReward, newReward.points, settings);
      openWhatsApp(selectedStudent.parentPhone, msg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-600 rounded-xl shadow-xs">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Formulir Input Reward & Prestasi Siswa</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Apresiasi kejuaraan dan pencapaian positif dengan poin otomatis dan penerbitan piagam.
            </p>
          </div>
        </div>
      </div>

      {feedbackRecord && (
        <div className="p-5 bg-amber-50 border-2 border-amber-300 text-amber-950 rounded-2xl text-xs space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <span className="font-bold text-sm">Prestasi {feedbackRecord.studentName} Berhasil Dicatat!</span>
            </div>
            <span className="font-black text-amber-800 text-sm bg-amber-200 px-3 py-1 rounded-full">
              +{feedbackRecord.points} Poin
            </span>
          </div>
          <p className="text-slate-700">
            {feedbackRecord.rank} - {feedbackRecord.competitionName} ({feedbackRecord.level}).
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onOpenCertificate(feedbackRecord)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl font-bold transition shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak Piagam Resmi Sekarang
            </button>
            <button
              onClick={onNavigateToData}
              className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-semibold transition cursor-pointer"
            >
              Ke Tabel Data Reward →
            </button>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        {/* Step 1: Select Student */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block font-bold text-slate-800 text-sm">1. Pilih Identitas Siswa Berprestasi</label>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-amber-700" />
              <span className="text-[11px] font-semibold text-slate-500">Pilihan Kelas:</span>
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value);
                  const firstMatch = students.find(s => matchClassFilter(s.class, e.target.value));
                  if (firstMatch) setSelectedStudentId(firstMatch.id);
                }}
                className="px-2 py-1 bg-slate-100 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none"
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

          {/* Quick Class Pills for instant filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedClass('ALL')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                selectedClass === 'ALL'
                  ? 'bg-emerald-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({students.length})
            </button>
            {PRIMARY_SCHOOL_CLASSES.map(cls => {
              const count = students.filter(s => matchClassFilter(s.class, cls)).length;
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setSelectedClass(cls);
                    const firstMatch = students.find(s => matchClassFilter(s.class, cls));
                    if (firstMatch) setSelectedStudentId(firstMatch.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1 ${
                    selectedClass === cls
                      ? 'bg-amber-500 text-emerald-950 ring-1 ring-amber-600 font-black'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>{cls}</span>
                  <span className="text-[9px] opacity-75">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Cari nama/kelas siswa..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900"
            >
              {filteredStudents.length === 0 ? (
                <option value="">Tidak ada siswa di pilihan filter ini</option>
              ) : (
                filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.class}) - NISN: {s.nisn}
                  </option>
                ))
              )}
            </select>
          </div>

          {selectedStudent && (
            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <span className="font-bold text-slate-900 text-xs block">{selectedStudent.name}</span>
                <span className="text-[11px] text-slate-600">
                  {selectedStudent.class} • NISN: {selectedStudent.nisn} • Wali: {selectedStudent.parentName}
                </span>
              </div>
              <span className="text-amber-800 bg-amber-200/80 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                Siswa Aktif
              </span>
            </div>
          )}
        </div>

        {/* Step 2: Competition Info */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">2. Data Kejuaraan / Kegiatan Prestasi</label>
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Nama Ajang Lomba / Prestasi</label>
            <input
              type="text"
              required
              value={competitionName}
              onChange={(e) => setCompetitionName(e.target.value)}
              placeholder="Contoh: Olimpiade Sains Nasional (OSN) Matematika"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Penyelenggara Ajang (Opsional)</label>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Contoh: Kemendikbudristek / Dinas Pendidikan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tanggal Piagam / Pelaksanaan</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Rank & Points Auto-Calculation */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">3. Peringkat & Kalkulasi Bobot Poin</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Capaian / Peringkat</label>
              <select
                value={rank}
                onChange={(e) => handleRankChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              >
                <option value="Juara I">Juara I</option>
                <option value="Juara II">Juara II</option>
                <option value="Juara III">Juara III</option>
                <option value="Peserta Lomba">Peserta Lomba (0 Poin)</option>
                <option value="Apresiasi Khusus">Apresiasi Khusus</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tingkat Ajang</label>
              <select
                value={level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold"
              >
                <option value="Nasional">Nasional</option>
                <option value="Provinsi">Provinsi</option>
                <option value="Kota/Kab">Kota / Kabupaten</option>
                <option value="Sekolah">Tingkat Sekolah</option>
                <option value="Umum">Umum</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">Bobot Poin Apresiasi</label>
              <input
                type="number"
                min={0}
                max={100}
                required
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 bg-amber-50 border border-amber-300 text-amber-800 rounded-lg font-black font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 4: Notes */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">4. Catatan Apresiasi (Opsional)</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Keterangan tambahan mengenai prestasi murid..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          ></textarea>
        </div>

        {/* WhatsApp Notice */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-800" />
            <div>
              <span className="font-bold text-emerald-950 block">Kirim Ucapan Selamat ke WhatsApp Orang Tua</span>
              <span className="text-[11px] text-emerald-800">
                Apresiasi resmi otomatis disiapkan untuk kontak orang tua.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={autoSendWA}
            onChange={(e) => setAutoSendWA(e.target.checked)}
            className="w-5 h-5 text-emerald-900 rounded accent-emerald-800 cursor-pointer"
          />
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onNavigateToData}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl font-bold transition shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Simpan Data Reward</span>
          </button>
        </div>
      </form>
    </div>
  );
};
