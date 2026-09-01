import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { X, Award, GraduationCap, ArrowRight, AlertTriangle, CheckCircle, ChevronDown, RefreshCw, UserCheck } from 'lucide-react';

interface KenaikanKelasModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  currentAcademicYear: string;
  onPromoteYear: (promotedStudents: Student[], nextYear: string) => void;
}

// Helper to calculate the next class level automatically
export const getNextClass = (currentClass: string): string => {
  const normalized = currentClass.trim();
  
  // If the class contains 6 (e.g., Kelas 6, Kelas 6-A, 6B)
  if (normalized.toLowerCase().includes('kelas 6') || normalized.match(/\b6\b/) || normalized.toLowerCase() === '6' || normalized.toLowerCase().startsWith('6')) {
    return 'Alumni (Lulus)';
  }
  
  if (normalized === 'Alumni (Lulus)' || normalized === 'Mutasi / Keluar') {
    return normalized;
  }

  // Find digits and increment them (e.g., Kelas 1-A -> Kelas 2-A)
  const matchDigit = normalized.match(/\d+/);
  if (matchDigit) {
    const currentNum = parseInt(matchDigit[0], 10);
    if (currentNum >= 6) {
      return 'Alumni (Lulus)';
    }
    const nextNum = currentNum + 1;
    return normalized.replace(matchDigit[0], String(nextNum));
  }
  
  return normalized; // Fallback
};

// Helper to predict the next academic year
export const getNextAcademicYear = (currentYear: string): string => {
  const parts = currentYear.split('/');
  if (parts.length === 2) {
    const year1 = parseInt(parts[0], 10);
    const year2 = parseInt(parts[1], 10);
    if (!isNaN(year1) && !isNaN(year2)) {
      return `${year1 + 1}/${year2 + 1}`;
    }
  }
  // Fallback
  const currentFullYear = new Date().getFullYear();
  return `${currentFullYear}/${currentFullYear + 1}`;
};

