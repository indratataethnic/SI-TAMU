import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, Teacher, PiketSchedule, ViolationRule, ViolationRecord, SchoolSettings, StudentScoreSummary } from '../types';
import {
  AlertTriangle,
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Send,
  CheckCircle2,
  Search,
  MessageSquare,
  ShieldCheck,
  GraduationCap,
  X,
  Check,
  Eye,
  ArrowRight,
  PlusCircle,
  Share2,
  Sparkles,
  Volume2,
  UserCheck,
  CalendarCheck,
  BadgeCheck
} from 'lucide-react';
import { openWhatsApp, generateViolationWAMessage, sendViaGateway } from '../utils/whatsapp';
import { PRIMARY_SCHOOL_CLASSES, PRIMARY_SCHOOL_PARALLEL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';
import { getDayNameFromDate } from '../utils/storage';

const LOCATION_OPTIONS = [
  'Ruang Kelas',
  'Gerbang Utama Sekolah',
  'Halaman / Lapangan Upacara',
  'Kantin Sekolah',
  'Toilet / Kamar Mandi Siswa',
  'Perpustakaan Sekolah',
  'Laboratorium Komputer / IPA',
  'Musholla / Tempat Ibadah',
  'Koridor / Lorong Kelas',
  'Area Parkir Sekolah',
  'UKS (Ruang Kesehatan)',
  'Luar Pagar / Sekitar Sekolah',
  'Lainnya (Ketik Manual)'
];

const CHRONOLOGY_TEMPLATES = [
  'Siswa tiba di sekolah terlambat melewati bel masuk dan jam apel pagi.',
  'Siswa tidak mengenakan atribut seragam lengkap (topi/dasi/kaos kaki) sesuai ketentuan.',
  'Siswa izin keluar ruang kelas saat KBM berlangsung dan tidak kunjung kembali.',
  'Siswa kedapatan meninggalkan area sekolah tanpa izin petugas piket (membolos).',
  'Siswa membuat kegaduhan / bercanda berlebihan dan mengganggu ketenangan KBM.',
  'Siswa kedapatan membawa barang / gawai yang dilarang dalam tata tertib sekolah.',
  'Siswa bersikap tidak sopan dan membantah arahan dari bapak/ibu guru.',
  'Siswa terlibat perselisihan / perkelahian dengan sesama siswa di lingkungan sekolah.',
  'Siswa kedapatan merusak / mencoret fasilitas inventaris sekolah.',
  'Siswa tidak masuk sekolah tanpa surat pemberitahuan dari orang tua/wali (alpa).',
  'Siswa tidak mengikuti upacara bendera / apel rutin tanpa keterangan sah.'
];

// Soft native chime via Web Audio API as a clear audio cue
const playSuccessSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
    osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (e) {
    // audio not supported or blocked, graceful fallback
  }
};

interface InputPelanggaranViewProps {
  students: Student[];
  teachers?: Teacher[];
  piketSchedules?: PiketSchedule[];
  violationRules: ViolationRule[];
  summaries: StudentScoreSummary[];
  settings: SchoolSettings;
  preselectedStudent?: Student | null;
  onSaveViolation: (violation: ViolationRecord) => void;
  onNavigateToData: () => void;
}

