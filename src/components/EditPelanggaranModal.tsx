import React, { useState, useEffect, useMemo } from 'react';
import { ViolationRecord, Student, Teacher, PiketSchedule, ViolationRule } from '../types';
import {
  X,
  Save,
  AlertTriangle,
  User,
  Calendar,
  Clock,
  MapPin,
  Check,
  UserCheck,
  BadgeCheck,
  CalendarCheck
} from 'lucide-react';
import { getDayNameFromDate } from '../utils/storage';
import { getAvailableClasses } from '../data/classOptions';

const LOCATION_OPTIONS = [
  'Ruang Kelas',
  'Halaman Sekolah / Lapangan',
  'Kantin Sekolah',
  'Toilet / Kamar Mandi',
  'Perpustakaan',
  'Laboratorium Komputer/IPA',
  'Musholla / Masjid Sekolah',
  'Gerbang / Pagar Sekolah',
  'Tempat Parkir',
  'Luar Pagar / Sekitar Sekolah',
  'Lainnya'
];

interface EditPelanggaranModalProps {
  isOpen: boolean;
  onClose: () => void;
  violation: ViolationRecord | null;
  students: Student[];
  teachers?: Teacher[];
  piketSchedules?: PiketSchedule[];
  violationRules: ViolationRule[];
  onSave: (updatedViolation: ViolationRecord) => void;
}

