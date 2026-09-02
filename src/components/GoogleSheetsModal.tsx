import React, { useState } from 'react';
import { SchoolSettings, Student, Teacher, PiketSchedule, ViolationRecord, RewardRecord, CompensationRecord } from '../types';
import { Table, Copy, Check, ExternalLink, RefreshCw, AlertCircle, Sparkles, CheckCircle2, X, HelpCircle, ShieldAlert, ArrowRight, Download } from 'lucide-react';
import { getGoogleAppsScriptTemplate, syncAllToGoogleSheets, testGoogleSheetsWebhook, validateWebhookUrl, fetchFullStateFromSheets } from '../utils/sheetsSync';

interface GoogleSheetsModalProps {
  settings: SchoolSettings;
  students: Student[];
  teachers?: Teacher[];
  piketSchedules?: PiketSchedule[];
  violations: ViolationRecord[];
  rewards: RewardRecord[];
  compensations: CompensationRecord[];
  onSaveSettings?: (newSettings: SchoolSettings) => void;
  onSaveWebhookUrl?: (url: string) => void;
  onClose: () => void;
  isOpen?: boolean;
  summaries?: any[];
  onImportFullData?: (imported: {
    settings?: SchoolSettings;
    students?: Student[];
    teachers?: Teacher[];
    violations?: ViolationRecord[];
    rewards?: RewardRecord[];
    compensations?: CompensationRecord[];
  }) => void;
}

