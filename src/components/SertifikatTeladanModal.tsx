import React, { useEffect } from 'react';
import { SchoolSettings, StudentScoreSummary } from '../types';
import { Award, Printer, X, MessageSquare, Sparkles, CheckCircle2, ShieldCheck, Star, Crown } from 'lucide-react';
import confetti from 'canvas-confetti';
import { openWhatsApp } from '../utils/whatsapp';

interface SertifikatTeladanModalProps {
  isOpen?: boolean;
  summary: StudentScoreSummary;
  settings: SchoolSettings;
  periodText?: string;
  onClose: () => void;
}

export const SertifikatTeladanModal: React.FC<SertifikatTeladanModalProps> = ({
  summary,
  settings,
  periodText = 'Semester Ganjil / Genap Tahun Ajaran Berjalan',
  onClose
}) => {
  useEffect(() => {
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
        colors: ['#047857', '#10b981', '#f59e0b', '#fbbf24', '#d97706', '#064e3b']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    const student = summary.student;
    const text = `*PIAGAM PENGHARGAAN SISWA TELADAN ${settings.schoolName.toUpperCase()}*\n\n` +
      `Yth. Bapak/Ibu Orang Tua/Wali dari ananda *${student.name}* (Kelas ${student.class}),\n\n` +
      `Kami dengan bangga menyampaikan apresiasi setinggi-tingginya kepada ananda atas keteladanan kedisiplinan dan budi pekerti luhur di sekolah.\n\n` +
      `🏅 *Penghargaan:* SISWA TELADAN BERPRESTASI & DISIPLIN PRIMA\n` +
      `📌 *Catatan Pelanggaran:* 0 (NOL) Poin Pelanggaran\n` +
      `⭐ *Total Poin Reward:* +${summary.totalRewardPoints} Poin\n` +
      `🏫 *Sekolah:* ${settings.schoolName}\n\n` +
      `Semoga ananda terus menjadi teladan dan inspirasi bagi rekan-rekan siswa lainnya. Terima kasih atas bimbingan dan doa Bapak/Ibu di rumah.\n\n` +
      `Hormat kami,\n*Kepala Sekolah: ${settings.principalName}*\n*Koordinator BK: ${settings.bkCoordinatorName}*`;

    openWhatsApp(student.parentPhone, text);
  };

  const todayFormatted = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date());

  const certNumber = `TELADAN/${summary.student.class.replace(/\s+/g, '-')}/${new Date().getFullYear()}/${summary.student.nisn.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 border border-emerald-900/30">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="no-print bg-emerald-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-300">Piagam Resmi Siswa Teladan Kelas {summary.student.class}</h3>
              <p className="text-xs text-emerald-300">Predikat Disiplin Prima & Karakter Positif (0 Poin Pelanggaran)</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendWA}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
              title="Kirim Piagam ke WhatsApp Orang Tua"
            >
              <MessageSquare className="w-4 h-4" />
              Kirim ke WA Ortu
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold rounded-lg text-xs transition shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              Cetak / Simpan PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LUXURIOUS PRINTABLE CERTIFICATE */}
        <div className="p-4 sm:p-8 bg-slate-100 flex justify-center items-center">
          <div className="print-certificate bg-white w-full aspect-[1.414/1] relative p-8 sm:p-12 text-center rounded-xl shadow-2xl border-[12px] border-emerald-950 flex flex-col justify-between overflow-hidden">
            {/* Elegant Double Inner Gold Border */}
            <div className="absolute inset-3 border-2 border-amber-500/70 pointer-events-none rounded-lg"></div>
            <div className="absolute inset-5 border border-dashed border-amber-400/40 pointer-events-none rounded"></div>

            {/* Corner Decorative Ornaments */}
            <div className="absolute top-6 left-6 text-amber-500/60 text-2xl font-serif select-none pointer-events-none">❖</div>
            <div className="absolute top-6 right-6 text-amber-500/60 text-2xl font-serif select-none pointer-events-none">❖</div>
            <div className="absolute bottom-6 left-6 text-amber-500/60 text-2xl font-serif select-none pointer-events-none">❖</div>
            <div className="absolute bottom-6 right-6 text-amber-500/60 text-2xl font-serif select-none pointer-events-none">❖</div>

            {/* Certificate Header */}
            <div className="relative z-10 pt-2">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-amber-400 flex items-center justify-center font-bold text-sm shadow-md">
                  {settings.schoolName?.charAt(0) || 'S'}
                </div>
                <div className="text-left">
                  <h4 className="text-xs tracking-[0.25em] font-extrabold uppercase text-emerald-900">{settings.schoolName}</h4>
                  <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">{settings.schoolSubtitle || 'KEMENTERIAN PENDIDIKAN, KEBUDAYAAN, RISET, DAN TEKNOLOGI'}</p>
                </div>
              </div>

              <div className="my-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-amber-900 text-[10px] font-bold tracking-widest uppercase mb-1">
                  <Crown className="w-3 h-3 text-amber-600 inline" /> PENGHARGAAN RESMI SEKOLAH
                </span>
                <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-emerald-950 uppercase mt-1">
                  PIAGAM SISWA TELADAN
                </h1>
                <p className="text-[11px] text-slate-500 font-mono tracking-widest mt-0.5">
                  Nomor: {certNumber}
                </p>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="relative z-10 my-auto py-2">
              <p className="text-xs sm:text-sm text-slate-600 font-medium italic">
                Kepala Sekolah & Tim Bimbingan Konseling dengan bangga menganugerahkan predikat kepada:
              </p>

              <div className="my-3">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight underline decoration-amber-400 decoration-2 underline-offset-8">
                  {summary.student.name}
                </h2>
                <div className="flex items-center justify-center gap-3 text-xs sm:text-sm text-slate-700 font-semibold mt-3">
                  <span className="px-3 py-0.5 bg-emerald-50 text-emerald-900 rounded-full border border-emerald-200">
                    Kelas: {summary.student.class}
                  </span>
                  <span>•</span>
                  <span className="font-mono text-slate-600">NISN: {summary.student.nisn}</span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-700 max-w-xl mx-auto leading-relaxed mt-2">
                Sebagai <strong className="text-emerald-950 font-extrabold">MURID TELADAN KELAS {summary.student.class}</strong> atas keteladanan sikap budi pekerti luhur, kedisiplinan prima dengan rekam jejak <strong className="text-emerald-900 font-black">0 (Nol) Poin Pelanggaran</strong> serta kontribusi prestasi positif aktif <strong className="text-amber-800 font-bold">(+{summary.totalRewardPoints} Poin Reward)</strong>.
              </p>
            </div>

            {/* Certificate Footer / Signatures */}
            <div className="relative z-10 pt-4 pb-2 border-t border-slate-200/80">
              <div className="flex justify-between items-end px-4 sm:px-12 text-xs">
                {/* BK Coordinator Signature */}
                <div className="text-center w-48">
                  <p className="text-slate-600 text-[11px]">Mengetahui,</p>
                  <p className="text-slate-700 font-semibold text-[11px] mb-12">Koordinator Bimbingan Konseling</p>
                  <p className="font-bold text-emerald-950 text-xs sm:text-sm underline">{settings.bkCoordinatorName || 'Koordinator BK'}</p>
                  <p className="text-[10px] text-slate-600">NIP. {settings.bkCoordinatorNip || '-'}</p>
                </div>

                {/* Official Golden Seal */}
                <div className="hidden sm:flex flex-col items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-0.5 shadow-xl flex items-center justify-center">
                    <div className="w-full h-full rounded-full bg-emerald-950 border-2 border-amber-300 flex flex-col items-center justify-center text-amber-300">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-[8px] font-black uppercase tracking-tighter">DISIPLIN</span>
                      <span className="text-[7px] font-bold text-amber-200">TELADAN</span>
                    </div>
                  </div>
                </div>

                {/* Principal Signature */}
                <div className="text-center w-48">
                  <p className="text-slate-600 text-[11px]">Ditetapkan di {settings.schoolAddress.split(',')[1] || 'Tempat'}</p>
                  <p className="text-slate-700 font-semibold text-[11px] mb-12">Pada tanggal {todayFormatted}<br />Kepala Sekolah</p>
                  <p className="font-bold text-emerald-950 text-xs sm:text-sm underline">{settings.principalName || 'Kepala Sekolah'}</p>
                  <p className="text-[10px] text-slate-600">NIP. {settings.principalNip || '-'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
