import React, { useState, useMemo, useRef } from 'react';
import { Teacher, PiketSchedule, ViolationRecord, RewardRecord, DayOfWeek, Student, SchoolSettings } from '../types';
import { initialTeachers, initialPiketSchedules } from '../data/initialData';
import { getAvailableClasses } from '../data/classOptions';
import {
  GraduationCap,
  Plus,
  Search,
  FileSpreadsheet,
  Download,
  Upload,
  Edit2,
  Trash2,
  Phone,
  BookOpen,
  UserCheck,
  AlertCircle,
  X,
  Check,
  ShieldCheck,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  Printer,
  Sparkles,
  RotateCcw,
  Users,
  CheckSquare,
  Square,
  FileText,
  Link2
} from 'lucide-react';
import * as XLSX from 'xlsx';

const DAYS_LIST: DayOfWeek[] = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

interface DataGuruViewProps {
  teachers: Teacher[];
  students?: Student[];
  piketSchedules?: PiketSchedule[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  settings?: SchoolSettings;
  onAddTeacher: (teacher: Teacher) => void;
  onUpdateTeacher: (teacher: Teacher) => void;
  onDeleteTeacher: (id: string) => void;
  onDeleteAllTeachers?: () => void;
  onUpdatePiketSchedule?: (schedule: PiketSchedule) => void;
  onUpdateAllPiketSchedules?: (schedules: PiketSchedule[]) => void;
  onOpenJurnalPiket?: (dayName: DayOfWeek, dutyTeachers: Teacher[]) => void;
  onImportTeachers: (teachers: Teacher[]) => void;
  onOpenSheetsModal?: () => void;
  onFetchFromSheets?: () => Promise<boolean | void> | void;
  isLoadingSheets?: boolean;
}

export const DataGuruView: React.FC<DataGuruViewProps> = ({
  teachers,
  students = [],
  piketSchedules = initialPiketSchedules,
  violations,
  rewards,
  settings,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onDeleteAllTeachers,
  onUpdatePiketSchedule,
  onUpdateAllPiketSchedules,
  onOpenJurnalPiket,
  onImportTeachers,
  onOpenSheetsModal,
  onFetchFromSheets,
  isLoadingSheets = false
}) => {
  const [activeTab, setActiveTab] = useState<'daftar_guru' | 'pengaturan_piket'>('daftar_guru');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Piket Detail Modal State (editing hours & notes for a day)
  const [editingDayPiket, setEditingDayPiket] = useState<PiketSchedule | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Teacher>>({
    nip: '',
    name: '',
    role: 'guru_mapel',
    subject: '',
    classAssigned: '',
    phone: ''
  });

  const [formError, setFormError] = useState('');

  // Filtered teachers list
  const filteredTeachers = useMemo(() => {
    return teachers.filter(t => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.nip.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.subject && t.subject.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.classAssigned && t.classAssigned.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchRole = filterRole === 'all' || t.role === filterRole;

      return matchSearch && matchRole;
    });
  }, [teachers, searchTerm, filterRole]);

  // Statistics
  const waliKelasCount = teachers.filter(t => t.role === 'wali_kelas' || !!t.classAssigned).length;
  const guruBkCount = teachers.filter(t => t.role === 'guru_bk').length;
  const guruPiketCount = teachers.filter(t => t.role === 'guru_piket').length;
  const tendikCount = teachers.filter(t => t.role === 'tenaga_kependidikan').length;

  // Available classes dynamically sourced from student database
  const availableClasses = useMemo(() => getAvailableClasses(students), [students]);

  // Piket Workload Stats
  const isTeacherAssignedToSched = (t: Teacher, teacherIds: string[]) => {
    if (!teacherIds || teacherIds.length === 0) return false;
    return teacherIds.some(id => 
      id === t.id || 
      (t.nip && (id === t.nip || id.replace(/\s+/g, '') === t.nip.replace(/\s+/g, ''))) || 
      id.trim().toLowerCase() === t.name.trim().toLowerCase()
    );
  };

  const teacherPiketCountMap = useMemo(() => {
    const counts: Record<string, number> = {};
    teachers.forEach(t => { counts[t.id] = 0; });
    piketSchedules.forEach(sched => {
      teachers.forEach(t => {
        if (isTeacherAssignedToSched(t, sched.teacherIds)) {
          counts[t.id] = (counts[t.id] || 0) + 1;
        }
      });
    });
    return counts;
  }, [teachers, piketSchedules]);

