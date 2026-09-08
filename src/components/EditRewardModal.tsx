import React, { useState, useEffect, useMemo } from 'react';
import { RewardRecord, Student, Teacher, RewardRule } from '../types';
import {
  X,
  Save,
  Award,
  User,
  Calendar,
  Sparkles,
  Check,
  UserCheck,
  BadgeCheck
} from 'lucide-react';
import { getAvailableClasses } from '../data/classOptions';

interface EditRewardModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: RewardRecord | null;
  students: Student[];
  teachers?: Teacher[];
  rewardRules?: RewardRule[];
  onSave: (updatedReward: RewardRecord) => void;
}

const RANK_SUGGESTIONS = [
  'Juara 1',
  'Juara 2',
  'Juara 3',
  'Juara Harapan 1',
  'Juara Harapan 2',
  'Juara Harapan 3',
  'Juara Favorit',
  'Peserta Terbaik',
  'Peraih Medali Emas',
  'Peraih Medali Perak',
  'Peraih Medali Perunggu',
  'Finalis',
  'Apresiasi Perilaku Teladan',
  'Lainnya'
];

export const EditRewardModal: React.FC<EditRewardModalProps> = ({
  isOpen,
  onClose,
  reward,
  students,
  teachers = [],
  rewardRules = [],
  onSave
}) => {
  if (!isOpen || !reward) return null;

  const [studentId, setStudentId] = useState<string>(reward.studentId || '');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [date, setDate] = useState<string>(reward.date || new Date().toISOString().slice(0, 10));
  const [competitionName, setCompetitionName] = useState<string>(reward.competitionName || '');
  const [rank, setRank] = useState<string>(reward.rank || 'Juara 1');
  const [level, setLevel] = useState<'Nasional' | 'Provinsi' | 'Kota/Kab' | 'Sekolah' | 'Umum'>(reward.level || 'Kota/Kab');
  const [organizer, setOrganizer] = useState<string>(reward.organizer || '');
  const [points, setPoints] = useState<number>(reward.points || 3);
  const [notes, setNotes] = useState<string>(reward.notes || '');

  const [reporterTeacherId, setReporterTeacherId] = useState<string>(reward.reporterId || '');
  const [reporterName, setReporterName] = useState<string>(reward.reporterName || 'Koordinator Prestasi & Kesiswaan');
  const [reporterNip, setReporterNip] = useState<string>(reward.reporterNip || '');

  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

  // Sync state when reward changes
  useEffect(() => {
    if (reward) {
      setStudentId(reward.studentId || '');
      setDate(reward.date || new Date().toISOString().slice(0, 10));
      const initialTitle = reward.competitionName || (reward as any).title || reward.ruleName || (reward as any).prestasi || '';
      setCompetitionName(initialTitle);
      setRank(reward.rank || 'Juara 1');
      setLevel(reward.level || 'Kota/Kab');
      setOrganizer(reward.organizer || '');
      setPoints(reward.points || 3);
      setNotes(reward.notes || (reward as any).note || '');
      const initialReporter = reward.reporterName || (reward as any).recordedBy || (reward as any).reporter || (reward as any).reporterTeacherName || 'Koordinator Prestasi & Kesiswaan';
      setReporterTeacherId(reward.reporterId || '');
      setReporterName(initialReporter);
      setReporterNip(reward.reporterNip || '');
    }
  }, [reward]);

  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'ALL') return students;
    return students.filter(s => s.class === selectedClassFilter);
  }, [students, selectedClassFilter]);

  const selectedStudent = students.find(s => s.id === studentId);

  const handleSelectReporter = (teacherIdOrCustom: string) => {
    if (teacherIdOrCustom === 'custom') {
      setReporterTeacherId('');
      setReporterNip('');
      return;
    }
    const found = teachers.find(t => t.id === teacherIdOrCustom);
    if (found) {
      setReporterTeacherId(found.id);
      setReporterName(found.name);
      setReporterNip(found.nip || '');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) {
      alert('Silakan pilih siswa yang bersangkutan.');
      return;
    }
    if (!competitionName.trim()) {
      alert('Silakan isi nama ajang atau prestasi siswa.');
      return;
    }

    const finalCompetitionName = competitionName.trim();
    const finalReporterName = reporterName.trim() || 'Koordinator Prestasi & Kesiswaan';
    const finalNotes = notes.trim() || undefined;

    const updated: RewardRecord = {
      ...reward,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      date,
      competitionName: finalCompetitionName,
      ruleName: finalCompetitionName,
      rank: rank.trim() || 'Juara',
      level,
      organizer: organizer.trim() || undefined,
      points: Number(points) || 1,
      notes: finalNotes,
      reporterName: finalReporterName,
      reporterId: reporterTeacherId || undefined,
      reporterNip: reporterNip || undefined,
      // Compatibility aliases for Spreadsheet webhook
      title: finalCompetitionName,
      recordedBy: finalReporterName,
      reporterTeacherName: finalReporterName,
      note: finalNotes || ''
    } as any;

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 text-xs my-6">
        {/* Header */}
        <div className="bg-amber-600 text-white px-6 py-4 flex items-center justify-between border-b border-amber-700">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-700/50 text-amber-100 rounded-lg">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Edit Catatan Prestasi & Reward</h3>
              <p className="text-[11px] text-amber-100">Koreksi capaian kejuaraan, piagam, dan apresiasi siswa</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-amber-200 hover:text-white rounded-lg hover:bg-amber-700/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Siswa Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800 text-xs">1. Identitas Siswa Berprestasi</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Filter Kelas:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="ALL">Semua Kelas</option>
                  {availableClasses.map(c => (
                    <option key={c} value={c}>Kelas {c}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-500 block mb-1">Pilih Siswa:</span>
                <select
                  required
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="">-- Pilih Siswa --</option>
                  {filteredStudents.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Kelas {s.class} - NISN: {s.nisn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {selectedStudent && (
              <div className="mt-2 p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span className="font-bold text-slate-800">{selectedStudent.name}</span>
                  <span className="text-slate-500">• Kelas {selectedStudent.class}</span>
                </div>
                <span className="text-slate-400 font-mono text-[10px]">NISN: {selectedStudent.nisn}</span>
              </div>
            )}
          </div>

          {/* Tanggal & Poin */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Tanggal Raihan Prestasi</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Poin Apresiasi (+)</label>
              <input
                type="number"
                min={1}
                max={50}
                required
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                className="w-full px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg font-black text-xs text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Ajang & Capaian */}
          <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-200/80 space-y-3">
            <label className="block font-bold text-amber-950 text-xs">2. Informasi Ajang & Capaian Juara</label>
            
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Nama Ajang / Lomba / Kegiatan Prestasi:</span>
              <input
                type="text"
                required
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                placeholder="Contoh: Olimpiade Sains Nasional (OSN) Matematika..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Capaian / Peringkat:</span>
                <input
                  type="text"
                  required
                  list="rank-suggestions-edit"
                  value={rank}
                  onChange={(e) => setRank(e.target.value)}
                  placeholder="Contoh: Juara 1..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <datalist id="rank-suggestions-edit">
                  {RANK_SUGGESTIONS.map(r => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Tingkat Prestasi:</span>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-semibold text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <option value="Sekolah">Sekolah / Internal</option>
                  <option value="Kota/Kab">Kota / Kabupaten</option>
                  <option value="Provinsi">Tingkat Provinsi</option>
                  <option value="Nasional">Tingkat Nasional</option>
                  <option value="Umum">Umum / Lainnya</option>
                </select>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Instansi Penyelenggara:</span>
              <input
                type="text"
                value={organizer}
                onChange={(e) => setOrganizer(e.target.value)}
                placeholder="Contoh: Dinas Pendidikan / Kemendikbud..."
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Guru Pembina */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-700 text-xs">Guru Pembina / Pelapor</label>
            {teachers.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={reporterTeacherId || (teachers.some(t => t.name === reporterName) ? teachers.find(t => t.name === reporterName)?.id : 'custom')}
                  onChange={(e) => handleSelectReporter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  <optgroup label="👨‍🏫 Daftar Guru & Pembina">
                    {teachers.map(t => (
                      <option key={`rew-edt-${t.id}`} value={t.id}>
                        {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.role === 'pembina_osis' ? 'Pembina OSIS' : 'Guru'})
                      </option>
                    ))}
                  </optgroup>
                  <option value="custom">✏️ Ketik Manual / Nama Lainnya...</option>
                </select>

                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => {
                    setReporterName(e.target.value);
                    const match = teachers.find(t => t.name.toLowerCase() === e.target.value.trim().toLowerCase());
                    if (match) {
                      setReporterTeacherId(match.id);
                      setReporterNip(match.nip || '');
                    } else {
                      setReporterTeacherId('');
                      setReporterNip('');
                    }
                  }}
                  placeholder="Nama Guru Pembina / Pelapor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />

                {reporterTeacherId ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-amber-900 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
                    <BadgeCheck className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Terekam ke guru: <strong>{reporterName}</strong> {reporterNip && `(NIP: ${reporterNip})`}</span>
                  </div>
                ) : null}
              </div>
            ) : (
              <input
                type="text"
                required
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Nama Guru Pembina / Pelapor"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            )}
          </div>

          {/* Catatan Apresiasi */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Catatan Apresiasi / Keterangan Tambahan</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan prestasi atau apresiasi khusus..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