export const KenaikanKelasModal: React.FC<KenaikanKelasModalProps> = ({
  isOpen,
  onClose,
  students,
  currentAcademicYear = '2026/2027',
  onPromoteYear
}) => {
  const [nextYear, setNextYear] = useState<string>(() => getNextAcademicYear(currentAcademicYear));
  const [studentStates, setStudentStates] = useState<Record<string, 'promote' | 'stay' | 'leave'>>(() => {
    const states: Record<string, 'promote' | 'stay' | 'leave'> = {};
    students.forEach(s => {
      states[s.id] = 'promote';
    });
    return states;
  });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('ALL');
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Filter out students who are already Alumni or Mutasi
  const activeStudents = useMemo(() => {
    return students.filter(s => s.class !== 'Alumni (Lulus)' && s.class !== 'Mutasi / Keluar');
  }, [students]);

  const uniqueClasses = useMemo(() => {
    const classes = activeStudents.map(s => s.class).filter(Boolean);
    return Array.from(new Set(classes)).sort();
  }, [activeStudents]);

  // Filter active students based on search and class filter
  const filteredStudents = useMemo(() => {
    return activeStudents.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || s.name.toLowerCase().includes(q) || s.nisn.includes(q);
      const matchesClass = classFilter === 'ALL' || s.class === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [activeStudents, searchQuery, classFilter]);

  // Compute stats
  const stats = useMemo(() => {
    let promotedCount = 0;
    let stayCount = 0;
    let graduatedCount = 0;
    let leaveCount = 0;

    activeStudents.forEach(s => {
      const state = studentStates[s.id] || 'promote';
      if (state === 'leave') {
        leaveCount++;
      } else if (state === 'stay') {
        stayCount++;
      } else {
        const nextClass = getNextClass(s.class);
        if (nextClass === 'Alumni (Lulus)') {
          graduatedCount++;
        } else {
          promotedCount++;
        }
      }
    });

    return { promotedCount, stayCount, graduatedCount, leaveCount };
  }, [activeStudents, studentStates]);

  const handleStateChange = (studentId: string, state: 'promote' | 'stay' | 'leave') => {
    setStudentStates(prev => ({
      ...prev,
      [studentId]: state
    }));
  };

  const handleSelectAllInView = (state: 'promote' | 'stay' | 'leave') => {
    setStudentStates(prev => {
      const next = { ...prev };
      filteredStudents.forEach(s => {
        next[s.id] = state;
      });
      return next;
    });
  };

  const handleExecutePromotion = () => {
    const yearPattern = /^\d{4}\/\d{4}$/;
    if (!yearPattern.test(nextYear.trim())) {
      alert('Format Tahun Ajaran Baru harus YYYY/YYYY, contoh: 2027/2028');
      return;
    }

    const confirmMsg = `PENTING!\n\nAnda akan memproses Kenaikan Kelas otomatis ke Tahun Ajaran Baru: ${nextYear}.\n\nKonsekuensi:\n1. Kelas seluruh siswa aktif akan dinaikkan setingkat lebih tinggi.\n2. Siswa Kelas 6 akan diluluskan menjadi Alumni.\n3. Seluruh poin pelanggaran dan reward di SI TAMU akan MULAI DARI 0 untuk tahun ajaran baru.\n4. Riwayat tahun ${currentAcademicYear} tetap tersimpan aman di database arsip.\n5. Integrasi Google Spreadsheet akan disinkronkan secara otomatis.\n\nApakah Anda yakin ingin memproses kenaikan kelas sekarang?`;

    if (window.confirm(confirmMsg)) {
      setIsProcessing(true);
      
      // Compute the updated student list
      const updatedStudents = students.map(s => {
        const state = studentStates[s.id];
        
        // If the student was not active (already Alumni or Mutasi), keep them as they are
        if (s.class === 'Alumni (Lulus)' || s.class === 'Mutasi / Keluar') {
          return s;
        }

        let nextClass = s.class;
        if (state === 'leave') {
          nextClass = 'Mutasi / Keluar';
        } else if (state === 'stay') {
          // Class stays the same, but they are now in the new Academic Year
          nextClass = s.class;
        } else {
          nextClass = getNextClass(s.class);
        }

        return {
          ...s,
          class: nextClass,
          academicYear: nextYear
        };
      });

      // Call parent promotion handler
      setTimeout(() => {
        onPromoteYear(updatedStudents, nextYear);
        setIsProcessing(false);
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }, 1500);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-center p-3 sm:p-6 text-slate-800">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl overflow-hidden my-4 border border-slate-200 flex flex-col max-h-[92vh]">
        
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 rounded-lg text-emerald-400">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-100">Kenaikan Kelas & Tahun Pelajaran Baru</h3>
              <p className="text-xs text-emerald-300">Proses kenaikan kelas berjenjang otomatis, kelulusan alumni, dan reset poin berkala</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="flex-1 p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-200 animate-bounce">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h4 className="text-xl font-bold text-emerald-900">Kenaikan Kelas Berhasil Diproses!</h4>
            <p className="text-slate-500 max-w-md text-xs">
              Seluruh kelas siswa telah diperbarui, siswa kelas 6 dideklarasikan sebagai alumni, dan poin aktif telah di-reset ke saldo awal untuk tahun pelajaran baru <strong>{nextYear}</strong>.
            </p>
            <p className="text-xs text-emerald-700 font-bold">
              Sinkronisasi Google Spreadsheet sedang berjalan...
            </p>
          </div>
        ) : (
          <>
            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Top Explanation Banner & School Year Configuration */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="font-bold text-emerald-950 text-xs flex items-center gap-1.5 uppercase tracking-wide">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    PANDUAN PROSES KENAIKAN KELAS
                  </h4>
                  <ul className="list-disc pl-4 text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
                    <li>Sistem akan menaikkan kelas siswa secara berjenjang (contoh: <strong>Kelas 1-A → Kelas 2-A</strong>).</li>
                    <li>Siswa <strong>Kelas 6</strong> akan lulus dan berpindah status ke <strong>Alumni (Lulus)</strong>.</li>
                    <li>Siswa yang dinyatakan <strong>Tinggal Kelas</strong> dapat ditandai secara manual di tabel di bawah.</li>
                    <li>Poin pelanggaran & reward siswa lama akan <strong>diarsipkan</strong> dan aktif kembali bersih (0) untuk menjamin kelanjutan setiap tahun pelajaran.</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs flex flex-col justify-between">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Tahun Pelajaran Baru:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-600 border border-slate-200">
                        {currentAcademicYear}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={nextYear}
                        onChange={(e) => setNextYear(e.target.value)}
                        placeholder="Contoh: 2027/2028"
                        className="flex-1 px-2.5 py-1 text-xs font-mono font-bold bg-amber-50 border border-amber-300 rounded text-amber-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2">
                    Format wajib: 4 digit tahun / 4 digit tahun (contoh: 2027/2028).
                  </p>
                </div>

              </div>

              {/* Live Preview Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-emerald-800 tracking-wider">Naik Kelas</p>
                  <p className="text-2xl font-black text-emerald-950 mt-1">{stats.promotedCount}</p>
                  <p className="text-[9px] text-emerald-700 font-medium mt-0.5">Siswa berjenjang</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 p-3.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-blue-800 tracking-wider">Lulus (Alumni)</p>
                  <p className="text-2xl font-black text-blue-950 mt-1">{stats.graduatedCount}</p>
                  <p className="text-[9px] text-blue-700 font-medium mt-0.5">Dari Kelas 6</p>
                </div>
                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-rose-800 tracking-wider">Tinggal Kelas</p>
                  <p className="text-2xl font-black text-rose-950 mt-1">{stats.stayCount}</p>
                  <p className="text-[9px] text-rose-700 font-medium mt-0.5">Mengulang kelas lama</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-800 tracking-wider">Mutasi / Keluar</p>
                  <p className="text-2xl font-black text-slate-950 mt-1">{stats.leaveCount}</p>
                  <p className="text-[9px] text-slate-600 font-medium mt-0.5">Diarsipkan keluar</p>
                </div>
              </div>

              {/* Student Interactive Promotion Checklist */}
              <div className="space-y-3">
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                  <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-700" />
                    Konfigurasi Status Individu Siswa ({filteredStudents.length} siswa dalam daftar filter)
                  </h4>

                  {/* Filters inside Modal */}
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari nama siswa..."
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-600 w-36"
                    />
                    <select
                      value={classFilter}
                      onChange={(e) => setClassFilter(e.target.value)}
                      className="px-2.5 py-1 border border-slate-300 rounded-lg text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-600 text-slate-700 font-semibold"
                    >
                      <option value="ALL">Semua Kelas</option>
                      {uniqueClasses.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>

                    {/* Batch actions */}
                    <div className="border-l border-slate-300 pl-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleSelectAllInView('promote')}
                        className="px-2 py-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Set Semua Naik
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSelectAllInView('stay')}
                        className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-800 border border-slate-300 rounded text-[10px] font-bold cursor-pointer transition"
                      >
                        Set Semua Tinggal
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Table for Promotion Status Selection */}
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                  <table className="w-full text-[11px] text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-700 sticky top-0 font-bold border-b border-slate-200 z-10">
                      <tr>
                        <th className="px-4 py-2.5">Siswa</th>
                        <th className="px-4 py-2.5">Kelas Sekarang</th>
                        <th className="px-4 py-2.5 text-center">Aksi / Status</th>
                        <th className="px-4 py-2.5 text-right">Prediksi Kelas Baru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredStudents.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                            Tidak ada siswa aktif yang memenuhi filter pencarian Anda.
                          </td>
                        </tr>
                      ) : (
                        filteredStudents.map(s => {
                          const state = studentStates[s.id] || 'promote';
                          const autoNext = getNextClass(s.class);
                          
                          let targetClass = autoNext;
                          let stateColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          let stateLabel = 'Naik Kelas';

                          if (state === 'stay') {
                            targetClass = s.class;
                            stateColor = 'bg-rose-50 text-rose-800 border-rose-200';
                            stateLabel = 'Tinggal Kelas';
                          } else if (state === 'leave') {
                            targetClass = 'Mutasi / Keluar';
                            stateColor = 'bg-slate-100 text-slate-600 border-slate-200';
                            stateLabel = 'Mutasi / Keluar';
                          } else if (autoNext === 'Alumni (Lulus)') {
                            stateColor = 'bg-blue-50 text-blue-800 border-blue-200';
                            stateLabel = 'Lulus (Alumni)';
                          }

                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2">
                                <div className="font-bold text-slate-900">{s.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">NISN: {s.nisn}</div>
                              </td>
                              <td className="px-4 py-2 font-semibold text-slate-600">
                                {s.class}
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex justify-center items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleStateChange(s.id, 'promote')}
                                    className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition ${
                                      state === 'promote'
                                        ? 'bg-emerald-600 text-white border-emerald-600'
                                        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Naik
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStateChange(s.id, 'stay')}
                                    className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition ${
                                      state === 'stay'
                                        ? 'bg-rose-600 text-white border-rose-600'
                                        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Tinggal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleStateChange(s.id, 'leave')}
                                    className={`px-2 py-1 rounded border text-[10px] font-bold cursor-pointer transition ${
                                      state === 'leave'
                                        ? 'bg-slate-700 text-white border-slate-700'
                                        : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'
                                    }`}
                                  >
                                    Mutasi
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${stateColor}`}>
                                  <span>{targetClass}</span>
                                </span>
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

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-between border-t border-slate-200 shrink-0">
              <span className="text-[10px] text-slate-500 font-semibold italic">
                Data lama di Google Spreadsheet akan diperbarui secara real-time.
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleExecutePromotion}
                  disabled={isProcessing || activeStudents.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition shadow cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Memproses Kenaikan...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Proses Kenaikan Kelas & Tahun Pelajaran Baru
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
