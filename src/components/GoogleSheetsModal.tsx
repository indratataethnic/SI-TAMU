import React, { useState } from 'react';
import { SchoolSettings, Student, Teacher, ViolationRecord, RewardRecord, CompensationRecord } from '../types';
import { Table, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Sparkles, CheckCircle2, X } from 'lucide-react';
import { getGoogleAppsScriptTemplate, syncAllToGoogleSheets, testGoogleSheetsWebhook } from '../utils/sheetsSync';

interface GoogleSheetsModalProps {
  settings: SchoolSettings;
  students: Student[];
  teachers?: Teacher[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  compensations: CompensationRecord[];
  onSaveSettings: (newSettings: SchoolSettings) => void;
  onClose: () => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  settings,
  students,
  teachers = [],
  violations,
  rewards,
  compensations,
  onSaveSettings,
  onClose
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhook || '');
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetsUrl || '');
  const [copied, setCopied] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  const scriptCode = getGoogleAppsScriptTemplate(settings.schoolName);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(scriptCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      googleSheetsWebhook: webhookUrl.trim(),
      googleSheetsUrl: sheetUrl.trim()
    });
  };

  const handleSyncNow = async () => {
    if (!webhookUrl) {
      setSyncStatus({
        success: false,
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setSyncing(true);
    setSyncStatus(null);

    // Save first
    handleSave();

    const res = await syncAllToGoogleSheets(webhookUrl, {
      students,
      teachers,
      violations,
      rewards,
      compensations
    });

    setSyncing(false);
    setSyncStatus(res);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex justify-center items-start p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden my-4 border border-slate-200">
        {/* Modal Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between border-b border-emerald-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-900 rounded-lg text-emerald-400">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-emerald-100">Integrasi Database Google Spreadsheet</h3>
              <p className="text-xs text-emerald-300">Hubungkan SI TAMU langsung ke Google Drive & Sheets sekolah</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-emerald-900 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-sm text-slate-700">
          {/* Status Box */}
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-emerald-950">Database Real-Time & 100% Gratis</h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Anda dapat menghubungkan Google Spreadsheet milik akun Google sekolah Anda sendiri. Setiap pencatatan siswa, pelanggaran, reward, dan kompensasi akan otomatis terisi rapi dalam sheet terpisah.
              </p>
            </div>
          </div>

          {/* Form Input URL */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                1. URL Webhook Google Apps Script (Wajib untuk Sinkronisasi Otomatis)
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Didapat setelah Anda melakukan "Deploy as Web App" pada file Google Spreadsheet Anda.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                2. Tautan Langsung Google Spreadsheet (Opsional untuk Buka Cepat)
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1aB2c3.../edit"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncing}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs transition shadow cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Menghubungkan...' : 'Sinkronkan Data Sekarang'}
                </button>
                {sheetUrl && (
                  <a
                    href={sheetUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-medium transition"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Buka Spreadsheet
                  </a>
                )}
              </div>
              <button
                type="button"
                onClick={handleSave}
                className="text-xs text-emerald-800 font-bold hover:underline cursor-pointer"
              >
                Simpan Konfigurasi
              </button>
            </div>

            {syncStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                  syncStatus.success ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'
                }`}
              >
                {syncStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-700" /> : <AlertCircle className="w-4 h-4 text-rose-700" />}
                <span>{syncStatus.message}</span>
              </div>
            )}
          </div>

          {/* Panduan 3 Langkah Singkat */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Panduan Pemasangan Skrip (1 Menit):</h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>Buat <strong>Google Spreadsheet baru</strong> di Google Drive Anda.</li>
              <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.</li>
              <li>Hapus kode yang ada, lalu salin dan tempel kode skrip di bawah ini.</li>
              <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> &gt; <strong>Penerapan baru (New deployment)</strong>.</li>
              <li>Pilih jenis <strong>Aplikasi Web</strong>, atur akses <strong>"Siapa saja" (Anyone)</strong>, lalu klik <strong>Terapkan</strong>.</li>
              <li>Salin URL Aplikasi Web yang diberikan Google dan tempel ke kolom di atas.</li>
            </ol>

            {/* Skrip Code Viewer */}
            <div className="relative">
              <div className="flex justify-between items-center bg-slate-900 text-slate-300 px-4 py-2 rounded-t-xl text-xs font-mono">
                <span>GoogleAppsScript_SITAMU.gs</span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1 text-xs bg-emerald-800 hover:bg-emerald-700 text-emerald-100 px-2.5 py-1 rounded transition cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Tersalin!' : 'Salin Kode Skrip'}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-48 leading-normal border border-slate-800">
                {scriptCode}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
