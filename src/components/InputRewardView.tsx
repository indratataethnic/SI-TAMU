import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  GraduationCap,
  X,
  Check,
  UserCheck,
  BadgeCheck
} from 'lucide-react';
import { openWhatsApp, generateRewardWAMessage } from '../utils/whatsapp';
import { PRIMARY_SCHOOL_CLASSES, PRIMARY_SCHOOL_PARALLEL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';

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
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [competitionName, setCompetitionName] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [rank, setRank] = useState<'Juara I' | 'Juara II' | 'Juara III' | 'Peserta Lomba' | 'Apresiasi Khusus'>('Juara I');
  const [level, setLevel] = useState<'Nasional' | 'Provinsi' | 'Kota/Kab' | 'Sekolah' | 'Umum'>('Kota/Kab');
  const [points, setPoints] = useState<number>(3);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reporterTeacherId, setReporterTeacherId] = useState<string>('');
  const [reporterNip, setReporterNip] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>('Koordinator Prestasi & Kesiswaan');
  const [notes, setNotes] = useState('');
  const [autoSendWA, setAutoSendWA] = useState<boolean>(false);
  const [feedbackRecord, setFeedbackRecord] = useState<RewardRecord | null>(null);

  useEffect(() => {
    if (!reporterTeacherId && teachers && teachers.length > 0) {
      const pembina = teachers.find(t => t.role === 'pembina_osis' || t.role === 'guru_bk') || teachers[0];
      if (pembina) {
        setReporterTeacherId(pembina.id);
        setReporterName(pembina.name);
        setReporterNip(pembina.nip || '');
      }
    }
  }, [teachers]);

  const handleSelectReporter = (teacherIdOrCustom: string) => {
    if (teacherIdOrCustom === 'custom') {
      setReporterTeacherId('');
      setReporterNip('');
      return;
    }
    const found = teachers?.find(t => t.id === teacherIdOrCustom);
    if (found) {
      setReporterTeacherId(found.id);
      setReporterName(found.name);
      setReporterNip(found.nip || '');
    }
  };

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

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter students:
  // When user types a search query, search globally across ALL students.
  // When search query is empty, filter by selectedClass.
  const filteredStudents = useMemo(() => {
    const q = studentSearch.toLowerCase().trim();
    if (q) {
      return students.filter(s => {
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const nisnMatch = (s.nisn || '').includes(q);
        const classMatch = (s.class || '').toLowerCase().includes(q);
        const parentMatch = (s.parentName || '').toLowerCase().includes(q);
        return nameMatch || nisnMatch || classMatch || parentMatch;
      });
    }
    return students.filter(s => matchClassFilter(s.class, selectedClass));
  }, [students, selectedClass, studentSearch]);

  // When filtered list changes, ensure selected student stays synchronized
  useEffect(() => {
    if (filteredStudents.length > 0) {
      const isStillInList = filteredStudents.some(s => s.id === selectedStudentId);
      if (!isStillInList) {
        setSelectedStudentId(filteredStudents[0].id);
      }
    }
  }, [filteredStudents, selectedStudentId]);

  const handleSelectStudent = (student: Student) => {
    setSelectedStudentId(student.id);
    if (student.class && selectedClass !== 'ALL' && !matchClassFilter(student.class, selectedClass)) {
      setSelectedClass(student.class);
    }
    setStudentSearch('');
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !competitionName.trim()) {
      alert('Isi data nama siswa dan ajang lomba.');
      return;
    }

    const newReward: RewardRecord = {
      id: `REW-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
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
      reporterId: reporterTeacherId || undefined,
      reporterNip: reporterNip || undefined,
      certificateNumber: `PIAGAM/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
      notes,
      academicYear: settings.academicYear || '2026/2027',
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
                <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Class Pills for instant filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => {
                setSelectedClass('ALL');
                setStudentSearch('');
              }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition ${
                selectedClass === 'ALL' && !studentSearch.trim()
                  ? 'bg-amber-500 text-emerald-950 ring-1 ring-amber-600 font-black'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua ({students.length})
            </button>
            {availableClasses.map(cls => {
              const count = students.filter(s => matchClassFilter(s.class, cls)).length;
              const isActive = selectedClass === cls && !studentSearch.trim();
              return (
                <button
                  key={cls}
                  type="button"
                  onClick={() => {
                    setSelectedClass(cls);
                    setStudentSearch('');
                    const firstMatch = students.find(s => matchClassFilter(s.class, cls));
                    if (firstMatch) setSelectedStudentId(firstMatch.id);
                  }}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold cursor-pointer transition flex items-center gap-1 shrink-0 ${
                    isActive
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

          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Search Box with Autocomplete suggestions */}
              <div className="relative" ref={searchContainerRef}>
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onFocus={() => {
                    if (studentSearch.trim()) setShowSuggestions(true);
                  }}
                  onChange={(e) => {
                    setStudentSearch(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault(); // Prevent accidental form submit
                      if (filteredStudents.length > 0) {
                        handleSelectStudent(filteredStudents[0]);
                      }
                    } else if (e.key === 'Escape') {
                      setShowSuggestions(false);
                    }
                  }}
                  placeholder="Ketik nama, NISN, atau kelas..."
                  className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-900 text-xs sm:text-sm"
                />
                {studentSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setStudentSearch('');
                      setShowSuggestions(false);
                    }}
                    className="absolute right-2.5 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition cursor-pointer"
                    title="Hapus kata kunci pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Suggestions Dropdown */}
                {showSuggestions && studentSearch.trim().length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                    <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase flex items-center justify-between sticky top-0">
                      <span>Hasil Pencarian Siswa</span>
                      <span className="text-emerald-700 font-bold">{filteredStudents.length} ditemukan</span>
                    </div>
                    {filteredStudents.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500 text-center italic">
                        Tidak ditemukan siswa dengan kata kunci "{studentSearch}"
                      </div>
                    ) : (
                      filteredStudents.slice(0, 8).map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => handleSelectStudent(s)}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-amber-50 transition cursor-pointer ${
                            selectedStudentId === s.id ? 'bg-amber-50/80 font-bold' : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded text-[10px] font-semibold">
                                {s.class}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-500">
                              NISN: {s.nisn} • Wali: {s.parentName || '-'}
                            </div>
                          </div>
                          {selectedStudentId === s.id && (
                            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Synchronized Select Dropdown */}
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  const found = students.find(s => s.id === e.target.value);
                  if (found && found.class && selectedClass !== 'ALL' && !matchClassFilter(found.class, selectedClass)) {
                    setSelectedClass(found.class);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900 text-xs sm:text-sm"
              >
                {filteredStudents.length === 0 ? (
                  <option value="">Tidak ada siswa yang cocok</option>
                ) : (
                  filteredStudents.map((s, idx) => (
                    <option key={`${s.id || 'stu'}-${idx}`} value={s.id}>
                      {s.name} ({s.class}) - NISN: {s.nisn}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Match info text if searching */}
            {studentSearch.trim() && (
              <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                <span>
                  Menampilkan <b>{filteredStudents.length}</b> hasil untuk kata kunci "<b>{studentSearch}</b>" di seluruh kelas
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setStudentSearch('');
                    setShowSuggestions(false);
                  }}
                  className="text-emerald-700 hover:text-emerald-900 font-semibold cursor-pointer underline"
                >
                  Tampilkan Semua Siswa
                </button>
              </div>
            )}
          </div>

          {selectedStudent && (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm block">{selectedStudent.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-800 text-white font-bold text-[10px] rounded-full">
                    {selectedStudent.class}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-medium text-[10px] rounded-full font-mono">
                    NISN: {selectedStudent.nisn}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1">
                  Wali: <b>{selectedStudent.parentName || '-'}</b> • WhatsApp: <b>{selectedStudent.parentPhone || '-'}</b>
                </div>
              </div>
              <span className="text-emerald-900 bg-emerald-100/90 px-2.5 py-1 rounded-full font-bold text-[11px] flex items-center gap-1 shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-700" />
                Siswa Aktif Terpilih
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

        {/* Step 4: Teacher / Supervisor */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">4. Guru Pembina / Pelapor Prestasi</label>
          {teachers && teachers.length > 0 ? (
            <div className="space-y-1.5">
              <select
                value={reporterTeacherId || (teachers.some(t => t.name === reporterName) ? teachers.find(t => t.name === reporterName)?.id : 'custom')}
                onChange={(e) => handleSelectReporter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs text-slate-800"
              >
                <optgroup label="👨‍🏫 Daftar Guru Pembina & Wali Kelas">
                  {teachers.map(t => (
                    <option key={`rew-tch-${t.id}`} value={t.id}>
                      {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.role === 'pembina_osis' ? 'Pembina OSIS/Kesiswaan' : t.role === 'guru_bk' ? 'Guru BK' : 'Guru Mapel'})
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
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
              />

              {reporterTeacherId ? (
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>
                    Terekam ke profil: <strong>{reporterName}</strong> {reporterNip && `(NIP: ${reporterNip})`}
                  </span>
                </div>
              ) : reporterName ? (
                <div className="text-[11px] text-slate-500 italic px-1">
                  Pencatat manual: {reporterName}
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
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
            />
          )}
        </div>

        {/* Step 5: Notes */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">5. Catatan Apresiasi (Opsional)</label>
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
