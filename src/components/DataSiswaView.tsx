import React, { useState, useRef, useMemo } from 'react';
import { Student, StudentScoreSummary, ViolationRecord, RewardRecord, CompensationRecord } from '../types';
import {
  Users,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  FileSpreadsheet,
  Edit2,
  Trash2,
  Eye,
  AlertTriangle,
  Award,
  Key,
  X,
  CheckCircle2,
  Phone,
  ArrowUpDown,
  GraduationCap
} from 'lucide-react';
import { exportStudentsToExcel, downloadStudentTemplate, importStudentsFromExcel } from '../utils/excel';
import { PRIMARY_SCHOOL_CLASSES, PRIMARY_SCHOOL_PARALLEL_CLASSES, getAvailableClasses, matchClassFilter } from '../data/classOptions';
import { KenaikanKelasModal } from './KenaikanKelasModal';

interface DataSiswaViewProps {
  students: Student[];
  summaries: StudentScoreSummary[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  compensations: CompensationRecord[];
  currentAcademicYear: string;
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (id: string) => void;
  onDeleteAllStudents?: () => void;
  onImportStudents: (imported: Student[]) => void;
  onQuickInputViolation: (student: Student) => void;
  onQuickInputReward: (student: Student) => void;
  onPromoteYear: (promotedStudents: Student[], nextYear: string) => void;
}

export const DataSiswaView: React.FC<DataSiswaViewProps> = ({
  students,
  summaries,
  violations,
  rewards,
  compensations,
  currentAcademicYear,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteAllStudents,
  onImportStudents,
  onQuickInputViolation,
  onQuickInputReward,
  onPromoteYear
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [promotionModalOpen, setPromotionModalOpen] = useState(false);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [detailStudent, setDetailStudent] = useState<Student | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    nisn: '',
    nik: '',
    name: '',
    class: 'Kelas 1',
    gender: 'L' as 'L' | 'P',
    parentName: '',
    parentPhone: '',
    parentAddress: '',
    accessCode: ''
  });
  const [customClassMode, setCustomClassMode] = useState(false);

  // Extract unique classes with Kelas 1 s.d. Kelas 6
  const classesList = useMemo(() => {
    return ['ALL', ...getAvailableClasses(students)];
  }, [students]);

