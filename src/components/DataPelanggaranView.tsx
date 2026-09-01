import React, { useState } from 'react';
import { ViolationRecord, Student, StudentScoreSummary, SchoolSettings } from '../types';
import {
  AlertTriangle,
  Search,
  Filter,
  Download,
  Plus,
  MessageSquare,
  Printer,
  Trash2,
  Eye,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { exportViolationsToExcel } from '../utils/excel';
import { openWhatsApp, generateViolationWAMessage, sendViaGateway } from '../utils/whatsapp';

interface DataPelanggaranViewProps {
  violations: ViolationRecord[];
  students: Student[];
  summaries: StudentScoreSummary[];
  settings: SchoolSettings;
  onDeleteViolation: (id: string) => void;
  onNavigateToInput: () => void;
  onOpenSurat: (summary: StudentScoreSummary) => void;
}

export const DataPelanggaranView: React.FC<DataPelanggaranViewProps> = ({
  violations,
  students,
  summaries,
  settings,
  onDeleteViolation,
  onNavigateToInput,
  onOpenSurat
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [detailRecord, setDetailRecord] = useState<ViolationRecord | null>(null);
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  const studentMap = new Map<string, Student>(students.map(s => [s.id, s]));
  const summaryMap = new Map<string, StudentScoreSummary>(summaries.map(s => [s.student.id, s]));

  const classesList = ['ALL', ...Array.from(new Set(violations.map(v => v.studentClass))).sort()];

  const filteredViolations = violations.filter(v => {
    const matchesCat = selectedCategory === 'ALL' || v.category === selectedCategory;
    const matchesCls = selectedClass === 'ALL' || v.studentClass === selectedClass;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      v.studentName.toLowerCase().includes(q) ||
      v.ruleName.toLowerCase().includes(q) ||
      v.reporterName.toLowerCase().includes(q) ||
      v.description.toLowerCase().includes(q);
    return matchesCat && matchesCls && matchesSearch;
  });

  const handleSendWA = async (record: ViolationRecord) => {
    const student = studentMap.get(record.studentId);
    if (!student) {
      alert('Data siswa tidak ditemukan.');
      return;
    }

    const summary = summaryMap.get(record.studentId);
    const activePts = summary?.activeViolationPoints || record.points;
    const message = generateViolationWAMessage(student, record, activePts, settings);

    if (settings.waGatewayApiKey) {
      const res = await sendViaGateway(student.parentPhone, message, settings.waGatewayApiKey);
      if (res.success) {
        setNotificationStatus(`Notifikasi WA otomatis berhasil dikirim ke orang tua ${student.name}!`);
        setTimeout(() => setNotificationStatus(null), 4000);
        return;
      }
    }

    // Fallback to 1-Click WhatsApp Web
    openWhatsApp(student.parentPhone, message);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            Data & Rekap Pelanggaran Tata Tertib
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Riwayat kasus pelanggaran tata tertib siswa, aksi notifikasi WhatsApp wali murid, dan cetak surat resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportViolationsToExcel(violations)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export Excel
          </button>
          <button
            onClick={onNavigateToInput}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition shadow cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Input Pelanggaran Baru
          </button>
        </div>
      </div>

      {notificationStatus && (
        <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs flex items-center gap-2 font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          <span>{notificationStatus}</span>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Siswa, Jenis Pelanggaran, Guru..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">Kategori:</span>
            {['ALL', 'berat', 'sedang', 'ringan'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-emerald-950 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat === 'ALL' ? 'Semua' : cat}
              </button>
            ))}
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-xs text-slate-500 font-medium">Kelas:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-none"
            >
              {classesList.map(c => (
                <option key={c} value={c}>{c === 'ALL' ? 'Semua Kelas' : c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-emerald-100 border-b border-emerald-900">
                <th className="py-3 px-4 font-semibold">Tanggal</th>
                <th className="py-3 px-4 font-semibold">Nama Siswa</th>
                <th className="py-3 px-4 font-semibold">Kelas</th>
                <th className="py-3 px-4 font-semibold">Kategori</th>
                <th className="py-3 px-4 font-semibold">Jenis Pelanggaran</th>
                <th className="py-3 px-4 font-semibold text-center">Poin</th>
                <th className="py-3 px-4 font-semibold">Pencatat / Saksi</th>
                <th className="py-3 px-4 font-semibold text-center">Menu Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    Tidak ada catatan pelanggaran yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v) => {
                  const student = studentMap.get(v.studentId);
                  const summary = summaryMap.get(v.studentId);

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        <span>{v.date}</span>
                        {v.time && <span className="block text-[10px] text-slate-400">{v.time}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-bold text-slate-900 block">{v.studentName}</span>
                        {student && <span className="text-[10px] text-slate-400 font-mono">NISN: {student.nisn}</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px]">
                          {v.studentClass}
                        </span>
                      </td>
                      <td className="py-3 px-4">
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
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800 max-w-xs truncate">
                        {v.ruleName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          +{v.points}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        <span className="font-medium text-slate-900 block">{v.reporterName}</span>
                        {v.reporterNip && <span className="text-[10px] text-slate-400 font-mono">NIP: {v.reporterNip}</span>}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* 1-Click WA */}
                          <button
                            onClick={() => handleSendWA(v)}
                            className="p-1.5 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition cursor-pointer"
                            title="Kirim Pesan Resmi ke WhatsApp Orang Tua"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>

                          {/* Cetak Surat Peringatan */}
                          {summary && (
                            <button
                              onClick={() => onOpenSurat(summary)}
                              className="p-1.5 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                              title="Buat / Cetak Surat Panggilan Resmi"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Detail */}
                          <button
                            onClick={() => setDetailRecord(v)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                            title="Lihat Kronologi Detail"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Hapus */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Hapus catatan pelanggaran ${v.ruleName} untuk ${v.studentName}?`)) {
                                onDeleteViolation(v.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Hapus Catatan"
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

      {/* Detail Modal */}
      {detailRecord && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 text-xs">
            <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
              <h3 className="font-bold text-base text-emerald-100">Detail Catatan Pelanggaran</h3>
              <button
                onClick={() => setDetailRecord(null)}
                className="p-1 text-slate-300 hover:text-white rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">{detailRecord.studentName}</span>
                  <span className="text-slate-600">Kelas {detailRecord.studentClass}</span>
                </div>
                <span className="text-lg font-black text-rose-700 bg-white px-3 py-1 rounded-lg border border-rose-200">
                  +{detailRecord.points} Poin
                </span>
              </div>

              <div className="space-y-2">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Jenis Pelanggaran</span>
                  <span className="font-bold text-slate-800 text-sm">{detailRecord.ruleName}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Waktu & Tanggal:</span>
                    <span className="font-medium text-slate-700">{detailRecord.date} {detailRecord.time || ''}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Lokasi Kejadian:</span>
                    <span className="font-medium text-slate-700">{detailRecord.location || 'Lingkungan Sekolah'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Guru Pencatat / Saksi:</span>
                    <span className="font-semibold text-emerald-950 block">{detailRecord.reporterName}</span>
                    {detailRecord.reporterNip && (
                      <span className="text-[10px] text-slate-500 font-mono">NIP: {detailRecord.reporterNip}</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Kategori:</span>
                    <span className="font-bold text-rose-700 uppercase">{detailRecord.category}</span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-1">Kronologi / Catatan Kejadian</span>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 leading-relaxed">
                  "{detailRecord.description}"
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    handleSendWA(detailRecord);
                    setDetailRecord(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Kirim ke WA Orang Tua
                </button>
                <button
                  type="button"
                  onClick={() => setDetailRecord(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
