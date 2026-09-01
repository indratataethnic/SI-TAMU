import React, { useEffect } from 'react';
import { RewardRecord, SchoolSettings, Student } from '../types';
import { Award, Printer, X, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { openWhatsApp, generateRewardWAMessage } from '../utils/whatsapp';

interface SertifikatModalProps {
  reward: RewardRecord;
  student?: Student;
  totalRewardPoints?: number;
  settings: SchoolSettings;
  onClose: () => void;
}

export const SertifikatModal: React.FC<SertifikatModalProps> = ({
  reward,
  student,
  totalRewardPoints = 0,
  settings,
  onClose
}) => {
  useEffect(() => {
    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#064e3b', '#10b981', '#f59e0b', '#fbbf24', '#d97706']
      });
    } catch (e) {
      // ignore
    }
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleSendWA = () => {
    if (student) {
      const msg = generateRewardWAMessage(student, reward, totalRewardPoints, settings);
      openWhatsApp(student.parentPhone, msg);
    }
  };

  const formattedDate = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(reward.date || Date.now()));

  const certNumber = reward.certificateNumber || `PIAGAM/SITAMU/${new Date().getFullYear()}/${reward.id.slice(-4)}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex justify-center items-start p-3 sm:p-6 no-print-bg">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden my-4 border border-emerald-900/30">
        {/* Header Action Bar (Hidden on Print) */}
        <div className="no-print bg-emerald-950 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b border-emerald-800">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-amber-400" />
            <div>
              <h3 className="font-bold text-lg text-amber-300">Piagam Penghargaan Prestasi Siswa</h3>
              <p className="text-xs text-emerald-300">Desain Sertifikat Resmi Hijau Botol & Emas Elegan</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {student && (
              <button
                onClick={handleSendWA}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium transition cursor-pointer"
                title="Kirim Piagam ke WhatsApp Orang Tua"
              >
                <MessageSquare className="w-4 h-4" />
                Bagikan ke WA Ortu
              </button>
            )}
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-emerald-950 font-bold rounded-lg text-sm transition shadow-lg cursor-pointer"
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
        <div className="p-4 sm:p-10 bg-slate-100 flex justify-center items-center">
          <div className="print-certificate bg-white w-full aspect-[1.414/1] relative p-8 sm:p-12 text-center rounded-xl shadow-2xl border-[12px] border-emerald-950 flex flex-col justify-between overflow-hidden">
            {/* Elegant Double Inner Gold Border */}
            <div className="absolute inset-3 border-2 border-amber-500/70 pointer-events-none rounded-lg"></div>
            <div className="absolute inset-5 border border-dashed border-amber-400/40 pointer-events-none rounded"></div>

            {/* Corner Decorative Accents */}
            <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-amber-500 rounded-tl pointer-events-none"></div>
            <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-amber-500 rounded-tr pointer-events-none"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-amber-500 rounded-bl pointer-events-none"></div>
            <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-amber-500 rounded-br pointer-events-none"></div>

            {/* Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
              <Award className="w-96 h-96 text-emerald-950" />
            </div>

            {/* CERTIFICATE HEADER */}
            <div className="relative z-10 space-y-1">
              <div className="flex items-center justify-center gap-3 mb-1">
                <div className="w-10 h-10 bg-emerald-950 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs border border-amber-400 shadow">
                  SI
                </div>
                <div className="text-center">
                  <h4 className="text-xs tracking-[0.25em] font-extrabold uppercase text-emerald-900">{settings.schoolName}</h4>
                  <p className="text-[10px] text-slate-500 tracking-wider uppercase font-medium">{settings.schoolSubtitle}</p>
                </div>
              </div>

              <div className="pt-2">
                <h1 className="font-['Cinzel',serif] text-2xl sm:text-4xl font-extrabold text-emerald-950 tracking-wider">
                  PIAGAM PENGHARGAAN
                </h1>
                <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] text-amber-600 uppercase mt-0.5">
                  CERTIFICATE OF ACHIEVEMENT & EXCELLENCE
                </p>
                <p className="text-[11px] font-mono text-slate-400 mt-1">
                  Nomor: {certNumber}
                </p>
              </div>
            </div>

            {/* CERTIFICATE BODY */}
            <div className="relative z-10 my-4 sm:my-6 space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm italic text-slate-600">
                Piagam Penghargaan ini diberikan dengan penuh apresiasi kepada:
              </p>

              <div className="py-1">
                <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 uppercase tracking-wide border-b-2 border-amber-500/60 inline-block px-8 pb-1">
                  {reward.studentName}
                </h2>
                <p className="text-xs sm:text-sm font-semibold text-emerald-800 mt-1">
                  Kelas {reward.studentClass}
                </p>
              </div>

              <div className="max-w-2xl mx-auto space-y-1 text-slate-800">
                <p className="text-xs sm:text-sm">
                  Atas prestasi dan capaian membanggakan sebagai:
                </p>
                <div className="inline-flex items-center gap-2 bg-emerald-900 text-amber-300 font-bold px-4 py-1.5 rounded-full text-sm sm:text-base border border-amber-400 shadow-sm">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{reward.rank} — Tingkat {reward.level}</span>
                </div>
                <p className="text-sm sm:text-base font-bold text-slate-900 mt-2">
                  "{reward.competitionName}"
                </p>
                {reward.organizer && (
                  <p className="text-xs text-slate-500">
                    Diselenggarakan oleh: <span className="font-medium text-slate-700">{reward.organizer}</span>
                  </p>
                )}
                {reward.notes && (
                  <p className="text-xs italic text-slate-600 max-w-lg mx-auto mt-1">
                    "{reward.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* CERTIFICATE FOOTER & SIGNATURES */}
            <div className="relative z-10 pt-2 border-t border-slate-200/80">
              <div className="flex justify-between items-end px-4 sm:px-8 text-xs">
                {/* Reward Point Gold Seal */}
                <div className="text-left flex items-center gap-3">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-emerald-950 flex flex-col items-center justify-center font-black shadow-lg border-2 border-amber-200">
                    <span className="text-[9px] uppercase tracking-tighter font-extrabold">Reward</span>
                    <span className="text-base sm:text-lg leading-tight">+{reward.points}</span>
                    <span className="text-[8px] uppercase">Poin</span>
                  </div>
                  <div className="hidden sm:block text-[11px] text-slate-500">
                    <p className="font-semibold text-emerald-900">Terdaftar Resmi</p>
                    <p>Sistem SI TAMU</p>
                  </div>
                </div>

                {/* Date & Principal Signature */}
                <div className="text-center w-52 sm:w-60">
                  <p className="text-slate-600 text-[11px]">Ditetapkan di {settings.schoolAddress.split(',')[1] || 'Kota'}</p>
                  <p className="text-slate-700 text-[11px] font-medium">Pada tanggal {formattedDate}</p>
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-[10px] italic text-slate-300">[Tanda Tangan & Cap Sekolah]</span>
                  </div>
                  <p className="font-bold text-emerald-950 text-xs sm:text-sm underline">{settings.principalName}</p>
                  <p className="text-[10px] text-slate-600">Kepala Sekolah • NIP. {settings.principalNip}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