  // Summary lookup map
  const summaryMap = new Map<string, StudentScoreSummary>(summaries.map(s => [s.student.id, s]));

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesClass = matchClassFilter(s.class, selectedClass);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.nisn.toLowerCase().includes(q) ||
        (s.nik && s.nik.toLowerCase().includes(q)) ||
        s.class.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q);
      return matchesClass && matchesSearch;
    });
  }, [students, selectedClass, searchQuery]);

  const openAddModal = () => {
    setEditingStudent(null);
    setCustomClassMode(false);
    setFormData({
      nisn: '',
      nik: '',
      name: '',
      class: 'Kelas 1',
      gender: 'L',
      parentName: '',
      parentPhone: '',
      parentAddress: '',
      accessCode: ''
    });
    setModalOpen(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudent(student);
    const isStandardClass = PRIMARY_SCHOOL_CLASSES.includes(student.class) || PRIMARY_SCHOOL_PARALLEL_CLASSES.includes(student.class);
    setCustomClassMode(!isStandardClass);
    setFormData({
      nisn: student.nisn,
      nik: student.nik || '',
      name: student.name,
      class: student.class || 'Kelas 1',
      gender: student.gender,
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      parentAddress: student.parentAddress || '',
      accessCode: student.accessCode || ''
    });
    setModalOpen(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanClass = formData.class.replace(/[^a-zA-Z0-9]/g, '');
    const generatedAccess = formData.accessCode || `${formData.name.split(' ')[0].toUpperCase()}${cleanClass}`;

    if (editingStudent) {
      onUpdateStudent({
        ...editingStudent,
        ...formData,
        accessCode: generatedAccess
      });
    } else {
      const newStudent: Student = {
        id: `STU-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        ...formData,
        accessCode: generatedAccess,
        createdAt: new Date().toISOString().slice(0, 10)
      };
      onAddStudent(newStudent);
    }
    setModalOpen(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('Membaca file Excel...');
      const imported = await importStudentsFromExcel(file);
      onImportStudents(imported);
      setImportStatus(`Berhasil mengimpor ${imported.length} data siswa!`);
      setTimeout(() => setImportStatus(null), 4000);
    } catch (err: any) {
      alert(`Gagal mengimpor data: ${err.message}`);
      setImportStatus(null);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-800" />
            Database Master Data Siswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data identitas murid, kontak wali murid, dan integrasi import/export Excel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Download Template */}
          <button
            onClick={downloadStudentTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Unduh Format Excel untuk Import Massal"
          >
            <Download className="w-3.5 h-3.5" />
            Template Excel
          </button>

          {/* Import Excel */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Import Excel
          </button>

          {/* Export Excel */}
          <button
            onClick={() => exportStudentsToExcel(students, summaries)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition shadow cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>

          {/* Hapus Semua Data Siswa */}
          <button
            onClick={() => setDeleteAllModalOpen(true)}
            disabled={students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 disabled:opacity-50 disabled:cursor-not-allowed border border-rose-200 rounded-xl text-xs font-semibold transition cursor-pointer"
            title="Hapus Seluruh Data Siswa"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Hapus Semua Data
          </button>

          {/* Kenaikan Kelas otomatis */}
          <button
            onClick={() => setPromotionModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-800 to-emerald-950 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <GraduationCap className="w-4 h-4 text-emerald-300" />
            Kenaikan Kelas otomatis
          </button>

          {/* Add Student */}
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Import Feedback Banner */}
      {importStatus && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{importStatus}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Text Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Nama Siswa, NISN, Kelas, atau Nama Orang Tua..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Dedicated Class Dropdown Filter */}
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="text-xs text-slate-600 font-semibold shrink-0">Pilihan Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Semua Kelas (Semua Siswa)</option>
              <optgroup label="Tingkat Kelas (Gabungan)">
                {PRIMARY_SCHOOL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls} (Semua Rombel)</option>
                ))}
              </optgroup>
              <optgroup label="Rombongan Belajar (Rombel Spesifik)">
                {PRIMARY_SCHOOL_PARALLEL_CLASSES.map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </optgroup>
              {classesList.filter(c => c !== 'ALL' && !PRIMARY_SCHOOL_CLASSES.includes(c) && !PRIMARY_SCHOOL_PARALLEL_CLASSES.includes(c)).length > 0 && (
                <optgroup label="Kelas Lainnya">
                  {classesList.filter(c => c !== 'ALL' && !PRIMARY_SCHOOL_CLASSES.includes(c) && !PRIMARY_SCHOOL_PARALLEL_CLASSES.includes(c)).map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Quick Class Badges (Akses Cepat Tingkat & Rombel) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 border-t border-slate-100">
          <span className="text-[11px] text-slate-400 font-medium shrink-0 mr-1">Akses Cepat Rombel:</span>
          <button
            onClick={() => setSelectedClass('ALL')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
              selectedClass === 'ALL'
                ? 'bg-emerald-950 text-white shadow-xs ring-2 ring-emerald-700/50'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Semua ({students.length})
          </button>
          {classesList.filter(c => c !== 'ALL').map((cls) => {
            const count = students.filter(s => matchClassFilter(s.class, cls)).length;
            const isSelected = selectedClass === cls;
            const isRombel = cls.includes(' ');
            return (
              <button
                key={cls}
                onClick={() => setSelectedClass(cls)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-900 text-amber-300 shadow-xs ring-2 ring-amber-400/50'
                    : isRombel
                      ? 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <span>{cls}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-200/80 text-slate-800'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table of Students */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-emerald-100 border-b border-emerald-900">
                <th className="py-3 px-4 font-semibold">No</th>
                <th className="py-3 px-4 font-semibold">NISN</th>
                <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                <th className="py-3 px-4 font-semibold">Kelas</th>
                <th className="py-3 px-4 font-semibold">L/P</th>
                <th className="py-3 px-4 font-semibold">Orang Tua / Kontak</th>
                <th className="py-3 px-4 font-semibold text-center">Poin Pelanggaran</th>
                <th className="py-3 px-4 font-semibold text-center">Poin Reward</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Tidak ditemukan data siswa yang sesuai pencarian atau filter kelas.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student, idx) => {
                  const sum = summaryMap.get(student.id);
                  const activePts = sum?.activeViolationPoints || 0;
                  const rewardPts = sum?.totalRewardPoints || 0;

                  return (
                    <tr key={`${student.id || 'stu'}-${idx}`} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        <div>{student.nisn}</div>
                        {student.nik && <div className="text-[10px] text-slate-400 font-mono">NIK: {student.nik}</div>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{student.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">Kode Akses: {student.accessCode || '-'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-950 border border-emerald-200 rounded-lg font-bold text-[11px]">
                          {student.class}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">{student.gender}</td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-slate-800 block">{student.parentName}</span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          {student.parentPhone}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-black text-xs px-2 py-0.5 rounded-full ${
                            activePts >= 100
                              ? 'bg-rose-100 text-rose-800'
                              : activePts > 0
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {activePts} Poin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          +{rewardPts} Poin
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sum?.statusColor}`}>
                          {sum?.statusBadge || '🟢 Normal'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setDetailStudent(student)}
                            className="p-1.5 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Detail Rekam Jejak"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onQuickInputViolation(student)}
                            className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Input Pelanggaran"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onQuickInputReward(student)}
                            className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                            title="Input Reward Prestasi"
                          >
                            <Award className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(student)}
                            className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            title="Edit Data"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus data siswa ${student.name}?`)) {
                                onDeleteStudent(student.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus"
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

      {/* Add / Edit Student Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <h3 className="font-bold text-base text-emerald-100">
                {editingStudent ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NIK (16 Digit)</label>
                  <input
                    type="text"
                    value={formData.nik}
                    onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                    placeholder="Contoh: 351501..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">NISN (Nomor Induk)</label>
                  <input
                    type="text"
                    required
                    value={formData.nisn}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    placeholder="Contoh: 0089123401"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Pilihan Kelas</label>
                  <button
                    type="button"
                    onClick={() => setCustomClassMode(!customClassMode)}
                    className="text-[10px] text-emerald-700 hover:underline font-semibold"
                  >
                    {customClassMode ? '← Pilih Kelas 1-6' : 'Ketik Manual'}
                  </button>
                </div>
                {customClassMode ? (
                  <input
                    type="text"
                    required
                    value={formData.class}
                    onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                    placeholder="Contoh: Kelas 1-A atau 6B"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold"
                  />
                ) : (
                  <select
                    value={formData.class}
                    onChange={(e) => {
                      if (e.target.value === 'CUSTOM') {
                        setCustomClassMode(true);
                      } else {
                        setFormData({ ...formData, class: e.target.value });
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-bold text-slate-900"
                  >
                    <optgroup label="Rombongan Belajar (Rombel Utama)">
                      {PRIMARY_SCHOOL_PARALLEL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Tingkat Kelas (Gabungan)">
                      {PRIMARY_SCHOOL_CLASSES.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </optgroup>
                    <option value="CUSTOM">+ Tulis Format Kelas Lain...</option>
                  </select>
                )}
              </div>

              {/* Quick Class Selector Buttons for Add/Edit */}
              {!customClassMode && (
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block mb-1">Pilih Cepat Rombel:</span>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-1">
                    {PRIMARY_SCHOOL_PARALLEL_CLASSES.map(cls => (
                      <button
                        key={cls}
                        type="button"
                        onClick={() => setFormData({ ...formData, class: cls })}
                        className={`py-1 text-center rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          formData.class === cls
                            ? 'bg-emerald-900 text-amber-300 shadow-xs border border-emerald-950 ring-1 ring-amber-400'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {cls.replace('Kelas ', '')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama Lengkap Siswa"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="L">Laki-Laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">No. WhatsApp Orang Tua</label>
                  <input
                    type="text"
                    required
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nama Orang Tua / Wali Murid</label>
                <input
                  type="text"
                  required
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="Bapak / Ibu Wali"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alamat Rumah (Opsional)</label>
                <input
                  type="text"
                  value={formData.parentAddress}
                  onChange={(e) => setFormData({ ...formData, parentAddress: e.target.value })}
                  placeholder="Jl. Contoh No. 12"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kode Akses Wali Murid (Otomatis)</label>
                <input
                  type="text"
                  value={formData.accessCode}
                  onChange={(e) => setFormData({ ...formData, accessCode: e.target.value })}
                  placeholder="Biarkan kosong untuk buat otomatis (cth: AHMAD9A)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-900 hover:bg-emerald-800 text-white rounded-lg font-bold transition shadow cursor-pointer"
                >
                  {editingStudent ? 'Simpan Perubahan' : 'Tambah Siswa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {detailStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 text-xs">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-900 border border-amber-400 rounded-full flex items-center justify-center font-bold text-amber-300">
                  {detailStudent.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-emerald-100">{detailStudent.name}</h3>
                  <p className="text-emerald-300 text-[11px]">
                    NISN: {detailStudent.nisn} • Kelas: {detailStudent.class}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailStudent(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Score Snapshot */}
              {(() => {
                const sSum = summaryMap.get(detailStudent.id);
                return (
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-rose-600 block">Poin Pelanggaran</span>
                      <span className="text-xl font-black text-rose-800">{sSum?.totalViolationPoints || 0}</span>
                      <span className="text-[10px] text-rose-600 block">Aktif: {sSum?.activeViolationPoints || 0} Pt</span>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-emerald-700 block">Kompensasi</span>
                      <span className="text-xl font-black text-emerald-800">-{sSum?.totalCompensationPoints || 0}</span>
                      <span className="text-[10px] text-emerald-600 block">Pengurangan</span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center">
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Poin Reward</span>
                      <span className="text-xl font-black text-amber-800">+{sSum?.totalRewardPoints || 0}</span>
                      <span className="text-[10px] text-amber-600 block">Prestasi</span>
                    </div>
                  </div>
                );
              })()}

              {/* Bio Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-400 block text-[10px]">NIK Siswa:</span>
                    <span className="font-mono font-semibold text-slate-800">{detailStudent.nik || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">NISN:</span>
                    <span className="font-mono font-semibold text-slate-800">{detailStudent.nisn}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Orang Tua / Wali:</span>
                    <span className="font-semibold text-slate-800">{detailStudent.parentName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">No. WhatsApp:</span>
                    <span className="font-semibold text-slate-800">{detailStudent.parentPhone}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Alamat:</span>
                    <span className="text-slate-700">{detailStudent.parentAddress || '-'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kode Akses Mandiri:</span>
                    <span className="font-mono font-bold text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded">
                      {detailStudent.accessCode || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Violations List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Riwayat Pelanggaran Siswa
                </h4>
                {violations.filter(v => v.studentId === detailStudent.id).length === 0 ? (
                  <p className="text-slate-400 italic">Belum ada riwayat pelanggaran.</p>
                ) : (
                  <div className="space-y-1.5">
                    {violations
                      .filter(v => v.studentId === detailStudent.id)
                      .map((v, idx) => (
                        <div key={`${v.id || 'v'}-${idx}`} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-slate-900 block">{v.ruleName}</span>
                            <span className="text-[10px] text-slate-400">{v.date} • Saksi: {v.reporterName}</span>
                            <p className="text-slate-600 text-[11px] mt-0.5">"{v.description}"</p>
                          </div>
                          <span className="font-black text-rose-600 shrink-0 ml-2">+{v.points} Pt</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Rewards List */}
              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Riwayat Prestasi & Reward Siswa
                </h4>
                {rewards.filter(r => r.studentId === detailStudent.id).length === 0 ? (
                  <p className="text-slate-400 italic">Belum ada catatan prestasi.</p>
                ) : (
                  <div className="space-y-1.5">
                    {rewards
                      .filter(r => r.studentId === detailStudent.id)
                      .map((r, idx) => (
                        <div key={`${r.id || 'r'}-${idx}`} className="p-2.5 bg-white border border-slate-200 rounded-lg flex items-start justify-between">
                          <div>
                            <span className="font-semibold text-slate-900 block">{r.competitionName}</span>
                            <span className="text-[10px] text-amber-800 font-medium">{r.rank} • Tingkat {r.level}</span>
                          </div>
                          <span className="font-black text-amber-600 shrink-0 ml-2">+{r.points} Pt</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setDetailStudent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kenaikan Kelas Modal */}
      {promotionModalOpen && (
        <KenaikanKelasModal
          isOpen={promotionModalOpen}
          onClose={() => setPromotionModalOpen(false)}
          students={students}
          currentAcademicYear={currentAcademicYear}
          onPromoteYear={onPromoteYear}
        />
      )}

      {/* Confirmation Modal Hapus Semua Data Siswa */}
      {deleteAllModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-100 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-full shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Konfirmasi Hapus Semua Siswa</h3>
                <p className="text-xs text-rose-600 font-semibold">Tindakan ini tidak dapat dibatalkan</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong className="text-rose-700 font-bold">{students.length} data siswa</strong>? Seluruh rekam jejak poin pelanggaran, reward, dan kompensasi yang terikat juga akan dibersihkan.
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
                  if (onDeleteAllStudents) {
                    onDeleteAllStudents();
                  } else {
                    onImportStudents([]);
                  }
                  setDeleteAllModalOpen(false);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Ya, Hapus Semua Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
