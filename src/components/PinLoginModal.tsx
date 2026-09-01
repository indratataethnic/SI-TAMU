import React, { useState } from 'react';
import { Lock, ShieldCheck, KeyRound, X, AlertCircle } from 'lucide-react';

interface PinLoginModalProps {
  isOpen?: boolean;
  currentPin?: string;
  correctPin?: string;
  onSuccess: () => void;
  onClose: () => void;
}

export const PinLoginModal: React.FC<PinLoginModalProps> = ({
  currentPin,
  correctPin,
  onSuccess,
  onClose
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');

  const expectedCode = correctPin || currentPin || '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim() === expectedCode.trim()) {
      setError('');
      onSuccess();
    } else {
      setError('Kode Akses Petugas & Guru salah. Silakan coba lagi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
        <div className="bg-emerald-950 text-white p-6 text-center relative border-b border-emerald-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-14 h-14 bg-emerald-900 border-2 border-amber-400 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg">
            <Lock className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="font-bold text-xl text-emerald-100">Akses Petugas & Guru</h3>
          <p className="text-xs text-emerald-300 mt-1">
            Masukkan Kode Akses untuk membuka menu pengelolaan tata tertib
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kode Akses Guru / Petugas
            </label>
            <div className="relative">
              <KeyRound className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                maxLength={12}
                autoFocus
                value={accessCode}
                onChange={(e) => {
                  setAccessCode(e.target.value);
                  setError('');
                }}
                placeholder="Ketik Kode Akses..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium mt-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600">
            <p className="font-semibold text-slate-800 mb-0.5">🔒 Menjaga Privasi Siswa</p>
            Mode publik hanya dapat melihat aturan & edukasi umum serta cek mandiri dengan NISN. Akses penuh input data, kontak orang tua, & administrasi surat hanya untuk guru yang berwenang.
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition shadow cursor-pointer"
            >
              Buka Akses Guru
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
