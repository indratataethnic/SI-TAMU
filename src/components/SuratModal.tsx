import React, { useRef, useMemo } from 'react';
import { Student, Teacher, StudentScoreSummary, SchoolSettings, ViolationRecord, ViolationRule, CompensationRecord } from '../types';
import { Printer, X, MessageSquare, FileText, AlertTriangle, ShieldCheck, CheckCircle2, MapPin, User, Calendar } from 'lucide-react';
import { openWhatsApp, generateThresholdWAMessage } from '../utils/whatsapp';
import { normalizeRecordDate, sortViolationsByDateDesc } from '../utils/storage';

interface SuratModalProps {
  summary: StudentScoreSummary;
  violations?: ViolationRecord[];
  compensations?: CompensationRecord[];
  teachers?: Teacher[];
  violationRules?: ViolationRule[];
  settings: SchoolSettings;
  suratType: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500' | 'surat_teguran';
  onClose: () => void;
}

const isIdStr = (s?: string) => Boolean(
  s && (
    s.trim().toUpperCase().startsWith('VIOL-') ||
    s.trim().toUpperCase().startsWith('REW-') ||
    s.trim().toUpperCase().startsWith('ID-') ||
    s.trim().toUpperCase().startsWith('RULE-') ||
    /^V-\d+/.test(s.trim())
  )
);

const getCleanRuleName = (v: ViolationRecord, rules: ViolationRule[] = []): string => {
  if (v.ruleName && !isIdStr(v.ruleName)) return v.ruleName;
  if ((v as any).pelanggaran && !isIdStr((v as any).pelanggaran)) return (v as any).pelanggaran;
  if ((v as any).violationName && !isIdStr((v as any).violationName)) return (v as any).violationName;
  if (v.ruleId) {
    const matched = rules.find(r => r.id === v.ruleId || r.code === v.ruleId);
    if (matched && matched.name) return matched.name;
  }
  return 'Pelanggaran Tata Tertib';
};

const formatDateID = (val?: string): string => {
  if (!val) return '-';
  const norm = normalizeRecordDate(val);
  const parts = norm.split('-');
  if (parts.length === 3) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const d = parseInt(parts[2], 10);
    const m = parseInt(parts[1], 10) - 1;
    const y = parts[0];
    if (!isNaN(d) && m >= 0 && m < 12) {
      return `${d} ${months[m]} ${y}`;
    }
  }
  return norm;
};

