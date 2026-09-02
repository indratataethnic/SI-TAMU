import React, { useState, useMemo } from 'react';
import { Student, StudentScoreSummary, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings } from '../types';
import {
  Search,
  Key,
  ShieldCheck,
  Award,
  AlertTriangle,
  HeartHandshake,
  Printer,
  MessageSquare,
  Sparkles,
  CheckCircle2,
  Calendar,
  Lock,
  User,
  ExternalLink,
  GraduationCap
} from 'lucide-react';
import { openWhatsApp } from '../utils/whatsapp';
import { PRIMARY_SCHOOL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';

interface PublicPortalViewProps {
  students: Student[];
  summaries: StudentScoreSummary[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  compensations: CompensationRecord[];
  settings: SchoolSettings;
  onOpenSertifikat: (reward: RewardRecord) => void;
}

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({
  students,
  summaries,
  violations,
  rewards,
  compensations,
  settings,
  onOpenSertifikat
}) => {
  const [inputNisn, setInputNisn] = useState('');
  const [inputAccessCode, setInputAccessCode] = useState('');
  const [filterClass, setFilterClass] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

  const filteredQuickStudents = useMemo(() => {
    return students.filter(s => matchClassFilter(s.class, filterClass));
  }, [students, filterClass]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanNisn = inputNisn.trim();
    const cleanCode = inputAccessCode.trim().toUpperCase();

    if (!cleanNisn) {
      setErrorMessage('Silakan masukkan NIK, NISN, atau nama siswa.');
      return;
    }

    const found = students.find(s =>
      (s.nik && s.nik.trim() === cleanNisn) ||
      s.nisn.trim() === cleanNisn ||
      s.name.toLowerCase().includes(cleanNisn.toLowerCase())
    );

    if (!found) {
      setErrorMessage('Data siswa dengan NIK / NISN / nama tersebut tidak ditemukan.');
      return;
    }

    // Check access code if student has one configured
    if (found.accessCode && cleanCode && found.accessCode.toUpperCase() !== cleanCode) {
      setErrorMessage('Kode Akses Orang Tua tidak sesuai.');
      return;
    }

    setSelectedStudent(found);
  };

  const handleSelectDirect = (student: Student) => {
    setSelectedStudent(student);
    setInputNisn(student.nik || student.nisn);
    setInputAccessCode(student.accessCode || '');
  };

  const studentSummary = selectedStudent
    ? summaries.find(s => s.student.id === selectedStudent.id)
    : null;

  const studentViolations = selectedStudent
    ? violations.filter(v => v.studentId === selectedStudent.id)
    : [];

  const studentRewards = selectedStudent
    ? rewards.filter(r => r.studentId === selectedStudent.id)
    : [];

  const studentCompensations = selectedStudent
    ? compensations.filter(c => c.studentId === selectedStudent.id)
    : [];

  const handleContactBK = () => {
    if (!selectedStudent) return;
    const bkPhone = settings.bkCoordinatorPhone || settings.schoolPhone || '';
    if (!bkPhone) {
      alert('Nomor kontak Guru BK atau nomor telepon sekolah belum diisi di Pengaturan.');
      return;
    }
    const text = `Halo Bapak/Ibu Guru BK ${settings.schoolName || 'Sekolah'}, saya orang tua dari ananda *${selectedStudent.name}* (Kelas ${selectedStudent.class}). Saya ingin berkonsultasi mengenai perkembangan tata tertib dan poin kedisiplinan ananda. Terima kasih.`;
    openWhatsApp(bkPhone, text);
  };

  const handlePrintTranscript = () => {
    window.print();
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 border border-emerald-800 shadow-xl relative overflow-hidden no-print">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 border border-amber-400/40 rounded-full text-amber-300 text-xs font-semibold">
            <Search className="w-3.5 h-3.5 text-amber-400" />
            <span>Layanan Mandiri Orang Tua & Murid</span>
          </div>
          <h2 className="text-2xl font-black text-white">
            Portal Cek Poin & Transkrip Tata Tertib Siswa
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
            Periksa catatan poin kedisiplinan, riwayat tugas kompensasi, dan capaian piagam prestasi ananda secara transparan.
          </p>
        </div>
      </div>

      {/* Login / Search Box */}
      {!selectedStudent && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 no-print">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Lock className="w-5 h-5 text-emerald-800" />
            Akses Rekam Jejak Siswa
          </h3>

          <form onSubmit={handleSearch} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIK, NISN, atau Nama Lengkap Siswa
                </label>
                <input
                  type="text"
                  required
                  value={inputNisn}
                  onChange={(e) => setInputNisn(e.target.value)}
                  placeholder="Contoh: 351501... (NIK) / 0089123401 (NISN)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kode Akses Wali Murid (Opsional)
                </label>
                <input
                  type="text"
                  value={inputAccessCode}
                  onChange={(e) => setInputAccessCode(e.target.value)}
                  placeholder="Contoh: AHMAD7A (Jika ada)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            {errorMessage && (
              <p className="text-rose-600 font-semibold text-xs bg-rose-50 p-3 rounded-xl border border-rose-200">
                ⚠️ {errorMessage}
              </p>
            )}

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl font-bold transition shadow cursor-pointer text-xs"
            >
              <Search className="w-4 h-4" />
              <span>Cek Rekam Jejak Siswa</span>
            </button>
          </form>

          {/* Quick Picker for Demo & Parents Convenience */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-slate-500 text-xs font-semibold flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-800" />
                Pilih Berdasarkan Kelas:
              </span>
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setFilterClass('ALL')}
                  className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                    filterClass === 'ALL'
                      ? 'bg-emerald-950 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {availableClasses.map(cls => (
                  <button
                    key={cls}
                    type="button"
                    onClick={() => setFilterClass(cls)}
                    className={`px-2 py-1 rounded-md text-[11px] font-bold cursor-pointer transition shrink-0 ${
                      filterClass === cls
                        ? 'bg-emerald-900 text-amber-300 ring-1 ring-amber-400'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cls}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {filteredQuickStudents.length === 0 ? (
                <span className="text-xs text-slate-400 italic">Tidak ada data siswa untuk kelas ini.</span>
              ) : (
                filteredQuickStudents.slice(0, 10).map((s, idx) => (
                  <button
                    key={`${s.id || 's'}-${idx}`}
                    onClick={() => handleSelectDirect(s)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 hover:text-emerald-900 text-slate-700 rounded-lg text-xs font-semibold transition cursor-pointer border border-slate-200"
                  >
                    {s.name} ({s.class})
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Student Scorecard Profile (When Selected) */}
      {selectedStudent && (
        <div className="space-y-6">
          {/* Top Profile Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 border-2 border-amber-400 text-amber-300 flex items-center justify-center font-black text-xl shadow-md">
                  {selectedStudent.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-slate-900">{selectedStudent.name}</h3>
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-900 rounded-full font-bold text-xs">
                      Kelas {selectedStudent.class}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Wali Murid: <span className="font-semibold text-slate-700">{selectedStudent.parentName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 no-print">
                <button
                  onClick={handlePrintTranscript}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Transkrip</span>
                </button>
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Ganti Siswa
                </button>
              </div>
            </div>

            {/* Score Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Pelanggaran</span>
                <span className="text-2xl font-black text-rose-700">{studentSummary?.totalViolationPoints || 0}</span>
                <span className="text-[10px] text-slate-400 block">{studentSummary?.violationsCount || 0} Kali Tercatat</span>
              </div>

              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Tugas Kompensasi</span>
                <span className="text-2xl font-black text-emerald-800">-{studentSummary?.totalCompensationPoints || 0}</span>
                <span className="text-[10px] text-emerald-600 block">Poin Berhasil Direduksi</span>
              </div>

              <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-800 text-center shadow">
                <span className="text-[10px] uppercase font-bold text-amber-300 block">Poin Pelanggaran Aktif</span>
                <span className="text-2xl font-black text-white">{studentSummary?.activeViolationPoints || 0}</span>
                <span className="text-[10px] text-emerald-300 block">{studentSummary?.statusBadge}</span>
              </div>

              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Poin Reward Prestasi</span>
                <span className="text-2xl font-black text-amber-700">+{studentSummary?.totalRewardPoints || 0}</span>
                <span className="text-[10px] text-amber-600 block">{studentSummary?.rewardsCount || 0} Piagam</span>
              </div>
            </div>

            {/* Contact BK Hotline */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 no-print">
              <div className="space-y-0.5">
                <h4 className="font-bold text-emerald-950 text-xs">Konsultasi BK & Permohonan Kompensasi</h4>
                <p className="text-[11px] text-emerald-800">
                  Orang tua dapat berdiskusi dengan koordinator BK ({settings.bkCoordinatorName}) untuk pembinaan atau pengajuan pengurangan poin.
                </p>
              </div>
              <button
                onClick={handleContactBK}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer shrink-0"
              >
                <MessageSquare className="w-4 h-4" />
                Hubungi Guru BK di WA
              </button>
            </div>
          </div>

          {/* Violations Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Catatan Pelanggaran Tata Tertib
            </h4>

            {studentViolations.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-500 text-xs font-medium">
                🎉 Bersih! Tidak ada catatan pelanggaran tata tertib atas nama siswa ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {studentViolations.map((v, idx) => (
                  <div key={`${v.id || 'v'}-${idx}`} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{v.ruleName}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
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
                      <p className="text-slate-600 italic">"{v.description}"</p>
                      <p className="text-[11px] text-slate-400">
                        {v.date} {v.time ? `• ${v.time}` : ''} • Saksi/Pencatat: {v.reporterName}
                      </p>
                    </div>
                    <span className="font-black text-rose-700 text-sm bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shrink-0">
                      +{v.points} Pt
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Compensations Timeline */}
          {studentCompensations.length > 0 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                Catatan Tugas Kompensasi (Pengurangan Poin)
              </h4>
              <div className="divide-y divide-slate-100 text-xs">
                {studentCompensations.map((c, idx) => (
                  <div key={`${c.id || 'c'}-${idx}`} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="font-bold text-slate-900 block">{c.taskName}</span>
                      <p className="text-[11px] text-slate-500">
                        {c.date} • Pembina: {c.supervisorName} {c.notes ? `• "${c.notes}"` : ''}
                      </p>
                    </div>
                    <span className="font-black text-emerald-700 text-sm bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                      -{c.deductedPoints} Pt
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rewards Timeline */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Piagam Prestasi & Capaian Positif
            </h4>

            {studentRewards.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                Belum ada rekam prestasi kejuaraan yang tercatat.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {studentRewards.map((r, idx) => (
                  <div key={`${r.id || 'r'}-${idx}`} className="py-3 flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">{r.competitionName}</span>
                        <span className="px-2 py-0.5 bg-amber-50 text-amber-800 font-bold border border-amber-200 rounded text-[10px]">
                          {r.rank}
                        </span>
                        <span className="text-slate-500 font-medium text-[11px]">{r.level}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {r.date} {r.organizer ? `• Penyelenggara: ${r.organizer}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-amber-700 text-sm bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        +{r.points} Pt
                      </span>
                      <button
                        onClick={() => onOpenSertifikat(r)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-lg transition shadow-xs cursor-pointer no-print"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Piagam</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
