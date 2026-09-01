import React, { useMemo } from 'react';
import { Teacher, ViolationRecord, RewardRecord, SchoolSettings, DayOfWeek } from '../types';
import {
  Printer,
  X,
  Clock,
  FileText,
  AlertTriangle,
  Award
} from 'lucide-react';

interface JurnalPiketModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  dayName: DayOfWeek;
  dutyTeachers: Teacher[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  settings: SchoolSettings;
}

export const JurnalPiketModal: React.FC<JurnalPiketModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  dayName,
  dutyTeachers,
  violations,
  rewards,
  settings
}) => {
  if (!isOpen) return null;

  // Filter records for the selected date
  const dayViolations = violations.filter(v => v.date === selectedDate);
  const dayRewards = rewards.filter(r => r.date === selectedDate);

  const totalViolationPoints = dayViolations.reduce((acc, v) => acc + (Number(v.points) || 0), 0);
  const totalRewardPoints = dayRewards.reduce((acc, r) => acc + (Number(r.points) || 0), 0);

  const handlePrint = () => {
    window.print();
  };

  // Format date readable in Indonesian
  const formattedDate = useMemo(() => {
    try {
      const d = new Date(selectedDate);
      if (isNaN(d.getTime())) return selectedDate;
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(d);
    } catch {
      return `${dayName}, ${selectedDate}`;
    }
  }, [selectedDate, dayName]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-8">
        {/* Modal Header */}
        <div className="bg-emerald-950 px-6 py-4 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-base">Buku Jurnal Piket Harian Sekolah</h3>
              <p className="text-xs text-emerald-200">Laporan Rekapitulasi Ketertiban & Disiplin Harian ({dayName})</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-emerald-950 font-bold rounded-xl text-xs transition cursor-pointer shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="text-emerald-300 hover:text-white p-1.5 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Content */}
        <div className="p-8 sm:p-10 space-y-6 text-slate-800 bg-white" id="jurnal-piket-print-area">
          {/* Header Kop Surat */}
          <div className="border-b-2 border-emerald-900 pb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {settings.schoolLogo ? (
                <img
                  src={settings.schoolLogo}
                  alt="Logo"
                  className="w-16 h-16 object-contain"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-16 h-16 rounded-xl bg-emerald-900 text-white flex items-center justify-center font-black text-2xl">
                  {settings.schoolName?.charAt(0) || 'S'}
                </div>
              )}
              <div>
                <h1 className="text-lg font-black text-slate-900 tracking-tight uppercase">
                  {settings.schoolName}
                </h1>
                <p className="text-xs text-slate-600 font-medium">{settings.schoolAddress}</p>
                <p className="text-[11px] text-slate-500 font-mono">
                  {settings.schoolPhone ? `Telp: ${settings.schoolPhone}` : ''}{' '}
                  {settings.schoolEmail ? `• Email: ${settings.schoolEmail}` : ''}
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-900 font-extrabold text-xs rounded-lg uppercase tracking-wider border border-emerald-300">
                Jurnal Piket Harian
              </span>
              <p className="text-xs text-slate-500 font-medium mt-1">T.A. {settings.academicYear}</p>
            </div>
          </div>

          {/* Date & Duty Officers Meta */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Hari & Tanggal Tugas</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{formattedDate}</p>
              <p className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Jam Piket: 06.30 - 15.00 WIB (Kondisional Bergerak)</span>
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500 font-semibold uppercase">Tim Guru Piket Bertugas</p>
              <div className="mt-1 space-y-0.5">
                {dutyTeachers.length === 0 ? (
                  <p className="text-slate-400 italic">Belum ada penugasan guru piket</p>
                ) : (
                  dutyTeachers.map((t, idx) => (
                    <div key={t.id} className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-emerald-800 text-white text-[10px] flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span>{t.name}</span>
                      <span className="text-[10px] font-normal text-slate-500 font-mono">({t.nip})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Pelanggaran</span>
              <p className="text-xl font-black text-rose-700 mt-0.5">{dayViolations.length}</p>
              <span className="text-[10px] text-slate-400">Kasus Kejadian</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Poin Pelanggaran</span>
              <p className="text-xl font-black text-rose-800 mt-0.5">{totalViolationPoints}</p>
              <span className="text-[10px] text-rose-600 font-medium">Akumulasi Minus</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Total Prestasi</span>
              <p className="text-xl font-black text-amber-600 mt-0.5">{dayRewards.length}</p>
              <span className="text-[10px] text-slate-400">Pemberian Reward</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500">Poin Reward</span>
              <p className="text-xl font-black text-emerald-800 mt-0.5">+{totalRewardPoints}</p>
              <span className="text-[10px] text-emerald-700 font-medium">Poin Apresiasi</span>
            </div>
          </div>

          {/* Table 1: Catatan Pelanggaran Hari Ini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-rose-950 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                I. Catatan Pelanggaran Tata Tertib Siswa
              </h3>
              <span className="text-[11px] text-slate-500">{dayViolations.length} Kasus Terdata</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-8 text-center">No</th>
                    <th className="py-2 px-3">Nama Siswa & Kelas</th>
                    <th className="py-2 px-3">Bentuk Pelanggaran</th>
                    <th className="py-2 px-3">Lokasi Kejadian</th>
                    <th className="py-2 px-3 text-center">Poin</th>
                    <th className="py-2 px-3">Petugas / Saksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dayViolations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic text-[11px]">
                        Nihil. Tidak ada catatan pelanggaran tata tertib pada hari ini.
                      </td>
                    </tr>
                  ) : (
                    dayViolations.map((v, i) => (
                      <tr key={v.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900">{v.studentName}</span>
                          <span className="ml-1.5 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                            {v.studentClass}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800">
                          {v.ruleName}
                          <span className="ml-1 text-[10px] text-rose-700 font-bold uppercase">
                            ({v.category})
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {v.location ? `📍 ${v.location}` : '-'}
                        </td>
                        <td className="py-2 px-3 text-center font-extrabold text-rose-600">
                          +{v.points}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">
                          {v.reporterName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Catatan Apresiasi / Reward Hari Ini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-amber-600" />
                II. Catatan Prestasi & Apresiasi Perilaku Baik
              </h3>
              <span className="text-[11px] text-slate-500">{dayRewards.length} Prestasi</span>
            </div>

            <div className="border border-slate-300 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-300 text-[11px]">
                  <tr>
                    <th className="py-2 px-3 w-8 text-center">No</th>
                    <th className="py-2 px-3">Nama Siswa & Kelas</th>
                    <th className="py-2 px-3">Prestasi / Perilaku Terpuji</th>
                    <th className="py-2 px-3">Tingkat / Capaian</th>
                    <th className="py-2 px-3 text-center">Poin</th>
                    <th className="py-2 px-3">Pencatat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dayRewards.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400 italic text-[11px]">
                        Tidak ada catatan reward/prestasi pada hari ini.
                      </td>
                    </tr>
                  ) : (
                    dayRewards.map((r, i) => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 text-center font-mono text-slate-500">{i + 1}</td>
                        <td className="py-2 px-3">
                          <span className="font-bold text-slate-900">{r.studentName}</span>
                          <span className="ml-1.5 text-[10px] bg-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                            {r.studentClass}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-800 font-medium">
                          {r.competitionName}
                        </td>
                        <td className="py-2 px-3 text-amber-800 font-semibold">
                          {r.rank} • {r.level}
                        </td>
                        <td className="py-2 px-3 text-center font-extrabold text-emerald-800">
                          +{r.points}
                        </td>
                        <td className="py-2 px-3 text-slate-700 font-medium">
                          {r.reporterName}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signature Block for Print */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-xs text-center border-t border-slate-200">
            <div>
              <p className="text-slate-600">Mengetahui,</p>
              <p className="font-bold text-slate-900 mt-0.5">Kepala {settings.schoolName}</p>
              <div className="h-20 flex items-center justify-center">
                {/* Tanda tangan placeholder */}
              </div>
              <p className="font-bold text-slate-900 uppercase underline">{settings.principalName || '( .......................................... )'}</p>
              <p className="text-[11px] text-slate-500 font-mono">NIP: {settings.principalNip || '..........................................'}</p>
            </div>

            <div>
              <p className="text-slate-600">Petugas Piket Bertanggung Jawab,</p>
              <p className="font-bold text-slate-900 mt-0.5">Koordinator Guru Piket Harian</p>
              <div className="h-20 flex items-center justify-center">
                {/* Tanda tangan placeholder */}
              </div>
              <p className="font-bold text-slate-900 uppercase underline">
                {dutyTeachers[0]?.name || '( .......................................... )'}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">
                NIP: {dutyTeachers[0]?.nip || '..........................................'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
