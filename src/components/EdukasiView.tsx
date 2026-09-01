import React, { useState } from 'react';
import { ViolationRule, RewardRule, SchoolSettings } from '../types';
import {
  BookOpen,
  AlertTriangle,
  Award,
  HeartHandshake,
  ShieldCheck,
  HelpCircle,
  Sparkles,
  ChevronDown,
  CheckCircle2,
  PhoneCall,
  Scale
} from 'lucide-react';

interface EdukasiViewProps {
  violationRules: ViolationRule[];
  rewardRules: RewardRule[];
  settings: SchoolSettings;
}

export const EdukasiView: React.FC<EdukasiViewProps> = ({
  violationRules,
  rewardRules,
  settings
}) => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Apa tujuan utama dari penerapan SI TAMU?',
      a: 'SI TAMU (Sistem Informasi Tata Tertib Murid) dirancang sebagai instrumen pendidikan karakter positif dan transparansi pembinaan kedisiplinan. Sistem ini mengedepankan pembinaan edukatif, bukan hukuman semata, serta memberikan kesempatan bagi murid untuk memperbaiki diri.'
    },
    {
      q: 'Apa yang terjadi jika poin pelanggaran mencapai 100 poin?',
      a: 'Pihak sekolah melalui Guru Bimbingan Konseling (BK) dan Wali Kelas akan menerbitkan Surat Panggilan Orang Tua Tahap I untuk berdialog bersama orang tua mengenai perkembangan sikap murid dan langkah pembinaan bersama.'
    },
    {
      q: 'Bagaimana cara murid mengurangi poin pelanggaran (Kompensasi)?',
      a: 'Murid yang memiliki poin pelanggaran aktif dapat mengajukan permohonan tugas kompensasi positif melalui Guru BK atau Wali Kelas. Tugas tersebut mencakup kegiatan bernilai sosial seperti resume buku karakter di perpustakaan, bakti lingkungan, atau tugas edukasi lainnya yang dibimbing oleh guru.'
    },
    {
      q: 'Apa konsekuensi jika poin mencapai 300 dan 500 poin?',
      a: 'Pada ambang 300 poin, diberlakukan sanksi skorsing sementara disertai penandatanganan Surat Perjanjian Khusus. Pada ambang 500 poin (batas maksimal), murid diserahkan kembali kepada orang tua untuk pembinaan intensif di lingkungan keluarga.'
    },
    {
      q: 'Bagaimana sistem apresiasi reward prestasi murid?',
      a: 'Setiap prestasi akademik maupun non-akademik (Juara I, II, III tingkat Kota, Provinsi, hingga Nasional) akan dicatat ke dalam database SI TAMU dan mendapatkan poin apresiasi reward serta penerbitan Piagam Penghargaan Resmi dari sekolah.'
    }
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-emerald-900 to-teal-950 text-white rounded-2xl p-6 sm:p-8 border border-emerald-800 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-800/80 border border-amber-400/40 rounded-full text-amber-300 text-xs font-semibold">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Pedoman Tata Tertib & Disiplin Positif</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Edukasi Tata Tertib & Buku Saku SI TAMU
          </h2>
          <p className="text-xs sm:text-sm text-emerald-200 leading-relaxed">
            Panduan lengkap ketentuan disiplin, katalog pelanggaran, skema penghargaan prestasi, dan mekanisme kompensasi poin di lingkungan <span className="text-amber-300 font-semibold">{settings.schoolName}</span>.
          </p>
        </div>
      </div>

      {/* 3-Step Threshold Workflow */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-2.5">
          <Scale className="w-5 h-5 text-emerald-800" />
          <h3 className="font-bold text-slate-900 text-base">Alur Penanganan Berjenjang Poin Pelanggaran</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-amber-50/80 border-2 border-amber-200 space-y-2 relative">
            <span className="text-xs font-black px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg inline-block font-mono">
              Ambang 100 Poin
            </span>
            <h4 className="font-bold text-amber-950 text-sm">Panggilan Orang Tua Tahap I</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Sekolah menghubungi orang tua dan menjadwalkan temu wicara bersama Wali Kelas & BK untuk menyusun komitmen pembinaan.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-red-50/80 border-2 border-red-200 space-y-2 relative">
            <span className="text-xs font-black px-2.5 py-1 bg-red-500 text-white rounded-lg inline-block font-mono">
              Ambang 300 Poin
            </span>
            <h4 className="font-bold text-red-950 text-sm">Skorsing & Kompensasi Poin</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Pemberlakuan sanksi skorsing sementara & penandatanganan perjanjian tertulis. Murid didorong melakukan <strong>tugas kompensasi</strong> guna mereduksi akumulasi poin.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-rose-50/80 border-2 border-rose-300 space-y-2 relative">
            <span className="text-xs font-black px-2.5 py-1 bg-rose-700 text-white rounded-lg inline-block font-mono">
              Ambang 500 Poin
            </span>
            <h4 className="font-bold text-rose-950 text-sm">Pembinaan di Rumah</h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              Penerbitan Berita Acara resmi pengembalian murid ke orang tua untuk pembinaan intensif berkelanjutan dalam pengawasan keluarga.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Breakdown by Category */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          Rincian Ketentuan Poin Pelanggaran Sekolah
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Berat */}
          <div className="bg-white rounded-2xl border border-rose-200 overflow-hidden shadow-xs">
            <div className="bg-rose-950 text-white p-4 font-bold text-xs flex justify-between items-center">
              <span>🔴 Pelanggaran Berat</span>
              <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[10px]">20 Poin</span>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {violationRules.filter(r => r.category === 'berat').map((r, i) => (
                <div key={r.id} className="flex items-start gap-2 text-slate-700">
                  <span className="text-rose-600 font-bold">•</span>
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sedang */}
          <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
            <div className="bg-amber-950 text-white p-4 font-bold text-xs flex justify-between items-center">
              <span>⚠️ Pelanggaran Sedang</span>
              <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[10px] font-bold">10 Poin</span>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {violationRules.filter(r => r.category === 'sedang').map((r, i) => (
                <div key={r.id} className="flex items-start gap-2 text-slate-700">
                  <span className="text-amber-600 font-bold">•</span>
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ringan */}
          <div className="bg-white rounded-2xl border border-emerald-200 overflow-hidden shadow-xs">
            <div className="bg-emerald-950 text-white p-4 font-bold text-xs flex justify-between items-center">
              <span>⚡ Pelanggaran Ringan</span>
              <span className="bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px]">5 Poin</span>
            </div>
            <div className="p-4 space-y-2 text-xs">
              {violationRules.filter(r => r.category === 'ringan').map((r, i) => (
                <div key={r.id} className="flex items-start gap-2 text-slate-700">
                  <span className="text-emerald-600 font-bold">•</span>
                  <span>{r.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Reward Matrix Table */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            Matriks Poin Reward Prestasi & Piagam
          </h3>
          <span className="text-xs text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
            Poin Positif & Piagam Resmi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-emerald-950 text-emerald-100">
                <th className="py-2.5 px-4 font-semibold">Tingkat Ajang</th>
                <th className="py-2.5 px-4 font-semibold text-center">Juara I</th>
                <th className="py-2.5 px-4 font-semibold text-center">Juara II</th>
                <th className="py-2.5 px-4 font-semibold text-center">Juara III</th>
                <th className="py-2.5 px-4 font-semibold text-center">Peserta Lomba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900">Tingkat Nasional</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+9 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+8 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+7 Poin</td>
                <td className="py-2.5 px-4 text-center text-slate-400">0 Poin (Piagam)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900">Tingkat Provinsi</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+6 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+5 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+4 Poin</td>
                <td className="py-2.5 px-4 text-center text-slate-400">0 Poin (Piagam)</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-bold text-slate-900">Tingkat Kota / Kabupaten</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+3 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+2 Poin</td>
                <td className="py-2.5 px-4 text-center font-bold text-amber-700">+1 Poin</td>
                <td className="py-2.5 px-4 text-center text-slate-400">0 Poin (Piagam)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-800" />
          Pertanyaan Sering Diajukan (FAQ)
        </h3>

        <div className="space-y-2 text-xs">
          {faqs.map((f, idx) => (
            <div key={idx} className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-4 text-left font-bold text-slate-900 flex justify-between items-center hover:bg-slate-50 transition cursor-pointer"
              >
                <span>{f.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform ${
                    openFaq === idx ? 'rotate-180 text-emerald-800' : ''
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 pb-4 pt-1 text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