  const unassignedTeachers = useMemo(() => {
    return teachers.filter(t => (teacherPiketCountMap[t.id] || 0) === 0);
  }, [teachers, teacherPiketCountMap]);

  const handleOpenAdd = () => {
    setEditingTeacher(null);
    setFormData({
      nip: '',
      name: '',
      role: 'guru_mapel',
      subject: '',
      classAssigned: '',
      phone: ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setFormData({
      nip: t.nip,
      name: t.name,
      role: t.role,
      subject: t.subject || '',
      classAssigned: t.classAssigned || '',
      phone: t.phone || ''
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.nip?.trim()) {
      setFormError('Nama lengkap dan NIP wajib diisi.');
      return;
    }

    if (editingTeacher) {
      onUpdateTeacher({
        ...editingTeacher,
        nip: formData.nip.trim(),
        name: formData.name.trim(),
        role: formData.role as any,
        subject: formData.subject?.trim(),
        classAssigned: formData.classAssigned?.trim(),
        phone: formData.phone?.trim()
      });
    } else {
      const newTeacher: Teacher = {
        id: `t_${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        nip: formData.nip.trim(),
        name: formData.name.trim(),
        role: (formData.role as any) || 'guru_mapel',
        subject: formData.subject?.trim(),
        classAssigned: formData.classAssigned?.trim(),
        phone: formData.phone?.trim()
      };
      onAddTeacher(newTeacher);
    }

    setIsModalOpen(false);
  };

  // Piket schedule manipulation handlers
  const handleToggleTeacherPiket = (day: DayOfWeek, teacherId: string) => {
    if (!onUpdatePiketSchedule) return;
    const currentSched = piketSchedules.find(p => p.day === day) || { day, teacherIds: [] };
    const isAssigned = currentSched.teacherIds.includes(teacherId);

    const newTeacherIds = isAssigned
      ? currentSched.teacherIds.filter(id => id !== teacherId)
      : [...currentSched.teacherIds, teacherId];

    onUpdatePiketSchedule({
      ...currentSched,
      teacherIds: newTeacherIds
    });
  };

  const handleAddTeacherToDay = (day: DayOfWeek, teacherId: string) => {
    if (!onUpdatePiketSchedule || !teacherId) return;
    const currentSched = piketSchedules.find(p => p.day === day) || { day, teacherIds: [] };
    if (!currentSched.teacherIds.includes(teacherId)) {
      onUpdatePiketSchedule({
        ...currentSched,
        teacherIds: [...currentSched.teacherIds, teacherId]
      });
    }
  };

  const handleRemoveTeacherFromDay = (day: DayOfWeek, teacherId: string) => {
    if (!onUpdatePiketSchedule) return;
    const currentSched = piketSchedules.find(p => p.day === day) || { day, teacherIds: [] };
    onUpdatePiketSchedule({
      ...currentSched,
      teacherIds: currentSched.teacherIds.filter(id => id !== teacherId)
    });
  };

  const handleSaveDayDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDayPiket || !onUpdatePiketSchedule) return;
    onUpdatePiketSchedule(editingDayPiket);
    setEditingDayPiket(null);
  };

  // Auto distribute teachers across 6 days evenly
  const handleAutoDistribute = () => {
    if (!onUpdateAllPiketSchedules) return;
    if (teachers.length === 0) {
      alert('Belum ada data guru/GTK untuk didistribusikan.');
      return;
    }
    if (!confirm('Apakah Anda ingin membagi jadwal piket guru secara otomatis dan merata dari Senin s/d Sabtu?')) {
      return;
    }

    const newSchedules: PiketSchedule[] = DAYS_LIST.map((day, dIdx) => {
      // Pick 2-3 teachers per day based on round-robin
      const dayTeacherIds: string[] = [];
      teachers.forEach((t, tIdx) => {
        if (tIdx % 6 === dIdx || (tIdx + 3) % 6 === dIdx) {
          dayTeacherIds.push(t.id);
        }
      });
      // Ensure at least 2 teachers if available
      if (dayTeacherIds.length === 0 && teachers[0]) {
        dayTeacherIds.push(teachers[0].id);
      }

      const existing = piketSchedules.find(p => p.day === day);
      return {
        day,
        teacherIds: dayTeacherIds,
        dutyHours: existing?.dutyHours || (day === 'Jumat' ? '06.30 - 14.00 WIB' : day === 'Sabtu' ? '06.30 - 13.00 WIB' : '06.30 - 15.00 WIB'),
        notes: existing?.notes || `Pengawalan ketertiban dan disiplin kondisional hari ${day}`
      };
    });

    onUpdateAllPiketSchedules(newSchedules);
  };

  // Reset to initial default schedule
  const handleResetPiket = () => {
    if (!onUpdateAllPiketSchedules) return;
    if (confirm('Kosongkan semua penugasan jadwal piket mingguan?')) {
      const emptySchedules: PiketSchedule[] = DAYS_LIST.map(day => ({
        day,
        teacherIds: [],
        dutyHours: day === 'Jumat' ? '06.30 - 14.00 WIB' : day === 'Sabtu' ? '06.30 - 13.00 WIB' : '06.30 - 15.00 WIB',
        notes: `Pengawalan ketertiban dan disiplin hari ${day}`
      }));
      onUpdateAllPiketSchedules(emptySchedules);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    const dataToExport = teachers.map((t, idx) => {
      const recordedViolations = violations.filter(v => v.reporterName === t.name || (t.nip && v.reporterNip === t.nip)).length;
      const recordedRewards = rewards.filter(r => r.reporterName === t.name).length;

      // Days of piket
      const assignedDays = DAYS_LIST.filter(day => {
        const sched = piketSchedules.find(p => p.day === day);
        return sched?.teacherIds.includes(t.id);
      }).join(', ') || 'Belum Terjadwal';

      return {
        'No': idx + 1,
        'NIP': t.nip,
        'Nama Lengkap Guru / GTK': t.name,
        'Jabatan / Tugas': getRoleLabel(t.role),
        'Wali Kelas': t.classAssigned || '-',
        'Mata Pelajaran': t.subject || '-',
        'Jadwal Piket': assignedDays,
        'No. WhatsApp / HP': t.phone || '-',
        'Pelanggaran Dicatat': recordedViolations,
        'Reward Dicatat': recordedRewards
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Guru_Piket');
    XLSX.writeFile(workbook, `Data_Guru_dan_Piket_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Download Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'NIP': '198501152010011005',
        'Nama Lengkap Guru / GTK': 'Drs. H. Ahmad Fauzi, M.Pd.',
        'Jabatan (guru_mapel / wali_kelas / guru_bk / guru_piket / pembina_osis / tenaga_kependidikan / kepala_sekolah)': 'wali_kelas',
        'Wali Kelas (Opsional, cth: Kelas 1 A)': 'Kelas 1 A',
        'Mata Pelajaran (Opsional)': 'Matematika',
        'No. WhatsApp (Opsional)': '081234567890'
      },
      {
        'NIP': '199003202014022003',
        'Nama Lengkap Guru / GTK': 'Nurul Hidayah, S.Pd.',
        'Jabatan (guru_mapel / wali_kelas / guru_bk / guru_piket / pembina_osis / tenaga_kependidikan / kepala_sekolah)': 'guru_bk',
        'Wali Kelas (Opsional, cth: Kelas 1 A)': '',
        'Mata Pelajaran (Opsional)': 'Bimbingan Konseling',
        'No. WhatsApp (Opsional)': '085298765432'
      },
      {
        'NIP': '199205122019031008',
        'Nama Lengkap Guru / GTK': 'Bambang Irawan, S.AP.',
        'Jabatan (guru_mapel / wali_kelas / guru_bk / guru_piket / pembina_osis / tenaga_kependidikan / kepala_sekolah)': 'tenaga_kependidikan',
        'Wali Kelas (Opsional, cth: Kelas 1 A)': '',
        'Mata Pelajaran (Opsional)': 'Tata Usaha / Administrasi',
        'No. WhatsApp (Opsional)': '081399887766'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Guru');
    XLSX.writeFile(workbook, 'Template_Import_Guru_SI_TAMU.xlsx');
  };

  // Import from Excel
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData: any[] = XLSX.utils.sheet_to_json(ws);

        if (rawData.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const imported: Teacher[] = rawData.map((row, index) => {
          const nip = String(row['NIP'] || row['nip'] || `GUR-${Date.now()}-${index}`).trim();
          const name = String(row['Nama Lengkap Guru / GTK'] || row['Nama'] || row['name'] || '').trim();
          let role = String(
            row['Jabatan (guru_mapel / wali_kelas / guru_bk / guru_piket / pembina_osis / tenaga_kependidikan / kepala_sekolah)'] ||
            row['Jabatan (guru_mapel / wali_kelas / guru_bk / guru_piket / pembina_osis)'] ||
            row['Jabatan'] ||
            row['role'] ||
            'guru_mapel'
          ).toLowerCase().trim();

          if (!['wali_kelas', 'guru_bk', 'guru_piket', 'pembina_osis', 'guru_mapel', 'tenaga_kependidikan', 'kepala_sekolah'].includes(role)) {
            if (role.includes('wali')) role = 'wali_kelas';
            else if (role.includes('bk') || role.includes('konseling')) role = 'guru_bk';
            else if (role.includes('piket')) role = 'guru_piket';
            else if (role.includes('osis')) role = 'pembina_osis';
            else if (role.includes('kepala') || role.includes('ks') || role.includes('kepsek')) role = 'kepala_sekolah';
            else if (role.includes('tendik') || role.includes('kependidikan') || role.includes('tu') || role.includes('staff') || role.includes('staf') || role.includes('administrasi') || role.includes('tata usaha') || role.includes('perpustakaan') || role.includes('laboran')) role = 'tenaga_kependidikan';
            else role = 'guru_mapel';
          }

          const classAssigned = String(row['Wali Kelas (Opsional, cth: Kelas 1 A)'] || row['Wali Kelas (Opsional, cth: VII-A)'] || row['Wali Kelas'] || row['classAssigned'] || '').trim();
          const subject = String(row['Mata Pelajaran (Opsional)'] || row['Mata Pelajaran'] || row['subject'] || '').trim();
          const phone = String(row['No. WhatsApp (Opsional)'] || row['No. WhatsApp / HP'] || row['phone'] || '').trim();

          return {
            id: `t_${Date.now()}_${index}`,
            nip,
            name: name || `Guru ${index + 1}`,
            role: role as any,
            classAssigned: classAssigned || undefined,
            subject: subject || undefined,
            phone: phone || undefined
          };
        });

        onImportTeachers(imported);
        alert(`Berhasil mengimpor ${imported.length} data guru/GTK.`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca file Excel. Pastikan format kolom sesuai.');
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load fresh from Google Spreadsheet
  const handleFetchSheets = () => {
    if (onFetchFromSheets) {
      onFetchFromSheets();
    } else if (onOpenSheetsModal) {
      onOpenSheetsModal();
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'wali_kelas': return 'Wali Kelas';
      case 'guru_bk': return 'Guru BK / Konselor';
      case 'guru_piket': return 'Guru Piket';
      case 'pembina_osis': return 'Pembina OSIS / Kesiswaan';
      case 'tenaga_kependidikan': return 'Tenaga Kependidikan';
      case 'kepala_sekolah': return 'Kepala Sekolah';
      default: return 'Guru Mata Pelajaran';
    }
  };

  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'wali_kelas': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'guru_bk': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'guru_piket': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'pembina_osis': return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'tenaga_kependidikan': return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'kepala_sekolah': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Page */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-emerald-900" />
            Data Guru & Jadwal Piket Ketertiban
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data dewan guru, wali kelas, guru BK, serta pembagian jadwal tim piket harian sekolah.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <button
            onClick={handleDownloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition border border-slate-300 cursor-pointer"
            title="Download Template Format Excel"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Template</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-semibold transition border border-emerald-200 cursor-pointer"
            title="Impor dari Excel"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Impor Excel</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 rounded-xl text-xs font-semibold transition border border-teal-200 cursor-pointer"
            title="Ekspor ke Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Ekspor Excel</span>
          </button>
          {onFetchFromSheets && (
            <button
              onClick={handleFetchSheets}
              disabled={isLoadingSheets}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Muat Data Guru & Jadwal Piket dari Google Spreadsheet"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
              <span>{isLoadingSheets ? 'Memuat Sheets...' : 'Muat dari Spreadsheet'}</span>
            </button>
          )}
          {onOpenSheetsModal && (
            <button
              onClick={onOpenSheetsModal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-xl text-xs font-semibold transition cursor-pointer"
              title="Buka Pengaturan Sinkronisasi Google Spreadsheet"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sinkron Spreadsheet</span>
            </button>
          )}
          <button
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={teachers.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Hapus Seluruh Data Guru"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Data</span>
          </button>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Guru</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('daftar_guru')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'daftar_guru'
              ? 'bg-emerald-950 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Daftar Guru & GTK ({teachers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('pengaturan_piket')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            activeTab === 'pengaturan_piket'
              ? 'bg-emerald-950 text-white shadow'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-400" />
          <span>Pengaturan Piket (Jadwal Mingguan)</span>
          {unassignedTeachers.length > 0 && (
            <span className="bg-amber-500 text-emerald-950 px-1.5 py-0.2 rounded-full text-[10px] font-black">
              {unassignedTeachers.length} Belum Terjadwal
            </span>
          )}
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: DAFTAR GURU & GTK */}
      {/* ========================================================================= */}
      {activeTab === 'daftar_guru' && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Guru & GTK</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{teachers.length}</h3>
                <p className="text-[11px] text-emerald-700 font-medium mt-0.5">Terdaftar di sistem</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                <GraduationCap className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Wali Kelas</p>
                <h3 className="text-2xl font-black text-emerald-900 mt-1">{waliKelasCount}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Penanggung jawab kelas</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-100">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guru BK / Konselor</p>
                <h3 className="text-2xl font-black text-purple-900 mt-1">{guruBkCount}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Penanganan kasus & pembinaan</p>
              </div>
              <div className="p-3 bg-purple-50 text-purple-800 rounded-xl border border-purple-100">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Guru Piket Harian</p>
                <h3 className="text-2xl font-black text-amber-900 mt-1">{guruPiketCount}</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Penegak disiplin harian</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-100">
                <UserCheck className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, NIP, mapel, atau kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium">Filter Jabatan:</span>
              <select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              >
                <option value="all">Semua Jabatan / Peran</option>
                <option value="wali_kelas">Wali Kelas</option>
                <option value="guru_bk">Guru BK / Konselor</option>
                <option value="guru_piket">Guru Piket</option>
                <option value="pembina_osis">Pembina OSIS</option>
                <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                <option value="guru_mapel">Guru Mata Pelajaran</option>
                <option value="kepala_sekolah">Kepala Sekolah</option>
              </select>
            </div>
          </div>

          {/* Table of Teachers */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap & NIP</th>
                    <th className="py-3 px-4">Jabatan / Peran</th>
                    <th className="py-3 px-4">Wali Kelas</th>
                    <th className="py-3 px-4">Mata Pelajaran</th>
                    <th className="py-3 px-4 text-center">Hari Piket</th>
                    <th className="py-3 px-4 text-center">Catatan Kasus / Reward</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-full">
                            <GraduationCap className="w-8 h-8" />
                          </div>
                          <h3 className="font-bold text-slate-800 text-sm">Belum Ada Data Guru / GTK</h3>
                          <p className="text-xs text-slate-500 leading-relaxed">
                            Data Guru & GTK serta Jadwal Piket disinkronkan langsung dari Google Spreadsheet atau dapat diinput manual.
                          </p>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            {onFetchFromSheets && (
                              <button
                                onClick={handleFetchSheets}
                                disabled={isLoadingSheets}
                                className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
                              >
                                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                                <span>{isLoadingSheets ? 'Memuat Sheets...' : 'Muat dari Spreadsheet'}</span>
                              </button>
                            )}
                            <button
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>Impor Excel</span>
                            </button>
                            <button
                              onClick={handleOpenAdd}
                              className="px-3 py-1.5 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Tambah Manual</span>
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data guru yang sesuai dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t, idx) => {
                      const recViolations = violations.filter(v => v.reporterName === t.name || (t.nip && v.reporterNip === t.nip)).length;
                      const recRewards = rewards.filter(r => r.reporterName === t.name).length;
                      const assignedDays = DAYS_LIST.filter(day => {
                        const s = piketSchedules.find(p => p.day === day);
                        return s?.teacherIds.includes(t.id);
                      });

                      return (
                        <tr key={t.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{t.name}</div>
                            <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                              <span>NIP: {t.nip}</span>
                              {t.phone && (
                                <span className="text-emerald-700 flex items-center gap-0.5 ml-2">
                                  <Phone className="w-2.5 h-2.5" />
                                  {t.phone}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(t.role)}`}>
                              {getRoleLabel(t.role)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {t.classAssigned ? (
                              <span className="font-bold text-emerald-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Kelas {t.classAssigned}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-700">
                            {t.subject || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {assignedDays.length === 0 ? (
                              <span className="text-[10px] text-slate-400 italic">Belum Ada</span>
                            ) : (
                              <div className="flex flex-wrap items-center justify-center gap-1">
                                {assignedDays.map(d => (
                                  <span key={d} className="px-1.5 py-0.5 bg-emerald-100 text-emerald-900 rounded font-extrabold text-[10px]">
                                    {d.slice(0, 3)}
                                  </span>
                                ))}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className="inline-flex items-center gap-0.5 text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Kasus Pelanggaran Dicatat">
                                <AlertTriangle className="w-3 h-3" />
                                {recViolations}
                              </span>
                              <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded text-[10px] font-bold" title="Reward/Prestasi Dicatat">
                                <Award className="w-3 h-3" />
                                {recRewards}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEdit(t)}
                                className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                                title="Edit Data Guru"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Yakin ingin menghapus data ${t.name}?`)) {
                                    onDeleteTeacher(t.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="Hapus Guru"
                              >
                                <Trash2 className="w-4 h-4" />
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
      )}

      {/* ========================================================================= */}
      {/* TAB 2: PENGATURAN PIKET (JADWAL MINGGUAN & MATRIKS PENUGASAN) */}
      {/* ========================================================================= */}
      {activeTab === 'pengaturan_piket' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 p-6 rounded-2xl text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/90 text-amber-300 text-xs font-bold mb-2">
                <Clock className="w-3.5 h-3.5" />
                <span>Model Tim Bergerak (Kondisional & Fleksibel)</span>
              </div>
              <h3 className="font-black text-lg sm:text-xl text-white tracking-tight">
                Pengaturan Jadwal Tim Piket Mingguan
              </h3>
              <p className="text-xs text-emerald-200 mt-1 max-w-2xl leading-relaxed">
                Tentukan penugasan guru piket untuk setiap hari kerja (Senin s/d Sabtu). Guru yang terjadwal akan muncul otomatis sebagai rekomendasi pencatat di form pelanggaran dan berwenang mencetak jurnal piket harian.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                onClick={handleAutoDistribute}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-extrabold rounded-xl text-xs transition shadow cursor-pointer"
                title="Bagi rata seluruh guru ke hari Senin-Sabtu otomatis"
              >
                <Sparkles className="w-4 h-4" />
                <span>Bagi Otomatis</span>
              </button>
              <button
                onClick={handleResetPiket}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs transition border border-emerald-700 cursor-pointer"
                title="Kembalikan ke Jadwal Standar"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Standar</span>
              </button>
            </div>
          </div>

          {/* Workload Stats Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Guru Terjadwal</p>
                <h4 className="text-2xl font-black text-emerald-900 mt-0.5">
                  {teachers.length - unassignedTeachers.length} / {teachers.length}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Guru memiliki tugas piket</p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100">
                <Users className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status Belum Terjadwal</p>
                <h4 className={`text-2xl font-black mt-0.5 ${unassignedTeachers.length > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                  {unassignedTeachers.length} Guru
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {unassignedTeachers.length === 0 ? 'Semua guru sudah terdistribusi' : 'Perlu ditambahkan ke jadwal'}
                </p>
              </div>
              <div className={`p-3 rounded-xl border ${unassignedTeachers.length > 0 ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
                <AlertCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Hari Piket Aktif</p>
                <h4 className="text-2xl font-black text-slate-900 mt-0.5">6 Hari Kerja</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Senin s/d Sabtu</p>
              </div>
              <div className="p-3 bg-teal-50 text-teal-800 rounded-xl border border-teal-100">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Section 1: 6-Day Grid Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-800" />
                Penugasan Harian (Senin s/d Sabtu)
              </h4>
              <span className="text-xs text-slate-500">Klik dropdown "+ Tambah" atau silang (X) untuk mengatur petugas</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {DAYS_LIST.map((day) => {
                const sched = piketSchedules.find(p => p.day === day) || {
                  day,
                  teacherIds: [],
                  dutyHours: day === 'Jumat' ? '06.30 - 14.00 WIB' : day === 'Sabtu' ? '06.30 - 13.00 WIB' : '06.30 - 15.00 WIB',
                  notes: ''
                };
                const dayDutyTeachers = teachers.filter(t => isTeacherAssignedToSched(t, sched.teacherIds));
                const availableToAdd = teachers.filter(t => !isTeacherAssignedToSched(t, sched.teacherIds));

                return (
                  <div key={day} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-emerald-300 transition">
                    <div>
                      {/* Card Header */}
                      <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-9 h-9 rounded-xl bg-emerald-950 text-white flex items-center justify-center font-black text-xs shadow-xs">
                            {day.slice(0, 3)}
                          </span>
                          <div>
                            <h5 className="font-black text-slate-900 text-sm">{day}</h5>
                            <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-emerald-700" />
                              {sched.dutyHours || '06.30 - 15.00 WIB'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingDayPiket(sched)}
                            className="p-1.5 text-slate-500 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Edit Jam & Catatan Piket"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onOpenJurnalPiket && (
                            <button
                              onClick={() => onOpenJurnalPiket(day, dayDutyTeachers)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold rounded-lg text-[11px] transition cursor-pointer"
                              title="Buka & Cetak Jurnal Piket Harian"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>Jurnal</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Notes / Special Instructions */}
                      {sched.notes && (
                        <div className="px-4 py-2 bg-emerald-50/70 border-b border-emerald-100 text-[11px] text-emerald-900 font-medium">
                          📝 {sched.notes}
                        </div>
                      )}

                      {/* Teachers on Duty List */}
                      <div className="p-4 space-y-2">
                        {dayDutyTeachers.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 italic">
                            Belum ada guru piket ditugaskan pada hari {day}.
                          </div>
                        ) : (
                          dayDutyTeachers.map((t, idx) => (
                            <div
                              key={t.id}
                              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs hover:bg-emerald-50/60 transition group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
                                  {idx + 1}
                                </span>
                                <div className="truncate">
                                  <p className="font-bold text-slate-900 truncate">{t.name}</p>
                                  <p className="text-[10px] text-slate-500 truncate">
                                    {t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.subject || getRoleLabel(t.role)}
                                  </p>
                                </div>
                              </div>

                              <button
                                onClick={() => handleRemoveTeacherFromDay(day, t.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
                                title="Hapus dari jadwal hari ini"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Quick Add Teacher to this Day */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100">
                      <select
                        value=""
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAddTeacherToDay(day, e.target.value);
                          }
                        }}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-700 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                      >
                        <option value="">+ Tambah Petugas Piket ({availableToAdd.length} Tersedia)...</option>
                        {availableToAdd.map(t => (
                          <option key={t.id} value={t.id}>
                            {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.subject || 'Guru'})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Interactive Workload & Matrix Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-3 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-emerald-800" />
                  Matriks Checklist Distribusi Jadwal Mingguan
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Centang kotak untuk langsung menugaskan atau membatalkan tugas piket guru pada hari tertentu.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-10 text-center">No</th>
                    <th className="py-3 px-4">Nama Lengkap Guru / GTK</th>
                    <th className="py-3 px-3 text-center">Jabatan</th>
                    {DAYS_LIST.map(d => (
                      <th key={d} className="py-3 px-3 text-center w-20">
                        {d}
                      </th>
                    ))}
                    <th className="py-3 px-4 text-center">Total Beban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map((t, idx) => {
                    const daysAssignedCount = teacherPiketCountMap[t.id] || 0;

                    return (
                      <tr key={t.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{t.name}</p>
                          <p className="text-[10px] text-slate-500 font-mono">NIP: {t.nip}</p>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeClass(t.role)}`}>
                            {getRoleLabel(t.role)}
                          </span>
                        </td>
                        {DAYS_LIST.map(day => {
                          const sched = piketSchedules.find(p => p.day === day);
                          const isAssigned = sched ? isTeacherAssignedToSched(t, sched.teacherIds) : false;

                          return (
                            <td key={day} className="py-3 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleTeacherPiket(day, t.id)}
                                className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition cursor-pointer ${
                                  isAssigned
                                    ? 'bg-emerald-800 text-white shadow-xs hover:bg-emerald-700'
                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 hover:text-slate-400'
                                }`}
                                title={`${isAssigned ? 'Batalkan' : 'Tugaskan'} piket hari ${day}`}
                              >
                                {isAssigned ? <Check className="w-4 h-4" /> : <Square className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          );
                        })}
                        <td className="py-3 px-4 text-center">
                          {daysAssignedCount === 0 ? (
                            <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg text-[10px] border border-rose-200">
                              0 Hari (Belum)
                            </span>
                          ) : daysAssignedCount <= 2 ? (
                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 font-bold rounded-lg text-[10px] border border-emerald-200">
                              {daysAssignedCount} Hari (Ideal)
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold rounded-lg text-[10px] border border-amber-200">
                              {daysAssignedCount} Hari (Padat)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Teacher */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  {editingTeacher ? 'Edit Data Guru & GTK' : 'Tambah Guru & GTK Baru'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cth: Drs. H. Ahmad Fauzi, M.Pd."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    NIP / NUPTK *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="198501152010011005"
                    value={formData.nip}
                    onChange={(e) => setFormData({ ...formData, nip: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Jabatan / Peran
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="guru_mapel">Guru Mata Pelajaran</option>
                    <option value="wali_kelas">Wali Kelas</option>
                    <option value="guru_bk">Guru BK / Konselor</option>
                    <option value="guru_piket">Guru Piket</option>
                    <option value="pembina_osis">Pembina OSIS / Kesiswaan</option>
                    <option value="tenaga_kependidikan">Tenaga Kependidikan</option>
                    <option value="kepala_sekolah">Kepala Sekolah</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Wali Kelas (Jika Ada - Sesuai Database Siswa)
                  </label>
                  <input
                    type="text"
                    list="classListGuru"
                    placeholder="Pilih atau ketik kelas..."
                    value={formData.classAssigned}
                    onChange={(e) => setFormData({ ...formData, classAssigned: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  <datalist id="classListGuru">
                    {availableClasses.map(cls => (
                      <option key={cls} value={cls} />
                    ))}
                  </datalist>
                  <div className="flex flex-wrap gap-1 mt-1.5 max-h-24 overflow-y-auto p-1 bg-slate-50 border border-slate-200 rounded-lg">
                    {availableClasses.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setFormData({ ...formData, classAssigned: cls })}
                        className={`text-[10px] px-2 py-1 rounded border transition cursor-pointer font-semibold ${
                          formData.classAssigned === cls
                            ? 'bg-emerald-950 text-white border-emerald-950 font-bold'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
                        }`}
                      >
                        {cls}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Mata Pelajaran
                  </label>
                  <input
                    type="text"
                    placeholder="Cth: Matematika, Tematik, PJOK, PAI"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nomor WhatsApp / Kontak (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="08xxxxxxxxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Data Guru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Detail Hari Piket (Notes & Hours) */}
      {editingDayPiket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="bg-emerald-950 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base">
                  Pengaturan Piket Hari {editingDayPiket.day}
                </h3>
              </div>
              <button
                onClick={() => setEditingDayPiket(null)}
                className="text-emerald-300 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDayDetails} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Jam Operasional Piket
                </label>
                <input
                  type="text"
                  placeholder="Cth: 06.30 - 15.00 WIB"
                  value={editingDayPiket.dutyHours || ''}
                  onChange={(e) => setEditingDayPiket({ ...editingDayPiket, dutyHours: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Instruksi Khusus Piket
                </label>
                <textarea
                  rows={3}
                  placeholder="Cth: Fokus gerbang pagi jam 06.30 - 07.15 WIB & ketertiban upacara bendera"
                  value={editingDayPiket.notes || ''}
                  onChange={(e) => setEditingDayPiket({ ...editingDayPiket, notes: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingDayPiket(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan Hari</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal Hapus Semua Data Guru */}
      {deleteAllModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Semua Data Guru</h3>
                <p className="text-xs text-rose-600 font-semibold">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700 font-bold">{teachers.length} data guru/GTK</strong>? Jadwal piket harian yang terhubung juga akan dibersihkan.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setDeleteAllModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (onDeleteAllTeachers) {
                    onDeleteAllTeachers();
                  } else {
                    onImportTeachers([]);
                  }
                  setDeleteAllModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Semua Data Guru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