export const InputPelanggaranView: React.FC<InputPelanggaranViewProps> = ({
  students,
  teachers = [],
  piketSchedules = [],
  violationRules,
  summaries,
  settings,
  preselectedStudent,
  onSaveViolation,
  onNavigateToData
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>(
    preselectedStudent ? preselectedStudent.id : (students[0]?.id || '')
  );
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [studentSearch, setStudentSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [selectedRuleId, setSelectedRuleId] = useState<string>(violationRules[0]?.id || '');
  const [customPoints, setCustomPoints] = useState<number>(violationRules[0]?.points || 20);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  const [location, setLocation] = useState<string>('Ruang Kelas');
  const [description, setDescription] = useState<string>('');
  
  const currentDayName = useMemo(() => getDayNameFromDate(date), [date]);

  const todayPiketSchedule = useMemo(() => {
    return (piketSchedules || []).find(p => p.day === currentDayName);
  }, [piketSchedules, currentDayName]);

  const todayDutyTeachers = useMemo(() => {
    if (!todayPiketSchedule || !todayPiketSchedule.teacherIds || todayPiketSchedule.teacherIds.length === 0) {
      return [];
    }
    return (teachers || []).filter(t => todayPiketSchedule.teacherIds.includes(t.id));
  }, [todayPiketSchedule, teachers]);

  const [reporterTeacherId, setReporterTeacherId] = useState<string>('');
  const [reporterNip, setReporterNip] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>(settings.bkCoordinatorName || 'Guru Piket');

  // Set initial duty teacher on mount or when duty teachers change
  useEffect(() => {
    if (todayDutyTeachers.length > 0) {
      if (!reporterTeacherId || !reporterName || reporterName === 'Guru Piket' || reporterName === (settings.bkCoordinatorName || '')) {
        const first = todayDutyTeachers[0];
        setReporterTeacherId(first.id);
        setReporterName(first.name);
        setReporterNip(first.nip || '');
      }
    } else if (!reporterTeacherId && teachers.length > 0) {
      const defaultTeacher = teachers.find(t => t.name === settings.bkCoordinatorName) || teachers[0];
      if (defaultTeacher) {
        setReporterTeacherId(defaultTeacher.id);
        setReporterName(defaultTeacher.name);
        setReporterNip(defaultTeacher.nip || '');
      }
    }
  }, [currentDayName, todayDutyTeachers, teachers]);

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

  const [autoSendWA, setAutoSendWA] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // States for clear notification indicators
  const [submitState, setSubmitState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [floatingToast, setFloatingToast] = useState<{
    show: boolean;
    studentName: string;
    ruleName: string;
    points: number;
  } | null>(null);
  const [successModalRecord, setSuccessModalRecord] = useState<{
    record: ViolationRecord;
    student: Student;
    activePoints: number;
    wasWASent: boolean;
  } | null>(null);

  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

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

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedRule = violationRules.find(r => r.id === selectedRuleId);
  const studentSummary = summaries.find(s => s.student.id === selectedStudentId);

  const handleRuleChange = (ruleId: string) => {
    setSelectedRuleId(ruleId);
    const found = violationRules.find(r => r.id === ruleId);
    if (found) {
      setCustomPoints(found.points);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedRule) {
      alert('Pilih siswa dan jenis pelanggaran terlebih dahulu.');
      return;
    }

    setSubmitState('saving');

    const newViolation: ViolationRecord = {
      id: `VIOL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      studentId: selectedStudent.id,
      studentName: selectedStudent.name,
      studentClass: selectedStudent.class,
      ruleId: selectedRule.id,
      ruleName: selectedRule.name,
      category: selectedRule.category,
      points: Number(customPoints) || selectedRule.points,
      date,
      time,
      location,
      description: description.trim() || selectedRule.name,
      reporterName: reporterName.trim() || 'Guru Piket',
      reporterId: reporterTeacherId || undefined,
      reporterNip: reporterNip || undefined,
      academicYear: settings.academicYear || '2026/2027',
      createdAt: new Date().toISOString()
    };

    onSaveViolation(newViolation);

    const currentActive = (studentSummary?.activeViolationPoints || 0) + newViolation.points;

    // If WhatsApp toggle is on
    let wasWASent = false;
    if (autoSendWA) {
      wasWASent = true;
      const msg = generateViolationWAMessage(selectedStudent, newViolation, currentActive, settings);

      if (settings.waGatewayApiKey) {
        await sendViaGateway(selectedStudent.parentPhone, msg, settings.waGatewayApiKey);
      } else {
        openWhatsApp(selectedStudent.parentPhone, msg);
      }
    }

    // Play subtle audio confirmation cue
    playSuccessSound();

    // Trigger visual cues
    setSubmitState('saved');
    setFeedback(`Data pelanggaran atas nama ${selectedStudent.name} berhasil dicatat! (+${newViolation.points} Poin)`);
    
    // Show prominent floating toast that is visible regardless of scroll position
    setFloatingToast({
      show: true,
      studentName: selectedStudent.name,
      ruleName: newViolation.ruleName,
      points: newViolation.points
    });

    // Show complete confirmation modal
    setSuccessModalRecord({
      record: newViolation,
      student: selectedStudent,
      activePoints: currentActive,
      wasWASent
    });

    setDescription('');

    // Reset button status after 3.5s
    setTimeout(() => {
      setSubmitState('idle');
    }, 3500);

    // Auto-dismiss floating toast after 5s
    setTimeout(() => {
      setFloatingToast(prev => prev ? { ...prev, show: false } : null);
    }, 5000);
  };

  const handleResetForNextInput = () => {
    setSuccessModalRecord(null);
    setDescription('');
    setStudentSearch('');
    // Focus back on student select smoothly
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {/* Floating Toast Notification (Always visible at top-center of viewport regardless of scroll position) */}
      {floatingToast && floatingToast.show && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-lg pointer-events-auto transition-all duration-300">
          <div className="p-4 bg-emerald-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border-2 border-emerald-400 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl shadow-inner shrink-0">
                <CheckCircle2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-emerald-100">Pelanggaran Berhasil Dicatat!</span>
                  <span className="px-2 py-0.5 text-[10px] font-black bg-rose-500 text-white rounded-full">
                    +{floatingToast.points} Poin
                  </span>
                </div>
                <p className="text-xs text-emerald-200 line-clamp-1">
                  {floatingToast.studentName} • {floatingToast.ruleName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={onNavigateToData}
                className="px-3 py-1.5 bg-white text-emerald-950 rounded-xl font-black text-xs hover:bg-emerald-100 transition shadow cursor-pointer flex items-center gap-1"
              >
                <span>Rekap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setFloatingToast(null)}
                className="p-1.5 text-emerald-300 hover:text-white hover:bg-emerald-800 rounded-lg transition cursor-pointer"
                title="Tutup Notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Confirmation Dialog */}
      {successModalRecord && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header with Green Accent */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-6 text-white text-center relative">
              <button
                onClick={() => setSuccessModalRecord(null)}
                className="absolute top-4 right-4 p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-white rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-black">Pelanggaran Berhasil Dicatat!</h3>
              <p className="text-xs text-emerald-100 mt-1">
                Data telah tersimpan ke sistem rekapitulasi dan poin siswa otomatis diperbarui.
              </p>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Nama Siswa:</span>
                  <span className="font-bold text-slate-900 text-sm">{successModalRecord.student.name}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Kelas / Rombel:</span>
                  <span className="font-semibold text-slate-800">{successModalRecord.student.class}</span>
                </div>

                <div className="flex items-start justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Jenis Pelanggaran:</span>
                  <span className="font-semibold text-slate-800 text-right max-w-[60%]">
                    {successModalRecord.record.ruleName}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                  <span className="text-slate-500 font-medium">Poin Pelanggaran:</span>
                  <span className="px-2.5 py-1 bg-rose-100 text-rose-700 font-black rounded-lg text-xs">
                    +{successModalRecord.record.points} Poin
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Total Poin Pelanggaran Aktif:</span>
                  <span className="font-black text-rose-600 text-sm">
                    {successModalRecord.activePoints} Poin
                  </span>
                </div>
              </div>

              {/* WA status alert if activated */}
              {successModalRecord.wasWASent && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-900 font-medium">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Notifikasi WhatsApp telah disiapkan untuk wali murid.</span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSuccessModalRecord(null);
                    onNavigateToData();
                  }}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>Buka Tabel Data Pelanggaran</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleResetForNextInput}
                    className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4 text-slate-600" />
                    <span>Input Siswa Lain</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSuccessModalRecord(null)}
                    className="py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold flex items-center justify-center transition cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Formulir Pencatatan Pelanggaran Siswa</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Input kejadian indisipliner dengan validasi poin otomatis dan notifikasi real-time ke wali murid.
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
            <span>{feedback}</span>
          </div>
          <button
            onClick={onNavigateToData}
            className="px-3 py-1 bg-emerald-900 text-white rounded-lg font-bold hover:bg-emerald-800 transition cursor-pointer"
          >
            Lihat Rekap →
          </button>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-xs">
        {/* Step 1: Select Student */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block font-bold text-slate-800 text-sm">1. Pilih Identitas Siswa</label>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
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
                  ? 'bg-emerald-950 text-white'
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
                      ? 'bg-emerald-900 text-amber-300 ring-1 ring-amber-400'
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
                      e.preventDefault(); // Prevent accidental form submission
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
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-emerald-50 transition cursor-pointer ${
                            selectedStudentId === s.id ? 'bg-emerald-50/80 font-bold' : ''
                          }`}
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                              <span>{s.name}</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-semibold">
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

          {/* Selected Student Info Card */}
          {selectedStudent && (
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-900 text-sm">{selectedStudent.name}</span>
                  <span className="px-2 py-0.5 bg-emerald-800 text-white font-bold text-[10px] rounded-full">
                    {selectedStudent.class}
                  </span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 font-medium text-[10px] rounded-full font-mono">
                    NISN: {selectedStudent.nisn}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-1 flex flex-wrap items-center gap-x-3">
                  <span>Wali: <b>{selectedStudent.parentName || '-'}</b></span>
                  <span>WhatsApp: <b>{selectedStudent.parentPhone || '-'}</b></span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Poin Pelanggaran Aktif</span>
                <span
                  className={`font-black text-xs px-2.5 py-0.5 rounded-full inline-block mt-0.5 ${
                    (studentSummary?.activeViolationPoints || 0) >= 100
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {studentSummary?.activeViolationPoints || 0} Poin
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Step 2: Select Violation Rule */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">2. Jenis Pelanggaran & Bobot Poin</label>
          <select
            value={selectedRuleId}
            onChange={(e) => handleRuleChange(e.target.value)}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-slate-900"
          >
            <optgroup label="🔴 Pelanggaran Berat (20 Poin)">
              {violationRules.filter(r => r.category === 'berat').map(r => (
                <option key={r.id} value={r.id}>{r.name} (+{r.points} Pt)</option>
              ))}
            </optgroup>
            <optgroup label="⚠️ Pelanggaran Sedang (10 Poin)">
              {violationRules.filter(r => r.category === 'sedang').map(r => (
                <option key={r.id} value={r.id}>{r.name} (+{r.points} Pt)</option>
              ))}
            </optgroup>
            <optgroup label="⚡ Pelanggaran Ringan (5 Poin)">
              {violationRules.filter(r => r.category === 'ringan').map(r => (
                <option key={r.id} value={r.id}>{r.name} (+{r.points} Pt)</option>
              ))}
            </optgroup>
          </select>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Kategori Tingkat</label>
              <input
                type="text"
                disabled
                value={selectedRule?.category.toUpperCase() || 'BERAT'}
                className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-bold text-slate-700 uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Bobot Poin Ditambahkan</label>
              <input
                type="number"
                min={1}
                max={100}
                required
                value={customPoints}
                onChange={(e) => setCustomPoints(Number(e.target.value))}
                className="w-full px-3 py-2 bg-rose-50 border border-rose-300 text-rose-800 rounded-lg font-black font-mono focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Step 3: Date, Time, Location & Reporter */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">3. Waktu, Tempat & Saksi Kejadian</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Tanggal Kejadian</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Waktu Kejadian</label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Contoh: 07:15 WIB"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Lokasi Kejadian</label>
              <select
                value={LOCATION_OPTIONS.includes(location) ? location : 'Lainnya (Ketik Manual)'}
                onChange={(e) => {
                  if (e.target.value === 'Lainnya (Ketik Manual)') {
                    if (LOCATION_OPTIONS.includes(location)) {
                      setLocation('');
                    }
                  } else {
                    setLocation(e.target.value);
                  }
                }}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs font-medium"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
              {(!LOCATION_OPTIONS.slice(0, -1).includes(location)) && (
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ketik detail lokasi kejadian..."
                  className="mt-1.5 w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                />
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block font-semibold text-slate-700 text-xs">Guru Pencatat / Tim Piket</label>
                {currentDayName && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Hari: {currentDayName}
                  </span>
                )}
              </div>

              {/* Quick Chips for Today's Duty Teachers */}
              {todayDutyTeachers.length > 0 && (
                <div className="bg-emerald-50/80 p-2 rounded-lg border border-emerald-200/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-900">
                    <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Pilih Cepat Guru Piket Hari Ini:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {todayDutyTeachers.map(dt => {
                      const isSelected = reporterTeacherId === dt.id || reporterName === dt.name;
                      return (
                        <button
                          key={dt.id}
                          type="button"
                          onClick={() => handleSelectReporter(dt.id)}
                          className={`px-2.5 py-1 text-xs font-semibold rounded-md transition flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-white text-emerald-900 hover:bg-emerald-100/70 border border-emerald-300'
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

              {teachers && teachers.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={reporterTeacherId || (teachers.some(t => t.name === reporterName) ? teachers.find(t => t.name === reporterName)?.id : 'custom')}
                    onChange={(e) => handleSelectReporter(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs text-slate-800"
                  >
                    {todayDutyTeachers.length > 0 && (
                      <optgroup label={`⭐ Tim Guru Piket Bertugas (${currentDayName})`}>
                        {todayDutyTeachers.map(t => (
                          <option key={`today-${t.id}`} value={t.id}>
                            🌟 {t.name} (Piket {currentDayName})
                          </option>
                        ))}
                      </optgroup>
                    )}
                    <optgroup label="👨‍🏫 Seluruh Guru & Tenaga Kependidikan">
                      {teachers.map(t => (
                        <option key={`all-${t.id}`} value={t.id}>
                          {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.role === 'guru_bk' ? 'Guru BK' : 'Guru'})
                        </option>
                      ))}
                    </optgroup>
                    <option value="custom">✏️ Ketik Manual Nama Lainnya...</option>
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                  />

                  {/* Indicator badge of recorded teacher */}
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
                  placeholder="Nama Guru / Petugas Pencatat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                />
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Chronology Description with Predefined Options */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <label className="block font-bold text-slate-800 text-sm">4. Kronologi & Keterangan Tambahan</label>
            <span className="text-[11px] text-slate-500 font-medium">Pilih opsi atau sesuaikan kronologi</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Opsi Pilihan Kronologi Cepat</label>
            <select
              value=""
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                if (val === '__AUTO_RULE__') {
                  setDescription(selectedRule ? `Terjadi pelanggaran tata tertib: ${selectedRule.name}.` : '');
                } else {
                  setDescription(val);
                }
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs text-slate-700"
            >
              <option value="">-- Pilih Opsi Template Kronologi --</option>
              <option value="__AUTO_RULE__">
                ⚡ Otomatis Sesuai Jenis Pelanggaran ({selectedRule?.name || 'Tata Tertib'})
              </option>
              {CHRONOLOGY_TEMPLATES.map((tmpl, idx) => (
                <option key={idx} value={tmpl}>
                  • {tmpl}
                </option>
              ))}
            </select>
          </div>

          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Pilih opsi kronologi di atas atau ketik detail kronologi kejadian secara manual..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-xs leading-relaxed"
          ></textarea>
        </div>

        {/* Step 5: WhatsApp Toggle */}
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-5 h-5 text-emerald-800" />
            <div>
              <span className="font-bold text-emerald-950 block">Kirim Notifikasi Otomatis ke WhatsApp Wali Murid</span>
              <span className="text-[11px] text-emerald-800">
                Pesan resmi dan rincian poin langsung dikirimkan ke {selectedStudent?.parentPhone || 'orang tua'}.
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2 text-xs">
            {submitState === 'saved' && (
              <span className="inline-flex items-center gap-1.5 text-emerald-800 font-bold bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-300 shadow-xs animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Pelanggaran tersimpan sukses & poin aktif dihitung!</span>
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onNavigateToData}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitState === 'saving'}
              className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-md cursor-pointer min-w-[200px] ${
                submitState === 'saved'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-200 shadow-emerald-200'
                  : submitState === 'saving'
                  ? 'bg-slate-400 text-white cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white'
              }`}
            >
              {submitState === 'saving' ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Menyimpan Catatan...</span>
                </>
              ) : submitState === 'saved' ? (
                <>
                  <Check className="w-5 h-5 text-white animate-bounce shrink-0" />
                  <span>✓ Berhasil Dicatat!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 shrink-0" />
                  <span>Simpan & Catat Pelanggaran</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