export const GoogleSheetsModal: React.FC<GoogleSheetsModalProps> = ({
  settings,
  students,
  teachers = [],
  piketSchedules = [],
  violations,
  rewards,
  compensations,
  summaries,
  onSaveSettings,
  onClose,
  onImportFullData
}) => {
  const [webhookUrl, setWebhookUrl] = useState(settings.googleSheetsWebhook || settings.googleSheetsWebhookUrl || '');
  const [sheetUrl, setSheetUrl] = useState(settings.googleSheetsUrl || '');
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  const scriptCode = getGoogleAppsScriptTemplate(settings.schoolName);

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(scriptCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
        return;
      }
    } catch (err) {
      console.warn('Navigator clipboard error, falling back to textarea:', err);
    }

    try {
      const textArea = document.createElement('textarea');
      textArea.value = scriptCode;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      textArea.style.top = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (successful) {
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (fallbackErr) {
      console.error('Copy fallback failed:', fallbackErr);
    }
  };

  const handleSave = () => {
    const cleanWebhook = webhookUrl.trim();
    const cleanSheet = sheetUrl.trim();
    const updatedSettings: SchoolSettings = {
      ...settings,
      googleSheetsWebhook: cleanWebhook,
      googleSheetsWebhookUrl: cleanWebhook,
      googleSheetsUrl: cleanSheet
    };
    if (typeof onSaveSettings === 'function') {
      onSaveSettings(updatedSettings);
    }
  };

  const handleTestConnection = async () => {
    const clean = webhookUrl.trim();
    if (!clean) {
      setSyncStatus({
        success: false,
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setTesting(true);
    setSyncStatus(null);
    handleSave();

    const res = await testGoogleSheetsWebhook(clean);
    setTesting(false);
    setSyncStatus(res);
  };

  const handleSyncNow = async () => {
    const clean = webhookUrl.trim();
    if (!clean) {
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

    const res = await syncAllToGoogleSheets(clean, {
      students,
      teachers,
      piketSchedules,
      violations,
      rewards,
      compensations,
      summaries,
      sheetUrl: sheetUrl.trim()
    });

    setSyncing(false);
    setSyncStatus(res);
  };

  const handleImportData = async () => {
    const clean = webhookUrl.trim();
    if (!clean) {
      setSyncStatus({
        success: false,
        message: 'Masukkan URL Webhook Google Apps Script terlebih dahulu.'
      });
      return;
    }

    setImporting(true);
    setSyncStatus(null);

    // Save webhook address first
    handleSave();

    const res = await fetchFullStateFromSheets(clean);
    setImporting(false);

    if (res.success && res.data) {
      const studentCount = res.data.students?.length || 0;
      const teacherCount = res.data.teachers?.length || 0;
      setSyncStatus({
        success: true,
        message: `Sinkronisasi berhasil! Data terbaru dari Google Spreadsheet telah diterapkan (${studentCount} Siswa, ${teacherCount} Guru / GTK).`
      });

      if (typeof onImportFullData === 'function') {
        const fetchedSettings = res.data.settings || {};
        const mergedSettings: SchoolSettings = {
          ...settings,
          schoolName: fetchedSettings.schoolName || settings.schoolName,
          schoolAddress: fetchedSettings.schoolAddress || settings.schoolAddress,
          headmasterName: fetchedSettings.headmasterName || settings.headmasterName,
          headmasterNip: fetchedSettings.headmasterNip || settings.headmasterNip,
          letterNumberPrefix: fetchedSettings.letterNumberPrefix || settings.letterNumberPrefix,
          waGatewayApiKey: fetchedSettings.waGatewayApiKey || settings.waGatewayApiKey,
          waGatewayDevice: fetchedSettings.waGatewayDevice || settings.waGatewayDevice,
          academicYear: fetchedSettings.academicYear || settings.academicYear || '2026/2027',
          googleSheetsWebhook: clean,
          googleSheetsWebhookUrl: clean,
          googleSheetsUrl: sheetUrl.trim() || settings.googleSheetsUrl
        };

        onImportFullData({
          settings: mergedSettings,
          students: res.data.students,
          teachers: res.data.teachers,
          piketSchedules: res.data.piketSchedules,
          violations: res.data.violations,
          rewards: res.data.rewards,
          compensations: res.data.compensations
        });
      }
    } else {
      setSyncStatus({
        success: false,
        message: res.message
      });
    }
  };

  const urlValidation = validateWebhookUrl(webhookUrl);

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
              <p className="text-xs text-emerald-300">Sinkronisasi otomatis data siswa, guru, jadwal piket, pelanggaran, dan reward ke Google Drive</p>
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
          {/* Status Alert Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-emerald-950">Sinkronisasi Real-Time & Terpusat</h4>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Aplikasi SI TAMU akan mengirimkan setiap penambahan data siswa, pelanggaran, prestasi, dan pengaturan identitas sekolah secara langsung ke Google Spreadsheet Anda.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 flex items-start gap-3">
              <Download className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-indigo-950">Akses dari Laptop/HP Lain</h4>
                <p className="text-xs text-indigo-800 mt-0.5 leading-relaxed">
                  Cukup tempelkan URL Webhook yang sama di perangkat baru, lalu klik <strong>"Muat Pengaturan & Data"</strong> untuk mengunduh seluruh database dan pengaturan sekolah secara instan.
                </p>
              </div>
            </div>
          </div>

          {/* Form Input URL */}
          <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                1. URL Webhook Google Apps Script <span className="text-rose-600">* (Wajib)</span>
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className={`w-full px-3.5 py-2.5 bg-white border rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none ${
                  webhookUrl && !urlValidation.valid ? 'border-amber-400 bg-amber-50/40' : 'border-slate-300'
                }`}
              />
              {webhookUrl && !urlValidation.valid ? (
                <p className="text-[11px] text-amber-700 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  {urlValidation.message}
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 mt-1">
                  Didapat dari hasil <strong>Penerapan Baru (Deploy as Web App)</strong> di Google Apps Script (berakhiran <code className="text-emerald-800 font-bold bg-emerald-100 px-1 rounded">/exec</code>).
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1">
                2. Tautan Buka Cepat Google Spreadsheet <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <input
                type="url"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/1aB2c3.../edit"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Tautan file spreadsheet untuk tombol pintasan langsung membuka tabel di tab baru.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing || syncing || !webhookUrl}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition border border-slate-300 cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                  {testing ? 'Menguji...' : 'Tes Koneksi'}
                </button>

                <button
                  type="button"
                  onClick={handleSyncNow}
                  disabled={syncing || testing || !webhookUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Menyinkronkan...' : `Sinkronkan Seluruh Data (${students.length} Siswa, ${teachers.length} Guru)`}
                </button>

                <button
                  type="button"
                  onClick={handleImportData}
                  disabled={importing || testing || syncing || !webhookUrl}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-800 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition shadow cursor-pointer disabled:opacity-40"
                >
                  <Download className={`w-3.5 h-3.5 ${importing ? 'animate-spin' : ''}`} />
                  {importing ? 'Mengunduh...' : 'Muat Pengaturan & Data'}
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
                className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                  syncStatus.success ? 'bg-emerald-100 text-emerald-950 border border-emerald-300' : 'bg-rose-100 text-rose-950 border border-rose-300'
                }`}
              >
                {syncStatus.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold">{syncStatus.message}</p>
                  {!syncStatus.success && (
                    <p className="text-[11px] text-rose-800 mt-1">
                      Tips: Pastikan URL berakhiran <strong>/exec</strong> dan pada Apps Script diatur <strong>"Siapa saja / Anyone"</strong>.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* SPREADSHEET STRUCTURE GUIDE */}
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 overflow-hidden">
            <div className="px-4 py-3 bg-emerald-900 text-emerald-100 font-bold text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Table className="w-4 h-4 text-amber-300" />
                <span>Format Kolom Tab "Data_Siswa" di Google Spreadsheet</span>
              </div>
              <span className="text-[10px] bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded font-mono">11 Kolom Terpadu</span>
            </div>
            <div className="p-4 bg-white space-y-2 text-xs text-slate-700">
              <p className="text-[11px] text-slate-600">
                Skrip secara otomatis menyusun dan membaca kolom <strong>Data_Siswa</strong> dengan urutan standar berikut:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 font-mono text-[11px]">
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">1. NIK</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">2. NISN</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">3. Nama Siswa</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">4. Kelas</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">5. Jenis Kelamin (L/P)</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">6. Nama Orang Tua / Wali</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">7. No HP / WA Wali</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">8. Alamat Rumah</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">9. Kode Akses Siswa</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">10. Catatan Khusus</div>
                <div className="p-1.5 bg-slate-50 border border-slate-200 rounded font-semibold text-slate-800">11. ID Sistem</div>
              </div>
              <p className="text-[10px] text-emerald-800 font-medium pt-1">
                ✓ SI TAMU dilengkapi pencocokan nama header cerdas, sehingga data akan tetap terbaca tepat meskipun Anda memindahkan urutan kolom di Spreadsheet.
              </p>
            </div>
          </div>

          {/* TROUBLESHOOTING BOX */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
            <button
              type="button"
              onClick={() => setShowTroubleshoot(!showTroubleshoot)}
              className="w-full px-4 py-3 text-left font-bold text-xs text-amber-950 flex items-center justify-between hover:bg-amber-100/60 transition cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-700" />
                <span>Kenapa Data Belum Masuk ke Spreadsheet? (Cek 4 Poin Ini)</span>
              </div>
              <span className="text-[11px] text-amber-800 font-semibold">
                {showTroubleshoot ? 'Sembunyikan ▲' : 'Buka Petunjuk ▼'}
              </span>
            </button>

            {showTroubleshoot && (
              <div className="p-4 pt-1 space-y-3 text-xs text-amber-900 border-t border-amber-200/60 bg-white/70">
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 text-amber-950 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <p><strong>Pastikan URL berakhiran <code>/exec</code></strong>: URL yang disalin harus dari jendela "Penerapan Baru (New Deployment)", bukan link editor (<code>/edit</code>) dan bukan link spreadsheet (<code>docs.google.com/spreadsheets</code>).</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 text-amber-950 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <p><strong>Wajib Akses "Siapa saja (Anyone)"</strong>: Saat melakukan Deploy di Apps Script, pada pilihan <em>"Siapa yang memiliki akses" (Who has access)</em>, pastikan memilih <strong>"Siapa saja" (Anyone)</strong> agar sistem SI TAMU diizinkan mengirim data.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 text-amber-950 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <p><strong>Jalankan sebagai: "Saya" (Me)</strong>: Pada setelan Deploy, <em>"Jalankan sebagai" (Execute as)</em> harus disetel ke <strong>"Saya" (email Google Anda)</strong>.</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold bg-amber-200 text-amber-950 w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">4</span>
                  <p><strong>Wajib "Penerapan Baru" Setelah Ganti Kode</strong>: Setiap kali Anda memperbarui kode di Apps Script, Anda harus mengklik <strong>Deploy &gt; Penerapan Baru (New Deployment)</strong> agar skrip yang aktif menggunakan versi terbaru.</p>
                </div>
              </div>
            )}
          </div>

          {/* Panduan 4 Langkah Singkat */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">Panduan Pemasangan Skrip (Hanya 1 Menit):</h4>
            <ol className="list-decimal list-inside space-y-2 text-xs text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200">
              <li>Buka file <strong>Google Spreadsheet baru</strong> di Google Drive Anda.</li>
              <li>Klik menu <strong>Ekstensi (Extensions)</strong> &gt; pilih <strong>Apps Script</strong>.</li>
              <li>Hapus seluruh kode yang ada di editor Apps Script, lalu <strong>Salin dan Tempel (Paste)</strong> kode di bawah ini.</li>
              <li>Klik tombol <strong>Simpan (ikon Disket)</strong>.</li>
              <li>Klik tombol biru <strong>Terapkan (Deploy)</strong> di kanan atas &gt; <strong>Penerapan baru (New deployment)</strong>.</li>
              <li>Pilih jenis <strong>Aplikasi Web</strong>, atur akses <strong>"Siapa saja" (Anyone)</strong>, lalu klik <strong>Terapkan</strong> dan berikan izin.</li>
              <li>Salin URL Aplikasi Web yang diberikan (berakhiran <code>/exec</code>) dan tempel ke kolom di atas.</li>
            </ol>

            {/* Skrip Code Viewer */}
            <div className="relative">
              <div className="flex justify-between items-center bg-slate-900 text-slate-300 px-4 py-2.5 rounded-t-xl text-xs font-mono">
                <span className="font-semibold text-emerald-400">GoogleAppsScript_SITAMU.gs</span>
                <button
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 text-xs bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition cursor-pointer shadow"
                >
                  {copied ? <Check className="w-4 h-4 text-amber-300" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kode Tersalin!' : 'Salin Seluruh Kode Skrip'}
                </button>
              </div>
              <pre className="bg-slate-950 text-slate-200 p-4 rounded-b-xl text-[11px] font-mono overflow-x-auto max-h-56 leading-relaxed border border-slate-800 select-all">
                {scriptCode}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {students.length} Siswa • {teachers.length} Guru • {violations.length} Catatan pelanggaran
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition cursor-pointer"
            >
              Selesai / Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