export const EditPelanggaranModal: React.FC<EditPelanggaranModalProps> = ({
  isOpen,
  onClose,
  violation,
  students,
  teachers = [],
  piketSchedules = [],
  violationRules,
  onSave
}) => {
  if (!isOpen || !violation) return null;

  const [studentId, setStudentId] = useState<string>(violation.studentId || '');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [date, setDate] = useState<string>(violation.date || new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(violation.time || '');
  const [location, setLocation] = useState<string>(violation.location || 'Ruang Kelas');
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');
  const [ruleName, setRuleName] = useState<string>(violation.ruleName || '');
  const [category, setCategory] = useState<'ringan' | 'sedang' | 'berat'>(violation.category || 'ringan');
  const [points, setPoints] = useState<number>(violation.points || 5);
  const [description, setDescription] = useState<string>(violation.description || '');

  const [reporterTeacherId, setReporterTeacherId] = useState<string>(violation.reporterId || '');
  const [reporterName, setReporterName] = useState<string>(violation.reporterName || 'Guru Piket');
  const [reporterNip, setReporterNip] = useState<string>(violation.reporterNip || '');

  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

  // Sync when violation changes
  useEffect(() => {
    if (violation) {
      setStudentId(violation.studentId || '');
      setDate(violation.date || new Date().toISOString().slice(0, 10));
      setTime(violation.time || '');
      setLocation(violation.location || 'Ruang Kelas');
      const initialRuleName = violation.ruleName || (violation as any).pelanggaran || (violation as any).violationName || (violation as any).description || '';
      setRuleName(initialRuleName);
      setCategory(violation.category || 'ringan');
      setPoints(violation.points || 5);
      setDescription(violation.description || initialRuleName || '');
      
      const initialReporter = violation.reporterName || (violation as any).reporter || (violation as any).reporterTeacherName || 'Guru Piket';
      setReporterTeacherId(violation.reporterId || '');
      setReporterName(initialReporter);
      setReporterNip(violation.reporterNip || '');

      // Try finding rule in catalog
      const matchedRule = violationRules.find(r => r.name.toLowerCase() === initialRuleName.toLowerCase());
      if (matchedRule) {
        setSelectedRuleId(matchedRule.id);
      } else {
        setSelectedRuleId('custom');
      }
    }
  }, [violation, violationRules]);

  const currentDayName = useMemo(() => getDayNameFromDate(date), [date]);

  const todayDutyTeachers = useMemo(() => {
    const sched = (piketSchedules || []).find(p => p.day === currentDayName);
    if (!sched || !sched.teacherIds) return [];
    return (teachers || []).filter(t => sched.teacherIds.includes(t.id));
  }, [piketSchedules, currentDayName, teachers]);

  const filteredStudents = useMemo(() => {
    if (selectedClassFilter === 'ALL') return students;
    return students.filter(s => s.class === selectedClassFilter);
  }, [students, selectedClassFilter]);

  const selectedStudent = students.find(s => s.id === studentId);

  const handleRuleSelect = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    if (ruleId === 'custom') return;
    const found = violationRules.find(r => r.id === ruleId);
    if (found) {
      setRuleName(found.name);
      setCategory(found.category);
      setPoints(found.points);
      // Synchronize description if it was empty or matched the old rule name
      if (!description.trim() || description.trim() === ruleName.trim()) {
        setDescription(found.name);
      }
    }
  };

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
    if (!ruleName.trim()) {
      alert('Silakan isi jenis pelanggaran.');
      return;
    }

    const finalRuleName = ruleName.trim();
    const finalReporterName = reporterName.trim() || 'Guru Piket';
    const finalDescription = description.trim() || finalRuleName;

    const updated: ViolationRecord = {
      ...violation,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      date,
      time: time || undefined,
      location: location.trim() || undefined,
      ruleName: finalRuleName,
      category,
      points: Number(points) || 1,
      description: finalDescription,
      reporterName: finalReporterName,
      reporterId: reporterTeacherId || undefined,
      reporterNip: reporterNip || undefined,
      // Comprehensive dual-mapping for Google Spreadsheet Webhook & backward compatibility
      reporter: finalReporterName,
      reporterTeacherName: finalReporterName,
      violationName: finalRuleName,
      pelanggaran: finalRuleName,
      note: finalDescription
    } as any;

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 text-xs my-6">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-500/20 text-rose-400 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-100">Edit Catatan Pelanggaran</h3>
              <p className="text-[11px] text-emerald-300">Koreksi data pelanggaran siswa dan penyesuaian poin</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-emerald-900/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Siswa Selector */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <label className="block font-bold text-slate-800 text-xs">1. Identitas Siswa Terkait</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Filter Kelas:</span>
                <select
                  value={selectedClassFilter}
                  onChange={(e) => setSelectedClassFilter(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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

          {/* Tanggal, Waktu & Lokasi */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Tanggal Kejadian</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Waktu / Jam</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 text-xs mb-1">Lokasi Kejadian</label>
              <select
                value={LOCATION_OPTIONS.includes(location) ? location : 'Lainnya'}
                onChange={(e) => {
                  if (e.target.value !== 'Lainnya') setLocation(e.target.value);
                  else setLocation('');
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                {LOCATION_OPTIONS.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              {!LOCATION_OPTIONS.includes(location) && (
                <input
                  type="text"
                  placeholder="Ketik lokasi spesifik..."
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full mt-1.5 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              )}
            </div>
          </div>

          {/* Pelanggaran & Poin */}
          <div className="bg-rose-50/50 p-3.5 rounded-xl border border-rose-200/80 space-y-3">
            <label className="block font-bold text-rose-950 text-xs">2. Jenis Pelanggaran & Bobot Poin</label>
            
            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Pilih dari Master Tata Tertib:</span>
              <select
                value={selectedRuleId}
                onChange={(e) => handleRuleSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="custom">✏️ Masukkan Pelanggaran Khusus / Manual</option>
                {violationRules.map(r => (
                  <option key={r.id} value={r.id}>
                    [{r.category.toUpperCase()}] {r.name} (+{r.points} Poin)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="sm:col-span-2">
                <span className="text-[10px] text-slate-500 block mb-1">Nama Jenis Pelanggaran:</span>
                <input
                  type="text"
                  required
                  value={ruleName}
                  onChange={(e) => setRuleName(e.target.value)}
                  placeholder="Nama pelanggaran..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-xs text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <span className="text-[10px] text-slate-500 block mb-1">Bobot Poin (+):</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={points}
                  onChange={(e) => setPoints(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-rose-300 text-rose-800 rounded-lg font-black text-xs text-center focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 block mb-1">Kategori Pelanggaran:</span>
              <div className="flex gap-2">
                {(['ringan', 'sedang', 'berat'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border capitalize transition cursor-pointer ${
                      category === cat
                        ? cat === 'berat'
                          ? 'bg-rose-700 text-white border-rose-800'
                          : cat === 'sedang'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-emerald-700 text-white border-emerald-800'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guru Pencatat */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-700 text-xs">Guru Pencatat / Tim Piket</label>
              {currentDayName && (
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Piket: {currentDayName}
                </span>
              )}
            </div>

            {todayDutyTeachers.length > 0 && (
              <div className="bg-emerald-50/70 p-2 rounded-lg border border-emerald-200 space-y-1">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Guru Piket Hari {currentDayName}:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {todayDutyTeachers.map(dt => {
                    const isSelected = reporterTeacherId === dt.id || reporterName === dt.name;
                    return (
                      <button
                        key={dt.id}
                        type="button"
                        onClick={() => handleSelectReporter(dt.id)}
                        className={`px-2 py-0.5 text-xs font-semibold rounded-md transition flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white text-emerald-900 hover:bg-emerald-100 border border-emerald-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-3 h-3 text-white" /> : <UserCheck className="w-3 h-3 text-emerald-600" />}
                        <span>{dt.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {teachers.length > 0 ? (
              <div className="space-y-1.5">
                <select
                  value={reporterTeacherId || (teachers.some(t => t.name === reporterName) ? teachers.find(t => t.name === reporterName)?.id : 'custom')}
                  onChange={(e) => handleSelectReporter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  <optgroup label="👨‍🏫 Seluruh Guru & Petugas">
                    {teachers.map(t => (
                      <option key={`edt-tch-${t.id}`} value={t.id}>
                        {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.role === 'guru_bk' ? 'Guru BK' : 'Guru'})
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
                  placeholder="Nama Guru / Petugas Pencatat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />

                {reporterTeacherId ? (
                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
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
                placeholder="Nama Guru / Petugas Pencatat"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            )}
          </div>

          {/* Kronologi / Deskripsi */}
          <div>
            <label className="block font-semibold text-slate-700 text-xs mb-1">Kronologi / Catatan Kejadian</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Jelaskan detail kejadian atau kronologi singkat..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs leading-relaxed focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-md transition cursor-pointer"
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