export const SuratModal: React.FC<SuratModalProps> = ({
  summary,
  violations = [],
  compensations = [],
  teachers = [],
  violationRules = [],
  settings,
  suratType,
  onClose
}) => {
  const student = summary.student;
  const printRef = useRef<HTMLDivElement>(null);

  // Robust student violations matching (by ID, NISN, or full name)
  const studentViolations = useMemo(() => {
    const sId = student.id;
    const sNisn = student.nisn ? String(student.nisn).trim().toLowerCase() : '';
    const sName = student.name ? student.name.toLowerCase().replace(/\s+/g, ' ').trim() : '';

    const matched = (violations || []).filter(v => {
      const vId = v.studentId;
      const vNisn = (v as any).studentNisn ? String((v as any).studentNisn).trim().toLowerCase() : '';
      const vName = v.studentName ? String(v.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';

      return (
        (vId && vId === sId) ||
        (sNisn && vNisn && sNisn === vNisn && sNisn.length >= 8 && !['l', 'p', 'lk', 'pr'].includes(sNisn)) ||
        (sName && vName && sName === vName)
      );
    });

    return sortViolationsByDateDesc(matched);
  }, [violations, student]);

  // Student compensations matching
  const studentCompensations = useMemo(() => {
    const sId = student.id;
    const sNisn = student.nisn ? String(student.nisn).trim().toLowerCase() : '';
    const sName = student.name ? student.name.toLowerCase().replace(/\s+/g, ' ').trim() : '';

    return (compensations || []).filter(c => {
      const cId = c.studentId;
      const cNisn = (c as any).studentNisn ? String((c as any).studentNisn).trim().toLowerCase() : '';
      const cName = c.studentName ? String(c.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';

      return (
        (cId && cId === sId) ||
        (sNisn && cNisn && sNisn === cNisn && sNisn.length >= 8 && !['l', 'p', 'lk', 'pr'].includes(sNisn)) ||
        (sName && cName && sName === cName)
      );
    });
  }, [compensations, student]);

  // Calculate actual totals
  const totalViolationPoints = useMemo(() => {
    if (studentViolations.length > 0) {
      return studentViolations.reduce((sum, v) => sum + (Number(v.points) || 0), 0);
    }
    return summary.totalViolationPoints || 0;
  }, [studentViolations, summary.totalViolationPoints]);

  const totalCompensationPoints = useMemo(() => {
    if (studentCompensations.length > 0) {
      return studentCompensations.reduce((sum, c) => sum + (Number((c as any).deductedPoints || (c as any).pointsReduced || (c as any).points || 0) || 0), 0);
    }
    return summary.totalCompensationPoints || 0;
  }, [studentCompensations, summary.totalCompensationPoints]);

  const activePoints = Math.max(0, totalViolationPoints - totalCompensationPoints);

  // Auto-detect student's Wali Kelas from teachers database
  const waliKelas = teachers.find(t => {
    const assigned = (t.classAssigned || (t as any).assignedClass || '').trim().toLowerCase();
    const studentCls = (student.class || '').trim().toLowerCase();
    if (!assigned || !studentCls) return false;
    return assigned === studentCls || assigned.replace(/\s+/g, '') === studentCls.replace(/\s+/g, '');
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const msg = generateThresholdWAMessage(summary, settings, studentViolations);
    openWhatsApp(student.parentPhone, msg);
  };

  // Determine letter headers and contents
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const currentYear = new Date().getFullYear();
  let nomorSurat = `${settings.letterNumberPrefix || '421.2'}/089/${currentYear}`;
  let judulSurat = 'SURAT PEMANGGILAN ORANG TUA / WALI MURID';
  let perihal = 'Pemanggilan Orang Tua / Wali Murid (Tahap I)';
  let isiParagraf1 = `Sehubungan dengan akumulasi catatan ketertiban dan pembinaan ananda di sekolah yang telah mencapai ambang batas ${activePoints} Poin (Kategori Peringatan ≥100 Poin), maka demi kebaikan, bimbingan, dan kelanjutan pendidikan ananda, kami mengharapkan kehadiran Bapak/Ibu pada:`;

  if (suratType === 'skorsing_300') {
    nomorSurat = `${settings.letterNumberPrefix || '421.2'}/SKORS/142/${currentYear}`;
    judulSurat = 'SURAT KEPUTUSAN SANKSI SKORSING & PERJANJIAN KHUSUS';
    perihal = 'Pemberitahuan Skorsing Sementara & Penandatanganan Perjanjian';
    isiParagraf1 = `Berdasarkan evaluasi tata tertib sekolah, ananda telah mencapai akumulasi ${activePoints} Poin (Kategori Pelanggaran Berat ≥300 Poin). Dengan ini sekolah memutuskan pemberian sanksi skorsing sementara serta mengundang kehadiran Bapak/Ibu untuk penandatanganan Surat Perjanjian Khusus pada:`;
  } else if (suratType === 'pembinaan_500') {
    nomorSurat = `${settings.letterNumberPrefix || '421.2'}/BAP/205/${currentYear}`;
    judulSurat = 'BERITA ACARA PENYERAHAN SISWA UNTUK PEMBINAAN DI RUMAH';
    perihal = 'Pengembalian Siswa Kepada Orang Tua (Ambang Batas ≥500 Poin)';
    isiParagraf1 = `Setelah melalui rangkaian pembinaan terpadu oleh Wali Kelas, Guru BK, dan Tim Ketertiban Sekolah, akumulasi poin tata tertib ananda telah mencapai ${activePoints} Poin (Maksimal ≥500 Poin). Maka terhitung mulai tanggal penetapan, ananda diserahkan kembali kepada orang tua untuk pembinaan intensif di lingkungan keluarga.`;
  } else if (suratType === 'surat_teguran') {
    nomorSurat = `${settings.letterNumberPrefix || '421.2'}/ST/054/${currentYear}`;
    judulSurat = 'SURAT PERINGATAN & TEGURAN TERTULIS KETERTIBAN SISWA';
    perihal = 'Pemberitahuan Rekam Jejak Ketertiban & Peringatan Dini';
    isiParagraf1 = `Dengan ini kami memberitahukan kepada Bapak/Ibu mengenai rekam jejak kedisiplinan dan tata tertib ananda di sekolah yang telah mencatat pelanggaran dengan akumulasi ${activePoints} Poin. Bersama surat ini kami lampirkan rincian lengkap kejadian untuk menjadi perhatian dan pembinaan bersama.`;
  }

  const kotaAsal = settings.schoolAddress?.split(',')?.[1]?.trim() || settings.schoolAddress?.split(',')?.[0]?.trim() || 'Kota Pasuruan';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-start p-2 sm:p-6 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-2 sm:my-4 border border-slate-200">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="no-print bg-emerald-950 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Pratinjau Surat Resmi & Rincian Rekam Jejak</h3>
              <p className="text-[11px] text-emerald-300">
                Siswa: <b className="text-white">{student.name}</b> ({student.class}) • NISN: {student.nisn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWA}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
              title="Kirim Rincian Resmi ke WhatsApp Orang Tua"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim WA Ortu</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg text-xs font-bold transition shadow cursor-pointer"
              title="Cetak Surat atau Simpan sebagai PDF"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
              title="Tutup Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div ref={printRef} className="p-6 sm:p-10 text-slate-900 bg-white print-letter">
          {/* KOP SURAT RESMI */}
          <div className="border-b-4 border-double border-emerald-950 pb-4 mb-6 flex items-center gap-4 sm:gap-5">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-900 text-emerald-100 rounded-full flex flex-col items-center justify-center font-bold text-center border-2 border-amber-400 shrink-0">
              <span className="text-lg sm:text-xl leading-tight">SI</span>
              <span className="text-[9px] sm:text-[10px] tracking-widest text-amber-300 font-semibold">TAMU</span>
            </div>
            <div className="text-center flex-1">
              <p className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-slate-700">
                Pemerintah Daerah Provinsi / Dinas Pendidikan & Kebudayaan
              </p>
              <h1 className="text-lg sm:text-2xl font-black tracking-tight text-emerald-950 uppercase mt-0.5">
                {settings.schoolName || 'UPT SATUAN PENDIDIKAN FORMAL SEKOLAH DASAR'}
              </h1>
              <p className="text-[11px] sm:text-xs italic text-emerald-800 font-semibold">
                {settings.schoolSubtitle || 'Pusat Pendidikan Karakter, Ketertiban, dan Prestasi Siswa'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">
                {settings.schoolAddress || 'Jl. Pendidikan No. 01'}
              </p>
              <p className="text-[10px] sm:text-[11px] text-slate-500">
                Telp: {settings.schoolPhone || '-'} | Email: {settings.schoolEmail || '-'}
                {settings.schoolWebsite ? ` | Website: ${settings.schoolWebsite}` : ''}
              </p>
            </div>
          </div>

          {/* JUDUL SURAT RESMI */}
          <div className="text-center mb-6">
            <h2 className="text-sm sm:text-base font-black text-slate-900 uppercase tracking-wide underline underline-offset-4">
              {judulSurat}
            </h2>
            <p className="text-xs font-mono text-slate-600 mt-1">
              Nomor: <span className="font-bold text-slate-800">{nomorSurat}</span>
            </p>
          </div>

          {/* DETAIL SURAT */}
          <div className="flex flex-col sm:flex-row justify-between items-start text-xs sm:text-sm gap-4 mb-6">
            <div>
              <table className="text-xs sm:text-sm">
                <tbody>
                  <tr>
                    <td className="pr-3 py-0.5 font-medium text-slate-600">Lampiran</td>
                    <td className="pr-2">:</td>
                    <td className="font-medium text-slate-800">1 (Satu) Berkas Rincian Rekam Jejak Ketertiban</td>
                  </tr>
                  <tr>
                    <td className="pr-3 py-0.5 font-medium text-slate-600">Perihal</td>
                    <td className="pr-2">:</td>
                    <td className="font-bold text-emerald-950 underline">{perihal}</td>
                  </tr>
                  <tr>
                    <td className="pr-3 py-0.5 font-medium text-slate-600">Sifat</td>
                    <td className="pr-2">:</td>
                    <td className="font-semibold text-rose-700">Penting / Rahasia</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-left sm:text-right text-xs sm:text-sm">
              <p>{kotaAsal}, {todayFormatted}</p>
              <p className="mt-2 text-slate-600 font-medium">Kepada Yth.</p>
              <p className="font-bold text-slate-900">Bapak/Ibu Orang Tua / Wali dari:</p>
              <p className="font-black text-emerald-950 text-sm">{student.name}</p>
              <p className="text-xs text-slate-600">Siswa Kelas: <b>{student.class}</b> • NISN: {student.nisn}</p>
              <p className="text-xs text-slate-500">di Tempat</p>
            </div>
          </div>

          {/* ISI SURAT */}
          <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-slate-800">
            <p>Dengan hormat,</p>
            <p className="text-justify leading-normal">{isiParagraf1}</p>

            {/* JADWAL PERTEMUAN (Untuk Pemanggilan & Skorsing) */}
            {suratType !== 'surat_teguran' && (
              <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 sm:p-4 my-3 text-xs sm:text-sm print:border-black">
                <table className="w-full">
                  <tbody>
                    <tr>
                      <td className="w-28 sm:w-36 py-1 font-medium text-slate-600">Hari / Tanggal</td>
                      <td className="w-3">:</td>
                      <td className="font-bold text-slate-900">Senin / Hari Kerja Berikutnya (Segera)</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-slate-600">Waktu</td>
                      <td>:</td>
                      <td className="font-semibold text-slate-900">Pukul 08.30 WIB - Selesai</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-slate-600">Tempat</td>
                      <td>:</td>
                      <td className="font-semibold text-slate-900">Ruang Bimbingan Konseling (BK) / Tim Ketertiban Sekolah</td>
                    </tr>
                    <tr>
                      <td className="py-1 font-medium text-slate-600">Bertemu Dengan</td>
                      <td>:</td>
                      <td className="font-bold text-slate-900">
                        {settings.bkCoordinatorName || 'Koordinator Guru BK'} & Wali Kelas {student.class}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 📋 SECTION: RINCIAN REKAM JEJAK KETERTIBAN SISWA (SESUAI DATA PELANGGARAN) */}
            {/* ========================================================================= */}
            <div className="border-2 border-emerald-900 rounded-xl overflow-hidden my-5 print-table">
              {/* Header Banner */}
              <div className="bg-emerald-950 text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider flex flex-wrap items-center justify-between gap-2 border-b border-emerald-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Rincian Rekam Jejak Ketertiban Siswa</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-900/90 text-amber-300 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border border-emerald-700">
                    Akumulasi Poin Aktif: {activePoints} Poin
                  </span>
                </div>
              </div>

              {/* Biodata Mini Strip */}
              <div className="p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-emerald-50/60 border-b border-emerald-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Nama Lengkap Siswa:</span>
                  <span className="font-bold text-slate-900">{student.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kelas / NISN:</span>
                  <span className="font-bold text-slate-800">{student.class} • {student.nisn}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Total Pelanggaran:</span>
                  <span className="font-bold text-rose-700">
                    +{totalViolationPoints} Poin ({studentViolations.length} Kasus)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">Kompensasi / Pengurangan:</span>
                  <span className="font-bold text-emerald-700">
                    -{totalCompensationPoints} Poin ({studentCompensations.length} Kegiatan)
                  </span>
                </div>
              </div>

              {/* Table of Violations */}
              <div className="overflow-x-auto print-expand">
                <table className="w-full text-left border-collapse text-[11px] sm:text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 border-b border-slate-300 font-bold">
                      <th className="py-2.5 px-3 w-8 text-center border-r border-slate-300">No.</th>
                      <th className="py-2.5 px-3 w-28 border-r border-slate-300">Tanggal & Waktu</th>
                      <th className="py-2.5 px-3 w-24 border-r border-slate-300 text-center">Tingkat</th>
                      <th className="py-2.5 px-3 border-r border-slate-300">Jenis Pelanggaran & Catatan Kronologi</th>
                      <th className="py-2.5 px-3 w-32 border-r border-slate-300">Lokasi Kejadian</th>
                      <th className="py-2.5 px-3 w-32 border-r border-slate-300">Pencatat / Saksi</th>
                      <th className="py-2.5 px-3 w-20 text-center">Poin (+)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {studentViolations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 px-4 text-center text-slate-400 italic">
                          Tidak ditemukan catatan pelanggaran tata tertib pada sistem untuk siswa ini.
                        </td>
                      </tr>
                    ) : (
                      studentViolations.map((v, idx) => {
                        const ruleName = getCleanRuleName(v, violationRules);
                        const desc = v.description && v.description !== ruleName ? v.description : null;
                        const cat = String(v.category || 'ringan').toLowerCase();

                        return (
                          <tr key={v.id || idx} className="hover:bg-slate-50 transition print:hover:bg-transparent">
                            <td className="py-2 px-3 text-center font-bold text-slate-600 border-r border-slate-200">
                              {idx + 1}
                            </td>
                            <td className="py-2 px-3 font-mono text-slate-800 border-r border-slate-200 whitespace-nowrap">
                              <span className="font-semibold block">{formatDateID(v.date)}</span>
                              {v.time && <span className="text-[10px] text-slate-500 block font-mono">{v.time} WIB</span>}
                            </td>
                            <td className="py-2 px-3 text-center border-r border-slate-200">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  cat === 'berat'
                                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                    : cat === 'sedang'
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {cat}
                              </span>
                            </td>
                            <td className="py-2 px-3 border-r border-slate-200">
                              <span className="font-bold text-slate-900 block leading-tight">{ruleName}</span>
                              {desc && (
                                <p className="text-[10px] text-slate-600 mt-0.5 italic leading-tight">
                                  "{desc}"
                                </p>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0 no-print" />
                                <span>{v.location || 'Lingkungan Sekolah'}</span>
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 border-r border-slate-200">
                              <span className="font-medium text-slate-900 block">{v.reporterName || 'Guru Piket'}</span>
                              {v.reporterNip && <span className="text-[10px] text-slate-400 font-mono block">NIP: {v.reporterNip}</span>}
                            </td>
                            <td className="py-2 px-3 text-center font-extrabold text-rose-700">
                              +{v.points}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {studentViolations.length > 0 && (
                    <tfoot>
                      <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-900">
                        <td colSpan={6} className="py-2 px-3 text-right border-r border-slate-300 uppercase tracking-wider text-[10px] sm:text-xs">
                          Total Akumulasi Poin Pelanggaran ({studentViolations.length} Kasus):
                        </td>
                        <td className="py-2 px-3 text-center font-black text-rose-700 text-xs sm:text-sm">
                          +{totalViolationPoints}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>

              {/* Kompensasi Table if any */}
              {studentCompensations.length > 0 && (
                <div className="border-t-2 border-emerald-800 bg-emerald-50/40 p-3">
                  <p className="text-xs font-bold text-emerald-950 mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Kegiatan Kompensasi / Pembinaan Positif yang Telah Dilakukan:</span>
                  </p>
                  <table className="w-full text-left border-collapse text-[10px] sm:text-[11px] bg-white rounded border border-emerald-200">
                    <thead>
                      <tr className="bg-emerald-100/70 text-emerald-900 font-bold border-b border-emerald-200">
                        <th className="py-1 px-2 w-8 text-center border-r border-emerald-200">No.</th>
                        <th className="py-1 px-2 w-28 border-r border-emerald-200">Tanggal</th>
                        <th className="py-1 px-2 border-r border-emerald-200">Kegiatan / Tugas Kompensasi</th>
                        <th className="py-1 px-2 w-36 border-r border-emerald-200">Guru Pembina</th>
                        <th className="py-1 px-2 w-20 text-center">Pengurangan (-)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-100">
                      {studentCompensations.map((c, i) => (
                        <tr key={c.id || i}>
                          <td className="py-1 px-2 text-center text-slate-600 border-r border-emerald-100">{i + 1}</td>
                          <td className="py-1 px-2 font-mono text-slate-800 border-r border-emerald-100">{formatDateID(c.date)}</td>
                          <td className="py-1 px-2 font-medium text-slate-900 border-r border-emerald-100">{c.taskName}</td>
                          <td className="py-1 px-2 text-slate-700 border-r border-emerald-100">{c.supervisorName || '-'}</td>
                          <td className="py-1 px-2 text-center font-bold text-emerald-700">
                            -{(c as any).deductedPoints || (c as any).pointsReduced || (c as any).points || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-emerald-100/50 font-bold text-emerald-950 border-t border-emerald-200">
                        <td colSpan={4} className="py-1 px-2 text-right border-r border-emerald-200 uppercase text-[9px] sm:text-[10px]">
                          Total Pengurangan Kompensasi ({studentCompensations.length} Kegiatan):
                        </td>
                        <td className="py-1 px-2 text-center font-black text-emerald-800 text-[11px]">
                          -{totalCompensationPoints}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}

              {/* Perhitungan Bersih Box */}
              <div className="bg-slate-100 p-2.5 sm:p-3 border-t border-slate-300 flex flex-wrap items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-1.5 text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>
                    Kalkulasi Bersih: <b>+{totalViolationPoints} Pt</b> (Pelanggaran) - <b>{totalCompensationPoints} Pt</b> (Kompensasi) = <b className="text-emerald-950 font-black">{activePoints} Poin Aktif</b>
                  </span>
                </div>
                <div className="font-bold text-rose-800">
                  Status Ambang Batas: <span className="underline">{summary.statusBadge || 'Pemanggilan Orang Tua'}</span>
                </div>
              </div>
            </div>

            <p className="text-justify leading-normal">
              Mengingat pentingnya koordinasi pembinaan terpadu demi masa depan, keselamatan, dan pembentukan karakter terpuji ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktu dan tempat yang telah ditentukan. Atas perhatian, pengertian, dan kerja sama yang baik, kami ucapkan terima kasih.
            </p>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className={`grid ${waliKelas ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mt-8 pt-6 text-xs sm:text-sm text-center border-t border-slate-200 print:border-black`}>
            {waliKelas && (
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-900">Wali Kelas {student.class}</p>
                <div className="h-16 sm:h-20 flex items-center justify-center">
                  <span className="text-[11px] italic text-slate-300">[Tanda Tangan]</span>
                </div>
                <p className="font-bold text-emerald-950 underline">{waliKelas.name}</p>
                <p className="text-[11px] text-slate-600">NIP. {waliKelas.nip || '-'}</p>
              </div>
            )}

            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Guru Bimbingan Konseling (BK)</p>
              <div className="h-16 sm:h-20 flex items-center justify-center">
                <span className="text-[11px] italic text-slate-300">[Tanda Tangan]</span>
              </div>
              <p className="font-bold text-emerald-950 underline">{settings.bkCoordinatorName || 'Koordinator BK'}</p>
              <p className="text-[11px] text-slate-600">NIP. {settings.bkCoordinatorNip || '-'}</p>
            </div>

            <div>
              <p className="text-slate-600">{kotaAsal}, {todayFormatted}</p>
              <p className="font-bold text-slate-900">Kepala Sekolah,</p>
              <div className="h-16 sm:h-20 flex items-center justify-center">
                <span className="text-[11px] italic text-slate-300">[Tanda Tangan & Cap Resmi]</span>
              </div>
              <p className="font-bold text-emerald-950 underline">{settings.principalName || 'Kepala Sekolah'}</p>
              <p className="text-[11px] text-slate-600">NIP. {settings.principalNip || '-'}</p>
            </div>
          </div>

          {/* FOOTER VERIFIKASI */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex flex-wrap justify-between items-center gap-2">
            <span>Dicetak secara resmi melalui SI TAMU (Sistem Informasi Tata Tertib Murid) - {settings.schoolName}</span>
            <span className="font-mono">Verifikasi Dokumen: #{student.id}-{student.nisn || 'VERIF'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
