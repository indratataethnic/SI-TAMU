import React, { useState } from 'react';
import { Student, Teacher, ViolationRule, ViolationRecord, SchoolSettings, StudentScoreSummary } from '../types';
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
  ShieldCheck
} from 'lucide-react';
import { openWhatsApp, generateViolationWAMessage, sendViaGateway } from '../utils/whatsapp';

interface InputPelanggaranViewProps {
  students: Student[];
  teachers?: Teacher[];
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
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedRuleId, setSelectedRuleId] = useState<string>(violationRules[0]?.id || '');
  const [customPoints, setCustomPoints] = useState<number>(violationRules[0]?.points || 20);
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState<string>(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
  const [location, setLocation] = useState<string>('Lingkungan Sekolah');
  const [description, setDescription] = useState<string>('');
  const [reporterName, setReporterName] = useState<string>(settings.bkCoordinatorName || 'Guru Piket');
  const [autoSendWA, setAutoSendWA] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const selectedRule = violationRules.find(r => r.id === selectedRuleId);
  const studentSummary = summaries.find(s => s.student.id === selectedStudentId);

  // Filter students for searchable picker
  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
    s.nisn.includes(studentSearch) ||
    s.class.toLowerCase().includes(studentSearch.toLowerCase())
  );

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

    const newViolation: ViolationRecord = {
      id: `VIOL-${Date.now()}`,
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
      reporterName,
      createdAt: new Date().toISOString()
    };

    onSaveViolation(newViolation);

    // If WhatsApp toggle is on
    if (autoSendWA) {
      const currentActive = (studentSummary?.activeViolationPoints || 0) + newViolation.points;
      const msg = generateViolationWAMessage(selectedStudent, newViolation, currentActive, settings);

      if (settings.waGatewayApiKey) {
        await sendViaGateway(selectedStudent.parentPhone, msg, settings.waGatewayApiKey);
      } else {
        openWhatsApp(selectedStudent.parentPhone, msg);
      }
    }

    setFeedback(`Data pelanggaran atas nama ${selectedStudent.name} berhasil dicatat!`);
    setDescription('');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
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
        <div className="space-y-2">
          <label className="block font-bold text-slate-800 text-sm">1. Pilih Identitas Siswa</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                placeholder="Filter nama/NISN/kelas..."
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

          {/* Selected Student Info Card */}
          {selectedStudent && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between mt-2">
              <div>
                <span className="font-bold text-slate-900 block">{selectedStudent.name} (Kelas {selectedStudent.class})</span>
                <span className="text-[11px] text-slate-500">
                  Orang Tua: {selectedStudent.parentName} • WA: {selectedStudent.parentPhone}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Poin Aktif Saat Ini</span>
                <span
                  className={`font-black text-xs px-2 py-0.5 rounded-full ${
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
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Gerbang Sekolah / Kelas"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-600 mb-1">Guru Pencatat / Saksi</label>
              {teachers && teachers.length > 0 ? (
                <div className="space-y-1.5">
                  <select
                    value={teachers.some(t => t.name === reporterName) ? reporterName : 'custom'}
                    onChange={(e) => {
                      if (e.target.value !== 'custom') {
                        setReporterName(e.target.value);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                  >
                    <option value="custom">-- Ketik Nama Guru Lainnya --</option>
                    {teachers.map(t => (
                      <option key={t.id} value={t.name}>
                        {t.name} ({t.role === 'wali_kelas' ? `Wali ${t.classAssigned}` : t.role === 'guru_bk' ? 'Guru BK' : 'Guru'})
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    required
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Nama Guru / Petugas Piket"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Nama Guru / Petugas Piket"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-medium text-xs"
                />
              )}
            </div>
          </div>
        </div>

        {/* Step 4: Chronology Description */}
        <div className="space-y-1 pt-2 border-t border-slate-100">
          <label className="block font-bold text-slate-800 text-sm">4. Kronologi & Keterangan Tambahan</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan detail singkat kronologi kejadian saat siswa melakukan pelanggaran..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
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
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold transition shadow-md cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Simpan & Catat Pelanggaran</span>
          </button>
        </div>
      </form>
    </div>
  );
};
