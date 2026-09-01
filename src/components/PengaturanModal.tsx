import React, { useState } from 'react';
import { SchoolSettings } from '../types';
import { Settings, Save, RotateCcw, X, Building, Phone, Mail, UserCheck, Key, MessageSquare, AlertTriangle, Shield, Table, ExternalLink } from 'lucide-react';
import { resetAllToDefault } from '../utils/storage';
import { validateWebhookUrl } from '../utils/sheetsSync';

interface PengaturanModalProps {
  settings: SchoolSettings;
  onSaveSettings?: (settings: SchoolSettings) => void;
  onClose: () => void;
  isOpen?: boolean;
}

export const PengaturanModal: React.FC<PengaturanModalProps> = ({
  settings,
  onSaveSettings,
  onClose
}) => {
  const [form, setForm] = useState<SchoolSettings>({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedForm = {
      ...form,
      googleSheetsWebhook: (form.googleSheetsWebhook || form.googleSheetsWebhookUrl || '').trim(),
      googleSheetsWebhookUrl: (form.googleSheetsWebhook || form.googleSheetsWebhookUrl || '').trim(),
      googleSheetsUrl: (form.googleSheetsUrl || '').trim()
    };
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(updatedForm);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleResetData = () => {
    if (window.confirm('PERINGATAN: Apakah Anda yakin ingin mereset seluruh data kembali ke setelan awal (data bawaan)?')) {
      resetAllToDefault();
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-4 border border-slate-200">
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 rounded-lg text-emerald-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-100">Pengaturan Sistem SI TAMU</h3>
              <p className="text-xs text-emerald-300">Konfigurasi Identitas Sekolah, Pejabat Penandatangan, & Keamanan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-sm">
          {/* IDENTITAS SEKOLAH */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Building className="w-4 h-4 text-emerald-700" />
              Identitas Satuan Pendidikan
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Satuan Pendidikan / Sekolah</label>
                <input
                  type="text"
                  required
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motto / Subtitle Sekolah</label>
                <input
                  type="text"
                  value={form.schoolSubtitle}
                  onChange={(e) => setForm({ ...form, schoolSubtitle: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat Lengkap Sekolah (Untuk Kop Surat)</label>
                <input
                  type="text"
                  value={form.schoolAddress}
                  onChange={(e) => setForm({ ...form, schoolAddress: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nomor Telepon / Kontak Resmi</label>
                <input
                  type="text"
                  value={form.schoolPhone}
                  onChange={(e) => setForm({ ...form, schoolPhone: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Sekolah</label>
                <input
                  type="email"
                  value={form.schoolEmail}
                  onChange={(e) => setForm({ ...form, schoolEmail: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* PEJABAT PENANDATANGAN */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-700" />
              Pejabat Penandatangan Dokumen & Surat Resmi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Kepala Sekolah & Gelar</label>
                <input
                  type="text"
                  value={form.principalName}
                  onChange={(e) => setForm({ ...form, principalName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Kepala Sekolah</label>
                <input
                  type="text"
                  value={form.principalNip}
                  onChange={(e) => setForm({ ...form, principalNip: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Koordinator BK / Kesiswaan</label>
                <input
                  type="text"
                  value={form.bkCoordinatorName}
                  onChange={(e) => setForm({ ...form, bkCoordinatorName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">NIP Koordinator BK</label>
                <input
                  type="text"
                  value={form.bkCoordinatorNip}
                  onChange={(e) => setForm({ ...form, bkCoordinatorNip: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Prefix / Kode Penomoran Surat</label>
                <input
                  type="text"
                  value={form.letterNumberPrefix}
                  onChange={(e) => setForm({ ...form, letterNumberPrefix: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* KEAMANAN KODE AKSES & WA GATEWAY */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Key className="w-4 h-4 text-emerald-700" />
              Keamanan Kode Akses Petugas & Integrasi WA Gateway (Opsional)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kode Akses Guru / Petugas</label>
                <input
                  type="text"
                  maxLength={12}
                  value={form.staffPin}
                  onChange={(e) => setForm({ ...form, staffPin: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Digunakan untuk membuka mode guru/petugas saat akses dari portal publik.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">API Token WA Gateway (Opsional, cth: Fonnte)</label>
                <input
                  type="password"
                  placeholder="Kosongkan jika hanya menggunakan 1-Klik WA"
                  value={form.waGatewayApiKey}
                  onChange={(e) => setForm({ ...form, waGatewayApiKey: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Jika diisi, sistem dapat mengirim notifikasi otomatis di latar belakang.</p>
              </div>
            </div>
          </div>

          {/* INTEGRASI GOOGLE SPREADSHEET */}
          <div className="space-y-4">
            <h4 className="font-bold text-emerald-950 flex items-center gap-2 border-b border-slate-200 pb-2">
              <Table className="w-4 h-4 text-emerald-700" />
              Integrasi Database Google Spreadsheet (Sinkronisasi Otomatis)
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Webhook Google Apps Script (Wajib berakhiran <code className="text-emerald-800 font-bold bg-emerald-100 px-1 rounded">/exec</code>)
                </label>
                <input
                  type="url"
                  placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                  value={form.googleSheetsWebhook || form.googleSheetsWebhookUrl || ''}
                  onChange={(e) => setForm({
                    ...form,
                    googleSheetsWebhook: e.target.value,
                    googleSheetsWebhookUrl: e.target.value
                  })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Didapat dari menu Ekstensi &gt; Apps Script &gt; Terapkan sebagai Aplikasi Web (Akses: <strong>Siapa saja / Anyone</strong>).
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tautan File Google Spreadsheet (Opsional)
                </label>
                <input
                  type="url"
                  placeholder="https://docs.google.com/spreadsheets/d/1aB2c3.../edit"
                  value={form.googleSheetsUrl || ''}
                  onChange={(e) => setForm({ ...form, googleSheetsUrl: e.target.value })}
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* DANGER ZONE */}
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-2">
            <div className="flex items-center gap-2 text-rose-900 font-bold text-xs">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Zona Pemulihan Data Bawaan</span>
            </div>
            <p className="text-xs text-rose-700">
              Jika Anda ingin menghapus seluruh riwayat dan mengembalikan aplikasi ke data awal demonstrasi, klik tombol di bawah.
            </p>
            <button
              type="button"
              onClick={handleResetData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Data Default
            </button>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            {savedSuccess ? (
              <span className="text-xs font-bold text-emerald-700">✓ Pengaturan berhasil disimpan!</span>
            ) : (
              <span className="text-xs text-slate-500">Perubahan akan langsung aktif di seluruh menu.</span>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow cursor-pointer"
              >
                <Save className="w-4 h-4" />
                Simpan Pengaturan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
