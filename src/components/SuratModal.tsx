import React, { useRef } from 'react';
import { Student, Teacher, StudentScoreSummary, SchoolSettings, ViolationRecord } from '../types';
import { Printer, X, MessageSquare, Download, ShieldAlert, Award, FileText } from 'lucide-react';
import { openWhatsApp, generateThresholdWAMessage } from '../utils/whatsapp';

interface SuratModalProps {
  summary: StudentScoreSummary;
  violations?: ViolationRecord[];
  teachers?: Teacher[];
  settings: SchoolSettings;
  suratType: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500' | 'surat_teguran';
  onClose: () => void;
}

export const SuratModal: React.FC<SuratModalProps> = ({
  summary,
  violations = [],
  teachers = [],
  settings,
  suratType,
  onClose
}) => {
  const student = summary.student;
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-detect student's Wali Kelas from teachers database
  const waliKelas = teachers.find(
    t => t.assignedClass && t.assignedClass.trim().toLowerCase() === student.class.trim().toLowerCase()
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const msg = generateThresholdWAMessage(summary, settings);
    openWhatsApp(student.parentPhone, msg);
  };

  // Determine letter headers and contents
  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  let nomorSurat = `${settings.letterNumberPrefix}/089/2026`;
  let judulSurat = 'SURAT PEMANGGILAN ORANG TUA / WALI MURID';
  let perihal = 'Pemanggilan Orang Tua / Wali Murid (Tahap I)';
  let isiParagraf1 = `Sehubungan dengan akumulasi catatan ketertiban dan pembinaan ananda di sekolah yang telah mencapai ambang batas ${summary.activeViolationPoints} Poin (Kategori Peringatan ≥100 Poin), maka demi kebaikan dan perkembangan ananda, kami mengharapkan kehadiran Bapak/Ibu pada:`;
  
  if (suratType === 'skorsing_300') {
    nomorSurat = `${settings.letterNumberPrefix}/SKORS/142/2026`;
    judulSurat = 'SURAT KEPUTUSAN SANKSI SKORSING & PERJANJIAN KHUSUS';
    perihal = 'Pemberitahuan Skorsing Sementara & Penandatanganan Perjanjian';
    isiParagraf1 = `Berdasarkan evaluasi tata tertib sekolah, ananda telah mencapai akumulasi ${summary.activeViolationPoints} Poin (Kategori Pelanggaran Berat ≥300 Poin). Dengan ini sekolah memutuskan pemberian sanksi skorsing sementara serta mengundang kehadiran Bapak/Ibu untuk penandatanganan Surat Perjanjian Khusus pada:`;
  } else if (suratType === 'pembinaan_500') {
    nomorSurat = `${settings.letterNumberPrefix}/BAP/205/2026`;
    judulSurat = 'BERITA ACARA PENYERAHAN SISWA UNTUK PEMBINAAN DI RUMAH';
    perihal = 'Pengembalian Siswa Kepada Orang Tua (Ambang Batas ≥500 Poin)';
    isiParagraf1 = `Setelah melalui rangkaian pembinaan terpadu oleh Wali Kelas, Guru BK, dan Tim Ketertiban Sekolah, akumulasi poin tata tertib ananda telah mencapai ${summary.activeViolationPoints} Poin (Maksimal ≥500 Poin). Maka terhitung mulai tanggal penetapan, ananda diserahkan kembali kepada orang tua untuk pembinaan intensif di lingkungan keluarga.`;
  }

  // Filter violations for this student
  const studentViolations = violations.filter(v => v.studentId === student.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 border border-slate-200">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="no-print bg-emerald-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-lg">Pratinjau Dokumen Resmi Sekolah</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWA}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
              title="Kirim Draf Resmi ke WhatsApp Orang Tua"
            >
              <MessageSquare className="w-4 h-4" />
              Kirim ke WA Ortu
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-emerald-950 rounded-lg text-sm font-bold transition shadow cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document Body */}
        <div ref={printRef} className="p-8 sm:p-12 text-slate-900 bg-white print-letter">
          {/* KOP SURAT RESMI */}
          <div className="border-b-4 border-double border-emerald-950 pb-4 mb-6 flex items-center gap-5">
            <div className="w-20 h-20 bg-emerald-900 text-emerald-100 rounded-full flex flex-col items-center justify-center font-bold text-center border-2 border-amber-400 shrink-0">
              <span className="text-xl">SI</span>
              <span className="text-[10px] tracking-widest text-amber-300 font-semibold">TAMU</span>
            </div>
            <div className="text-center flex-1">
              <p className="text-xs uppercase tracking-wider font-semibold text-slate-600">Pemerintah Daerah Provinsi / Dinas Pendidikan</p>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-emerald-950 uppercase">{settings.schoolName}</h1>
              <p className="text-xs italic text-emerald-800 font-medium">{settings.schoolSubtitle}</p>
              <p className="text-xs text-slate-600 mt-1">{settings.schoolAddress}</p>
              <p className="text-xs text-slate-500">Telp: {settings.schoolPhone} | Email: {settings.schoolEmail}</p>
            </div>
          </div>

          {/* DETAIL SURAT */}
          <div className="flex justify-between items-start text-sm mb-6">
            <div>
              <table className="text-sm">
                <tbody>
                  <tr>
                    <td className="pr-4 py-0.5 font-medium text-slate-600">Nomor</td>
                    <td className="pr-2">:</td>
                    <td className="font-semibold text-slate-900">{nomorSurat}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 font-medium text-slate-600">Lampiran</td>
                    <td className="pr-2">:</td>
                    <td>1 (Satu) Lembar Rekap Poin</td>
                  </tr>
                  <tr>
                    <td className="pr-4 py-0.5 font-medium text-slate-600">Perihal</td>
                    <td className="pr-2">:</td>
                    <td className="font-bold text-emerald-950 underline">{perihal}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="text-right text-sm">
              <p>{settings.schoolAddress.split(',')[1] || 'Kota'}, {todayFormatted}</p>
              <p className="mt-2 text-slate-600 font-medium">Kepada Yth.</p>
              <p className="font-bold text-slate-900">Bapak/Ibu Orang Tua / Wali dari:</p>
              <p className="font-semibold text-emerald-900">{student.name} ({student.class})</p>
              <p className="text-xs text-slate-500">di Tempat</p>
            </div>
          </div>

          {/* ISI SURAT */}
          <div className="space-y-4 text-sm leading-relaxed text-slate-800">
            <p>Dengan hormat,</p>
            <p className="text-justify">{isiParagraf1}</p>

            {/* JADWAL PERTEMUAN */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 my-3 text-sm">
              <table className="w-full">
                <tbody>
                  <tr>
                    <td className="w-32 py-1 font-medium text-slate-600">Hari / Tanggal</td>
                    <td className="w-4">:</td>
                    <td className="font-semibold text-slate-900">Senin / Hari Kerja Berikutnya</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-medium text-slate-600">Waktu</td>
                    <td>:</td>
                    <td className="font-semibold text-slate-900">Pukul 08.30 WIB - Selesai</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-medium text-slate-600">Tempat</td>
                    <td>:</td>
                    <td className="font-semibold text-slate-900">Ruang Bimbingan Konseling (BK) / Tim Ketertiban</td>
                  </tr>
                  <tr>
                    <td className="py-1 font-medium text-slate-600">Bertemu Dengan</td>
                    <td>:</td>
                    <td className="font-semibold text-slate-900">Koordinator BK & Wali Kelas {student.class}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* RINGKASAN DATA SISWA */}
            <div className="border border-slate-200 rounded-xl overflow-hidden my-4">
              <div className="bg-emerald-950 text-white px-4 py-2 text-xs font-bold uppercase tracking-wider flex justify-between">
                <span>Rincian Rekam Jejak Ketertiban Siswa</span>
                <span>Akumulasi Poin Aktif: {summary.activeViolationPoints} Poin</span>
              </div>
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/50 text-xs">
                <div>
                  <span className="text-slate-500 block">NISN Siswa:</span>
                  <span className="font-bold text-slate-900">{student.nisn}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Pelanggaran:</span>
                  <span className="font-bold text-rose-700">{summary.totalViolationPoints} Poin ({summary.violationsCount} Kasus)</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Poin Kompensasi:</span>
                  <span className="font-bold text-emerald-700">-{summary.totalCompensationPoints} Poin</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Status Tindakan:</span>
                  <span className="font-bold text-amber-800">{summary.statusBadge}</span>
                </div>
              </div>

              {studentViolations.length > 0 && (
                <div className="p-3 border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-700 mb-2">Riwayat Kejadian Terakhir:</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {studentViolations.slice(0, 4).map((v, i) => (
                      <div key={i} className="text-xs flex items-start justify-between bg-white p-2 rounded border border-slate-100">
                        <div>
                          <span className="font-medium text-slate-900">{v.ruleName}</span>
                          <span className="text-slate-500 block text-[11px]">{v.date} • {v.location || 'Sekolah'} • Saksi: {v.reporterName}</span>
                        </div>
                        <span className="font-bold text-rose-600 shrink-0 ml-2">+{v.points} Poin</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <p className="text-justify">
              Mengingat pentingnya koordinasi ini demi masa depan ananda, kami sangat mengharapkan kehadiran Bapak/Ibu tepat pada waktunya. Atas perhatian, pengertian, dan kerja sama yang baik, kami ucapkan terima kasih.
            </p>
          </div>

          {/* TANDA TANGAN RESMI */}
          <div className={`grid ${waliKelas ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mt-10 pt-6 text-sm text-center`}>
            {waliKelas && (
              <div>
                <p className="text-slate-600">Mengetahui,</p>
                <p className="font-bold text-slate-900">Wali Kelas {student.class}</p>
                <div className="h-20 flex items-center justify-center">
                  <span className="text-xs italic text-slate-300">[Tanda Tangan]</span>
                </div>
                <p className="font-bold text-emerald-950 underline">{waliKelas.name}</p>
                <p className="text-xs text-slate-600">NIP. {waliKelas.nip || '-'}</p>
              </div>
            )}

            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900">Guru Bimbingan Konseling</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-xs italic text-slate-300">[Tanda Tangan]</span>
              </div>
              <p className="font-bold text-emerald-950 underline">{settings.bkCoordinatorName}</p>
              <p className="text-xs text-slate-600">NIP. {settings.bkCoordinatorNip}</p>
            </div>

            <div>
              <p className="text-slate-600">{settings.schoolAddress.split(',')[1] || 'Kota'}, {todayFormatted}</p>
              <p className="font-bold text-slate-900">Kepala Sekolah,</p>
              <div className="h-20 flex items-center justify-center">
                <span className="text-xs italic text-slate-300">[Tanda Tangan & Cap Resmi]</span>
              </div>
              <p className="font-bold text-emerald-950 underline">{settings.principalName}</p>
              <p className="text-xs text-slate-600">NIP. {settings.principalNip}</p>
            </div>
          </div>

          {/* FOOTER */}
          <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] text-slate-400 flex justify-between items-center">
            <span>Dicetak secara otomatis melalui SI TAMU (Sistem Informasi Tata Tertib Murid)</span>
            <span>Verifikasi Dokumen: #{student.id}-{Date.now().toString().slice(-6)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
