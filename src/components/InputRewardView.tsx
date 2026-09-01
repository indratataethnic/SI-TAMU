import React, { useState, useEffect } from 'react';
import { Student, Teacher, RewardRule, RewardRecord, SchoolSettings } from '../types';
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

interface InputRewardViewProps {
  students: Student[];
  teachers?: Teacher[];
  rewardRules: RewardRule[];
  settings: SchoolSettings;
  preselectedStudent?: Student | null;
  onSaveReward: (reward: RewardRecord) => void;
  onOpenCertificate: (reward: RewardRecord) => void;
  onNavigateToData: () => void;
}

export const InputRewardView: React.FC<InputRewardViewProps> = ({
  students,
  teachers = [],
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
  const [studentSearch, setStudentSearch] = useState('');
  const [competitionName, setCompetitionName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [rank, setRank] = useState<'Juara I' | 'Juara II' | 'Juara III' | 'Peserta Lomba' | 'Apresiasi Khusus'>('Juara I');
  const [level, setLevel] = useState<'Nasional' | 'Provinsi' | 'Kota/Kab' | 'Sekolah' | 'Umum'>('Kota/Kab');
  const [points, setPoints] = useState<number>(3);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');

  // Teacher connection
  const initialTeacher = teachers[0];
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(initialTeacher?.id || '');
  const [reporterName, setReporterName] = useState<string>(initialTeacher?.name || 'Koordinator Kesiswaan & Prestasi');
  const [reporterNip, setReporterNip] = useState<string>(initialTeacher?.nip || '');
  const [isCustomReporter, setIsCustomReporter] = useState<boolean>(teachers.length === 0);

  const [autoSendWA, setAutoSendWA] = useState<boolean>(true);
  const [feedbackRecord, setFeedbackRecord] = useState<RewardRecord | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  useEffect(() => {
    if (teachers.length > 0 && !isCustomReporter && !selectedTeacherId) {
      setSelectedTeacherId(teachers[0].id);
      setReporterName(teachers[0].name);
      setReporterNip(teachers[0].nip);
    }
  }, [teachers, isCustomReporter, selectedTeacherId]);

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

  // Filter students for search
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.nisn.includes(studentSearch) ||
    s.class.toLowerCase().includes(studentSearch.toLowerCase())
  );

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
      reporterName: reporterName.trim() || 'Koordinator Prestasi & Kesiswaan',
      reporterNip: reporterNip.trim() || undefined,
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
        <div className="space-y-2">
          <label className="block font-bold text-slate-800 text-sm">1. Pilih Identitas Siswa Berprestasi</label>
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-semibold text-slate-900"
            >
              {filteredStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.class}) - NISN: {s.nisn}
                </option>
              ))}
            </select>
          </div>
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

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-600 text-xs sm:text-sm">
                  Guru Pembina / Pelapor Prestasi
                </label>
                {teachers.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsCustomReporter(!isCustomReporter)}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold underline"
                  >
                    {isCustomReporter ? '← Pilih dari Database Guru' : 'Ketik Manual...'}
                  </button>
                )}
              </div>

              {!isCustomReporter && teachers.length > 0 ? (
                <select
                  value={selectedTeacherId}
                  onChange={(e) => {
                    const tId = e.target.value;
                    setSelectedTeacherId(tId);
                    const t = teachers.find(item => item.id === tId);
                    if (t) {
                      setReporterName(t.name);
                      setReporterNip(t.nip);
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-900 text-xs sm:text-sm"
                >
                  <optgroup label="Daftar Guru & GTK Sekolah">
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.role}{t.assignedClass ? ` (Wali Kelas ${t.assignedClass})` : ''}
                      </option>
                    ))}
                  </optgroup>
                </select>
              ) : (
                <input
                  type="text"
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Nama Guru Pembina / Pelapor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs sm:text-sm"
                />
              )}
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
