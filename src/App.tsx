import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Student,
  Teacher,
  PiketSchedule,
  DayOfWeek,
  ViolationRule,
  RewardRule,
  ViolationRecord,
  RewardRecord,
  CompensationRecord,
  SchoolSettings,
  UserRole,
  StudentScoreSummary
} from './types';
import {
  loadStudents,
  saveStudents,
  loadTeachers,
  saveTeachers,
  loadPiketSchedules,
  savePiketSchedules,
  loadViolationRules,
  saveViolationRules,
  loadRewardRules,
  saveRewardRules,
  loadViolations,
  saveViolations,
  loadRewards,
  saveRewards,
  loadCompensations,
  saveCompensations,
  loadSettings,
  saveSettings,
  loadUserRole,
  saveUserRole,
  calculateSummaries,
  sanitizeStudents,
  sanitizeTeachers,
  sanitizePiketSchedules,
  sanitizeRecords,
  normalizeRecordDate,
  isCorruptedNisn,
  isCorruptedAccessCode
} from './utils/storage';
import { syncFullStateToSheets, fetchFullStateFromSheets } from './utils/sheetsSync';
import { OFFICIAL_WEBHOOK_URL, initialTeachers, initialPiketSchedules } from './data/initialData';

// Components & Views
import { Navbar } from './components/Navbar';
import { Sidebar, NavTab } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { DataSiswaView } from './components/DataSiswaView';
import { DataGuruView } from './components/DataGuruView';
import { DataPelanggaranView } from './components/DataPelanggaranView';
import { DataRewardView } from './components/DataRewardView';
import { PenghitunganView } from './components/PenghitunganView';
import { KelolaPoinView } from './components/KelolaPoinView';
import { InputPelanggaranView } from './components/InputPelanggaranView';
import { InputRewardView } from './components/InputRewardView';
import { EdukasiView } from './components/EdukasiView';
import { PublicPortalView } from './components/PublicPortalView';

// Modals
import { SuratModal } from './components/SuratModal';
import { SertifikatModal } from './components/SertifikatModal';
import { JurnalPiketModal } from './components/JurnalPiketModal';
import { GoogleSheetsModal } from './components/GoogleSheetsModal';
import { PinLoginModal } from './components/PinLoginModal';
import { PengaturanModal } from './components/PengaturanModal';

export default function App() {
  // State Initialization
  const [students, setStudents] = useState<Student[]>(() => loadStudents());
  const [teachers, setTeachers] = useState<Teacher[]>(() => loadTeachers());
  const [piketSchedules, setPiketSchedules] = useState<PiketSchedule[]>(() => loadPiketSchedules());
  const [violationRules, setViolationRules] = useState<ViolationRule[]>(() => loadViolationRules());
  const [rewardRules, setRewardRules] = useState<RewardRule[]>(() => loadRewardRules());
  const [violations, setViolations] = useState<ViolationRecord[]>(() => loadViolations());
  const [rewards, setRewards] = useState<RewardRecord[]>(() => loadRewards());
  const [compensations, setCompensations] = useState<CompensationRecord[]>(() => loadCompensations());
  const [settings, setSettings] = useState<SchoolSettings>(() => loadSettings());
  const [role, setRole] = useState<UserRole>(() => loadUserRole());

  // Navigation State
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Quick inputs preselection
  const [preselectedStudent, setPreselectedStudent] = useState<Student | null>(null);

  // Modals
  const [suratModalData, setSuratModalData] = useState<{
    open: boolean;
    summary: StudentScoreSummary | null;
    type: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500';
  }>({
    open: false,
    summary: null,
    type: 'panggilan_100'
  });

  const [sertifikatModalData, setSertifikatModalData] = useState<{
    open: boolean;
    reward: RewardRecord | null;
  }>({
    open: false,
    reward: null
  });

  // Jurnal Piket Modal State
  const [jurnalPiketModalOpen, setJurnalPiketModalOpen] = useState(false);
  const [jurnalPiketData, setJurnalPiketData] = useState<{
    dayName: DayOfWeek;
    dutyTeachers: Teacher[];
  } | null>(null);

  const [sheetsModalOpen, setSheetsModalOpen] = useState(false);
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<string | null>(null);
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [pendingActionAfterPin, setPendingActionAfterPin] = useState<(() => void) | null>(null);

  // Calculated Summaries
  const summaries = useMemo(() => {
    return calculateSummaries(students, violations, rewards, compensations, settings.academicYear || '2026/2027');
  }, [students, violations, rewards, compensations, settings.academicYear]);

  // Urgent alerts for >=100 points
  const urgentAlertCount = useMemo(() => {
    return summaries.filter(s => s.activeViolationPoints >= 100).length;
  }, [summaries]);

  const isInitialLoadingRef = useRef(true);
  const isImportingRef = useRef(false);
  const serverSaveTimeoutRef = useRef<any>(null);
  const lastLocalActionRef = useRef<number>(0);
  const lastKnownVersionRef = useRef<number>(0);
  const lastLocalSaveTimestampRef = useRef<number>(0);
  const lastSpreadsheetFetchRef = useRef<number>(0);
  const lastViolationsCountRef = useRef<number>(0);
  const lastRewardsCountRef = useRef<number>(0);

  // Auto-save listeners
  useEffect(() => { saveStudents(students); }, [students]);
  useEffect(() => { saveTeachers(teachers); }, [teachers]);
  useEffect(() => { savePiketSchedules(piketSchedules); }, [piketSchedules]);
  useEffect(() => { saveViolationRules(violationRules); }, [violationRules]);
  useEffect(() => { saveRewardRules(rewardRules); }, [rewardRules]);
  useEffect(() => { saveViolations(violations); }, [violations]);
  useEffect(() => { saveRewards(rewards); }, [rewards]);
  useEffect(() => { saveCompensations(compensations); }, [compensations]);
  useEffect(() => { saveSettings(settings); }, [settings]);
  useEffect(() => { saveUserRole(role); }, [role]);

  const [isLoadingSpreadsheet, setIsLoadingSpreadsheet] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Automatically load data from Google Spreadsheet when the page mounts or on user request
  const fetchSpreadsheetData = async (silent = false): Promise<boolean> => {
    // Avoid overwriting if this device just saved locally within 1.2s
    if (silent && Date.now() - lastLocalSaveTimestampRef.current < 1200) {
      return false;
    }

    try {
      lastSpreadsheetFetchRef.current = Date.now();
      setIsLoadingSpreadsheet(true);
      if (!silent) {
        setSheetsSyncStatus('🔄 Sedang menyinkronkan data dengan Google Spreadsheet...');
      }

      const res = await fetch('/api/sheets/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: settings.googleSheetsWebhook || settings.googleSheetsWebhookUrl || OFFICIAL_WEBHOOK_URL
        })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          handleImportFullData(json.data);
          const studentCount = json.data.students?.length || 0;
          const teacherCount = json.data.teachers?.length || 0;
          const piketCount = json.data.piketSchedules?.length || 0;
          const violationCount = json.data.violations?.length || 0;
          const rewardCount = json.data.rewards?.length || 0;

          // Check if new data arrived compared to previous count
          const isNewViolations = lastViolationsCountRef.current > 0 && violationCount > lastViolationsCountRef.current;
          const isNewRewards = lastRewardsCountRef.current > 0 && rewardCount > lastRewardsCountRef.current;
          lastViolationsCountRef.current = violationCount;
          lastRewardsCountRef.current = rewardCount;

          const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setLastSyncTime(timeStr);

          if (!silent) {
            setSheetsSyncStatus(
              `✓ Sinkronisasi selesai (${timeStr}): ${studentCount} Siswa, ${violationCount} Pelanggaran${teacherCount > 0 ? `, ${teacherCount} Guru` : ''}`
            );
            setTimeout(() => setSheetsSyncStatus(null), 4500);
          } else if (isNewViolations || isNewRewards) {
            setSheetsSyncStatus(
              `✓ Data baru otomatis termuat (${timeStr}): ${violationCount} Pelanggaran${rewardCount > 0 ? `, ${rewardCount} Apresiasi` : ''}`
            );
            setTimeout(() => setSheetsSyncStatus(null), 5000);
          }
          return true;
        }
      }
    } catch (err) {
      console.log('Automated Google Sheets load error:', err);
      if (!silent) {
        setSheetsSyncStatus('⚠️ Gagal terhubung ke Google Sheets, menggunakan data database lokal.');
        setTimeout(() => setSheetsSyncStatus(null), 4000);
      }
    } finally {
      setIsLoadingSpreadsheet(false);
    }
    return false;
  };

  // Fast background fetch from centralized server cache
  const fetchServerData = async (silent = true): Promise<boolean> => {
    try {
      const res = await fetch('/api/data');
      if (!res.ok) return false;
      const json = await res.json();
      if (json?.version) {
        lastKnownVersionRef.current = json.version;
      }
      if (json?.data && typeof json.data === 'object') {
        handleImportFullData(json.data);
        if (Array.isArray(json.data.violations)) {
          lastViolationsCountRef.current = json.data.violations.length;
        }
        if (Array.isArray(json.data.rewards)) {
          lastRewardsCountRef.current = json.data.rewards.length;
        }
        return true;
      }
    } catch (err) {
      console.log('Error fetching server data:', err);
    }
    return false;
  };

  // Real-time automatic synchronization across all devices (SSE + Background Polling + Focus Resync)
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;
    let isSubscribed = true;

    const connectSSE = () => {
      if (!isSubscribed) return;
      try {
        eventSource = new EventSource('/api/stream');

        eventSource.onmessage = (event) => {
          if (!isSubscribed) return;
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'DATA_UPDATED') {
              // If this device just saved within 1.2s, ignore self-broadcast
              if (Date.now() - lastLocalSaveTimestampRef.current < 1200) {
                if (payload.version) lastKnownVersionRef.current = payload.version;
                return;
              }
              // An update occurred on another device or Google Sheets! Fetch latest silently
              fetchServerData(true);
            } else if (payload.type === 'CONNECTED') {
              if (payload.version && lastKnownVersionRef.current > 0 && payload.version > lastKnownVersionRef.current) {
                fetchServerData(true);
              }
              if (payload.version) lastKnownVersionRef.current = payload.version;
            }
          } catch {
            // ignore non-json
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
            eventSource = null;
          }
          if (isSubscribed) {
            reconnectTimeout = setTimeout(connectSSE, 3000);
          }
        };
      } catch {
        // Fallback to polling
      }
    };

    connectSSE();

    // Fallback Polling: Fast version check every 6 seconds
    const pollInterval = setInterval(() => {
      if (!isSubscribed) return;
      fetch('/api/data/version')
        .then(res => res.json())
        .then(json => {
          if (json?.success && json.version && json.version > lastKnownVersionRef.current) {
            if (Date.now() - lastLocalSaveTimestampRef.current > 1200) {
              fetchServerData(true);
            }
          }
        })
        .catch(() => {});
    }, 6000);

    // Immediate sync when screen is turned on (wake-up) or tab becomes active
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        // 1. Check local server version
        fetch('/api/data/version')
          .then(res => res.json())
          .then(json => {
            if (json?.success && json.version && json.version > lastKnownVersionRef.current) {
              fetchServerData(true);
            }
          })
          .catch(() => {});

        // 2. Also check Google Spreadsheet if at least 4s since last fetch
        if (Date.now() - lastSpreadsheetFetchRef.current > 4000) {
          fetchSpreadsheetData(true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    // Background Google Sheets auto-check every 12 seconds (keeps HP & PC synchronized)
    const sheetsInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSpreadsheetData(true);
      }
    }, 12000);

    return () => {
      isSubscribed = false;
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      clearInterval(pollInterval);
      clearInterval(sheetsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, []);

  // Load initial global config & server data instantly on mount
  useEffect(() => {
    // 1. Instant check from local server database cache
    fetch('/api/data')
      .then(res => res.json())
      .then(json => {
        if (json?.version) lastKnownVersionRef.current = json.version;
        if (json?.data && (
          (Array.isArray(json.data.students) && json.data.students.length > 0) ||
          (Array.isArray(json.data.teachers) && json.data.teachers.length > 0) ||
          (Array.isArray(json.data.piketSchedules) && json.data.piketSchedules.length > 0) ||
          (Array.isArray(json.data.violations) && json.data.violations.length > 0) ||
          (Array.isArray(json.data.rewards) && json.data.rewards.length > 0)
        )) {
          handleImportFullData(json.data);
        } else {
          // If server database is empty on fresh cold-start, seed it from local client state
          const currentStudents = loadStudents();
          const currentTeachers = loadTeachers();
          const currentPiket = loadPiketSchedules();
          const currentViolations = loadViolations();
          const currentRewards = loadRewards();
          const currentCompensations = loadCompensations();
          const currentSettings = loadSettings();

          if (currentStudents.length > 0 || currentViolations.length > 0 || currentTeachers.length > 0) {
            fetch('/api/data', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                students: currentStudents,
                teachers: currentTeachers,
                piketSchedules: currentPiket,
                violations: currentViolations,
                rewards: currentRewards,
                compensations: currentCompensations,
                settings: currentSettings
              })
            }).catch(() => {});
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        isInitialLoadingRef.current = false;
        // 2. Automatically load data from Google Spreadsheet when the page mounts!
        fetchSpreadsheetData(false);
      });

    // 3. Global settings sync
    fetch('/api/global-config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings(prev => {
            let webhook = (data.googleSheetsWebhook || prev.googleSheetsWebhook || '').trim();
            if (!webhook || (webhook.includes('script.google.com/macros/s/') && webhook !== OFFICIAL_WEBHOOK_URL)) {
              webhook = OFFICIAL_WEBHOOK_URL;
            }
            const sheetUrl = data.googleSheetsUrl || prev.googleSheetsUrl || '';
            const serverSettings = data.settings || {};
            
            const updated = {
              ...prev,
              ...serverSettings,
              googleSheetsWebhook: webhook,
              googleSheetsWebhookUrl: webhook,
              googleSheetsUrl: sheetUrl
            };
            saveSettings(updated);
            return updated;
          });
        }
      })
      .catch(err => console.log('Error loading global configuration:', err));
  }, []);

  // Background Google Sheets & Multi-Device Real-Time Sync Helper
  const triggerSheetsSync = (override?: {
    students?: Student[];
    teachers?: Teacher[];
    piketSchedules?: PiketSchedule[];
    violations?: ViolationRecord[];
    rewards?: RewardRecord[];
    compensations?: CompensationRecord[];
    settings?: SchoolSettings;
  }) => {
    lastLocalSaveTimestampRef.current = Date.now();
    lastLocalActionRef.current = Date.now();

    const studentsToSync = override?.students ?? students;
    const teachersToSync = override?.teachers ?? teachers;
    const piketSchedulesToSync = override?.piketSchedules ?? piketSchedules;
    const violationsToSync = override?.violations ?? violations;
    const rewardsToSync = override?.rewards ?? rewards;
    const compensationsToSync = override?.compensations ?? compensations;
    const settingsToSync = override?.settings ?? settings;

    // 1. Instant POST to central server (/api/data) to trigger Real-Time SSE broadcast to all other open devices!
    const serverPayload = {
      students: studentsToSync,
      teachers: teachersToSync,
      piketSchedules: piketSchedulesToSync,
      violations: violationsToSync,
      rewards: rewardsToSync,
      compensations: compensationsToSync,
      settings: settingsToSync
    };

    fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serverPayload)
    })
      .then(res => res.json())
      .then(json => {
        if (json?.version) lastKnownVersionRef.current = json.version;
      })
      .catch(err => console.log('Background server sync error:', err));

    // 2. Push to Google Spreadsheet via Webhook (Background backup)
    const webhook = (settingsToSync.googleSheetsWebhook || settingsToSync.googleSheetsWebhookUrl || '').trim();
    if (!webhook) return;

    syncFullStateToSheets(
      webhook,
      studentsToSync,
      violationsToSync,
      rewardsToSync,
      compensationsToSync,
      summaries,
      settingsToSync.googleSheetsUrl,
      teachersToSync,
      piketSchedulesToSync,
      settingsToSync
    ).catch(err => console.log('Background sheets sync error:', err));
  };

  const handleImportFullData = (imported: {
    settings?: SchoolSettings;
    students?: Student[];
    teachers?: Teacher[];
    violations?: ViolationRecord[];
    rewards?: RewardRecord[];
    compensations?: CompensationRecord[];
    piketSchedules?: any[];
  }) => {
    isImportingRef.current = true;
    if (imported.settings) {
      setSettings(prev => {
        const fetched = (imported.settings || {}) as any;
        const updated = {
          ...prev,
          schoolName: fetched.schoolName ? String(fetched.schoolName) : prev.schoolName,
          schoolSubtitle: fetched.schoolSubtitle ? String(fetched.schoolSubtitle) : prev.schoolSubtitle,
          schoolAddress: fetched.schoolAddress ? String(fetched.schoolAddress) : prev.schoolAddress,
          schoolPhone: fetched.schoolPhone ? String(fetched.schoolPhone) : prev.schoolPhone,
          schoolEmail: fetched.schoolEmail ? String(fetched.schoolEmail) : prev.schoolEmail,
          schoolWebsite: fetched.schoolWebsite ? String(fetched.schoolWebsite) : prev.schoolWebsite,
          principalName: fetched.principalName || fetched.headmasterName ? String(fetched.principalName || fetched.headmasterName) : prev.principalName,
          principalNip: fetched.principalNip || fetched.headmasterNip ? String(fetched.principalNip || fetched.headmasterNip) : prev.principalNip,
          bkCoordinatorName: fetched.bkCoordinatorName ? String(fetched.bkCoordinatorName) : prev.bkCoordinatorName,
          bkCoordinatorNip: fetched.bkCoordinatorNip ? String(fetched.bkCoordinatorNip) : prev.bkCoordinatorNip,
          staffPin: fetched.staffPin ? String(fetched.staffPin) : prev.staffPin,
          letterNumberPrefix: fetched.letterNumberPrefix ? String(fetched.letterNumberPrefix) : prev.letterNumberPrefix,
          academicYear: fetched.academicYear ? String(fetched.academicYear) : prev.academicYear,
          waGatewayApiKey: fetched.waGatewayApiKey ? String(fetched.waGatewayApiKey) : prev.waGatewayApiKey,
          waGatewayDevice: fetched.waGatewayDevice ? String(fetched.waGatewayDevice) : prev.waGatewayDevice
        };
        saveSettings(updated);
        return updated;
      });
    }

    let finalStudents: Student[] = students.length > 0 ? students : loadStudents();

    if (Array.isArray(imported.students) && imported.students.length > 0) {
      const existingStudents = loadStudents();
      const prevMapByNisn = new Map<string, Student>();
      const prevMapById = new Map<string, Student>();
      const prevMapByName = new Map<string, Student>();

      // Index both current state and localStorage
      [...students, ...existingStudents].forEach(s => {
        if (s.nisn && !isCorruptedNisn(s.nisn)) prevMapByNisn.set(String(s.nisn).trim().toLowerCase(), s);
        if (s.id && !s.id.startsWith('STU-L-') && !s.id.startsWith('STU-P-') && s.id !== 'STD-L' && s.id !== 'STD-P') prevMapById.set(String(s.id).trim(), s);
        if (s.name) prevMapByName.set(String(s.name).trim().toLowerCase(), s);
      });

      const mergedStudents = imported.students.map(s => {
        const sNisn = String(s.nisn || '').trim().toLowerCase();
        const sId = String(s.id || '').trim();
        const sName = String(s.name || '').trim().toLowerCase();

        const match = (!isCorruptedNisn(sNisn) ? prevMapByNisn.get(sNisn) : null) ||
                      (sName ? prevMapByName.get(sName) : null) ||
                      (sId ? prevMapById.get(sId) : null);

        if (!match) return s;

        const incomingParentName = String(s.parentName || '').trim();
        const incomingParentPhone = String(s.parentPhone || '').replace(/^'/, '').trim();
        const incomingAddress = String(s.parentAddress || (s as any).address || '').trim();
        const incomingNik = String(s.nik || '').replace(/^'/, '').trim();
        const incomingNisn = String(s.nisn || '').trim();
        const incomingAccess = String(s.accessCode || '').trim();

        // Reject invalid / single-digit corrupted incoming values
        const isInvalidIncomingParentName = !incomingParentName || 
          /^\d+$/.test(incomingParentName) || 
          incomingParentName === '-' || 
          incomingParentName === 'undefined' || 
          incomingParentName.length <= 1 ||
          incomingParentName.startsWith('08') ||
          incomingParentName.startsWith('+62');

        const isInvalidIncomingParentPhone = !incomingParentPhone || 
          incomingParentPhone.replace(/[^0-9]/g, '').length < 8;

        return {
          ...match,
          ...s,
          id: (s.id && !s.id.startsWith('STU-L-') && !s.id.startsWith('STU-P-') && s.id !== 'STD-L' && s.id !== 'STD-P') ? s.id : match.id,
          nisn: !isCorruptedNisn(incomingNisn) ? incomingNisn : match.nisn,
          accessCode: (!isCorruptedAccessCode(incomingAccess) && incomingAccess !== '') ? incomingAccess : match.accessCode,
          parentName: !isInvalidIncomingParentName
            ? incomingParentName
            : (match.parentName || ''),
          parentPhone: !isInvalidIncomingParentPhone
            ? incomingParentPhone
            : (match.parentPhone || ''),
          parentAddress: (incomingAddress && incomingAddress !== '-' && incomingAddress !== 'undefined')
            ? incomingAddress
            : (match.parentAddress || ''),
          nik: (incomingNik && incomingNik !== '-' && incomingNik !== 'undefined' && incomingNik.length >= 10)
            ? incomingNik
            : (match.nik || undefined)
        };
      });

      const sanitized = sanitizeStudents(mergedStudents);
      finalStudents = sanitized;
      setStudents(sanitized);
      saveStudents(sanitized);
    }

    const existingTeachers = loadTeachers();
    if (Array.isArray(imported.teachers) && imported.teachers.length > 0) {
      const prevMapByNip = new Map<string, Teacher>();
      const prevMapByName = new Map<string, Teacher>();

      [...existingTeachers, ...teachers].forEach(t => {
        if (t.nip) prevMapByNip.set(String(t.nip).replace(/[^0-9]/g, ''), t);
        if (t.name) prevMapByName.set(String(t.name).trim().toLowerCase(), t);
      });

      const updatedTeachers: Teacher[] = imported.teachers.map((imp, idx) => {
        const impNip = imp.nip ? String(imp.nip).replace(/[^0-9]/g, '') : '';
        const impName = imp.name ? String(imp.name).trim().toLowerCase() : '';
        const match = (impNip ? prevMapByNip.get(impNip) : null) || (impName ? prevMapByName.get(impName) : null);

        return {
          id: imp.id || (match ? match.id : `TCH-${idx + 1}`),
          nip: (imp.nip && imp.nip !== '-') ? imp.nip : (match?.nip || '-'),
          name: (imp.name && imp.name !== '-') ? imp.name : (match?.name || `Guru ${idx + 1}`),
          role: imp.role || match?.role || 'guru_mapel',
          subject: (imp.subject && imp.subject !== '-') ? imp.subject : (match?.subject || 'Guru'),
          classAssigned: (imp.classAssigned && imp.classAssigned !== '-') ? imp.classAssigned : (match?.classAssigned || 'Semua Kelas'),
          phone: (imp.phone && imp.phone !== '-') ? imp.phone : (match?.phone || '')
        };
      });

      const finalTeachers = sanitizeTeachers(updatedTeachers);
      setTeachers(finalTeachers);
      saveTeachers(finalTeachers);

      const safePiket = sanitizePiketSchedules(
        Array.isArray(imported.piketSchedules) && imported.piketSchedules.length > 0 ? imported.piketSchedules : piketSchedules,
        finalTeachers
      );
      setPiketSchedules(safePiket);
      savePiketSchedules(safePiket);
    } else {
      const currentTeachersList = teachers.length > 0 ? teachers : sanitizeTeachers(initialTeachers);
      if (teachers.length === 0) {
        setTeachers(currentTeachersList);
        saveTeachers(currentTeachersList);
      }

      const safePiket = sanitizePiketSchedules(
        Array.isArray(imported.piketSchedules) && imported.piketSchedules.length > 0 ? imported.piketSchedules : piketSchedules,
        currentTeachersList
      );
      setPiketSchedules(safePiket);
      savePiketSchedules(safePiket);
    }

    const sMapById = new Map(finalStudents.map(s => [s.id, s]));
    const sMapByNisn = new Map(finalStudents.filter(s => s.nisn && s.nisn.length >= 8).map(s => [String(s.nisn).trim().toLowerCase(), s]));
    const sNameMap = new Map(finalStudents.map(s => [s.name.toLowerCase().replace(/\s+/g, ' ').trim(), s]));

    if (Array.isArray(imported.violations)) {
      const mappedViolations = sanitizeRecords<ViolationRecord>(imported.violations.map(v => {
        const vNisn = (v as any).studentNisn ? String((v as any).studentNisn).trim().toLowerCase() : '';
        const vName = v.studentName ? String(v.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';
        const student = (v.studentId ? sMapById.get(v.studentId) : null) ||
                        (vNisn && vNisn.length >= 8 ? sMapByNisn.get(vNisn) : null) ||
                        (vName ? sNameMap.get(vName) : null);
        const vRule = v.ruleName || (v as any).pelanggaran || (v as any).violationName || (v as any).description || 'Pelanggaran Tata Tertib';
        const vReporter = v.reporterName || (v as any).reporter || (v as any).reporterTeacherName || 'Guru Piket';
        const vLocation = v.location || (v as any).lokasi || 'Lingkungan Sekolah';
        const vDesc = v.description || vRule;

        return {
          ...v,
          studentId: student ? student.id : (v.studentId || ''),
          studentName: student ? student.name : (v.studentName || ''),
          studentClass: student ? student.class : (v.studentClass || ''),
          studentNisn: student ? student.nisn : ((v as any).studentNisn || ''),
          date: normalizeRecordDate(v.date),
          ruleName: vRule,
          description: vDesc,
          category: ((v.category || 'ringan').toLowerCase() as any),
          points: Number(v.points) || 0,
          reporterName: vReporter,
          reporter: vReporter,
          reporterTeacherName: vReporter,
          location: vLocation,
          lokasi: vLocation,
          violationName: vRule,
          pelanggaran: vRule,
          reporterId: v.reporterId || (v as any).reporterTeacherId,
          reporterNip: v.reporterNip || (v as any).reporterTeacherNip
        };
      }), 'VIOL');
      setViolations(mappedViolations);
      saveViolations(mappedViolations);
    }
    if (Array.isArray(imported.rewards)) {
      const mappedRewards = sanitizeRecords<RewardRecord>(imported.rewards.map(r => {
        const rNisn = (r as any).studentNisn ? String((r as any).studentNisn).trim().toLowerCase() : '';
        const rName = r.studentName ? String(r.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';
        const student = (r.studentId ? sMapById.get(r.studentId) : null) ||
                        (rNisn && rNisn.length >= 8 ? sMapByNisn.get(rNisn) : null) ||
                        (rName ? sNameMap.get(rName) : null);
        const rTitle = (r as any).title || r.competitionName || r.ruleName || (r as any).prestasi || (r as any).rewardName || 'Apresiasi Prestasi';
        const rReporter = r.reporterName || (r as any).recordedBy || (r as any).reporter || (r as any).reporterTeacherName || 'Guru';

        return {
          ...r,
          studentId: student ? student.id : (r.studentId || ''),
          studentName: student ? student.name : (r.studentName || ''),
          studentClass: student ? student.class : (r.studentClass || ''),
          studentNisn: student ? student.nisn : ((r as any).studentNisn || ''),
          date: normalizeRecordDate(r.date),
          ruleName: rTitle,
          competitionName: rTitle,
          title: rTitle,
          rank: r.rank || (r as any).peringkat || 'Juara 1',
          level: r.level || (r as any).tingkat || 'Sekolah',
          points: Number(r.points) || 0,
          reporterName: rReporter,
          recordedBy: rReporter,
          reporterTeacherName: rReporter,
          reporterId: r.reporterId || (r as any).reporterTeacherId,
          reporterNip: r.reporterNip || (r as any).reporterTeacherNip
        };
      }), 'REW');
      setRewards(mappedRewards);
      saveRewards(mappedRewards);
    }
    if (Array.isArray(imported.compensations)) {
      const mappedCompensations = sanitizeRecords<CompensationRecord>(imported.compensations.map(c => {
        const cNisn = (c as any).studentNisn ? String((c as any).studentNisn).trim().toLowerCase() : '';
        const cName = c.studentName ? String(c.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';
        const student = (c.studentId ? sMapById.get(c.studentId) : null) ||
                        (cNisn && cNisn.length >= 8 ? sMapByNisn.get(cNisn) : null) ||
                        (cName ? sNameMap.get(cName) : null);
        return {
          ...c,
          studentId: student ? student.id : (c.studentId || ''),
          studentName: student ? student.name : (c.studentName || ''),
          studentClass: student ? student.class : (c.studentClass || ''),
          studentNisn: student ? student.nisn : ((c as any).studentNisn || ''),
          date: normalizeRecordDate(c.date)
        };
      }), 'COMP');
      setCompensations(mappedCompensations);
      saveCompensations(mappedCompensations);
    }

    setTimeout(() => {
      isImportingRef.current = false;
    }, 800);
  };

  // Handlers for Students
  const handleAddStudent = (student: Student) => {
    lastLocalActionRef.current = Date.now();
    const sanitized = sanitizeStudents([student, ...students]);
    setStudents(sanitized);
    saveStudents(sanitized);
    triggerSheetsSync({ students: sanitized });
  };

  const handleUpdateStudent = (student: Student) => {
    lastLocalActionRef.current = Date.now();
    const updated = students.map(s => s.id === student.id ? student : s);
    const sanitized = sanitizeStudents(updated);
    setStudents(sanitized);
    saveStudents(sanitized);
    triggerSheetsSync({ students: sanitized });
  };

  const handleDeleteStudent = (id: string) => {
    lastLocalActionRef.current = Date.now();
    const updatedStudents = students.filter(s => s.id !== id);
    const updatedViolations = violations.filter(v => v.studentId !== id);
    const updatedRewards = rewards.filter(r => r.studentId !== id);
    const updatedCompensations = compensations.filter(c => c.studentId !== id);

    setStudents(updatedStudents);
    setViolations(updatedViolations);
    setRewards(updatedRewards);
    setCompensations(updatedCompensations);

    saveStudents(updatedStudents);
    saveViolations(updatedViolations);
    saveRewards(updatedRewards);
    saveCompensations(updatedCompensations);

    triggerSheetsSync({
      students: updatedStudents,
      violations: updatedViolations,
      rewards: updatedRewards,
      compensations: updatedCompensations
    });
  };

  const handleDeleteAllStudents = () => {
    lastLocalActionRef.current = Date.now();
    setStudents([]);
    setViolations([]);
    setRewards([]);
    setCompensations([]);

    saveStudents([]);
    saveViolations([]);
    saveRewards([]);
    saveCompensations([]);

    triggerSheetsSync({
      students: [],
      violations: [],
      rewards: [],
      compensations: []
    });
  };

  const handleImportStudents = (imported: Student[]) => {
    lastLocalActionRef.current = Date.now();
    const sanitized = sanitizeStudents(imported);
    setStudents(sanitized);
    saveStudents(sanitized);
    triggerSheetsSync({ students: sanitized });
  };

  const handlePromoteYear = (promotedStudents: Student[], nextYear: string) => {
    lastLocalActionRef.current = Date.now();
    const sanitized = sanitizeStudents(promotedStudents);
    setStudents(sanitized);
    saveStudents(sanitized);
    const updatedSettings = { ...settings, academicYear: nextYear };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
    triggerSheetsSync({ students: sanitized });
  };

  // Handlers for Teachers
  const handleAddTeacher = (teacher: Teacher) => {
    const updated = [teacher, ...teachers];
    setTeachers(updated);
    saveTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleUpdateTeacher = (teacher: Teacher) => {
    const updated = teachers.map(t => t.id === teacher.id ? teacher : t);
    setTeachers(updated);
    saveTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    saveTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleDeleteAllTeachers = () => {
    setTeachers([]);
    saveTeachers([]);
    const updatedPiket = piketSchedules.map(p => ({ ...p, teacherIds: [] }));
    setPiketSchedules(updatedPiket);
    savePiketSchedules(updatedPiket);
    triggerSheetsSync({
      teachers: [],
      piketSchedules: updatedPiket
    });
  };

  const handleImportTeachers = (imported: Teacher[]) => {
    setTeachers(imported);
    saveTeachers(imported);
    triggerSheetsSync({ teachers: imported });
  };

  // Handlers for Piket Schedules
  const handleUpdatePiketSchedule = (schedule: PiketSchedule) => {
    let updated: PiketSchedule[];
    const exists = piketSchedules.some(p => p.day === schedule.day);
    if (exists) {
      updated = piketSchedules.map(p => p.day === schedule.day ? schedule : p);
    } else {
      updated = [...piketSchedules, schedule];
    }
    setPiketSchedules(updated);
    savePiketSchedules(updated);
    triggerSheetsSync({ piketSchedules: updated });
  };

  const handleUpdateAllPiketSchedules = (schedules: PiketSchedule[]) => {
    setPiketSchedules(schedules);
    savePiketSchedules(schedules);
    triggerSheetsSync({ piketSchedules: schedules });
  };

  const handleOpenJurnalPiket = (dayName: DayOfWeek, dutyTeachers: Teacher[]) => {
    setJurnalPiketData({ dayName, dutyTeachers });
    setJurnalPiketModalOpen(true);
  };

  // Handlers for Violations
  const handleSaveViolation = (violation: ViolationRecord) => {
    lastLocalActionRef.current = Date.now();
    const finalRule = String(violation.ruleName || (violation as any).pelanggaran || (violation as any).violationName || (violation as any).description || 'Pelanggaran Tata Tertib').trim();
    const finalReporter = String(violation.reporterName || (violation as any).reporter || (violation as any).reporterTeacherName || 'Guru Piket').trim();
    const finalDesc = String(violation.description || finalRule).trim();

    const finalLocation = String(violation.location || (violation as any).lokasi || 'Lingkungan Sekolah').trim();

    const cleanViolation: ViolationRecord = {
      ...violation,
      date: normalizeRecordDate(violation.date),
      ruleName: finalRule,
      description: finalDesc,
      location: finalLocation,
      lokasi: finalLocation,
      reporterName: finalReporter,
      reporter: finalReporter,
      reporterTeacherName: finalReporter,
      violationName: finalRule,
      pelanggaran: finalRule,
      note: finalDesc
    } as any;
    const updated = [cleanViolation, ...violations];
    setViolations(updated);
    saveViolations(updated);
    triggerSheetsSync({ violations: updated });
  };

  const handleUpdateViolation = (updatedViolation: ViolationRecord) => {
    lastLocalActionRef.current = Date.now();
    const finalRule = String(updatedViolation.ruleName || (updatedViolation as any).pelanggaran || (updatedViolation as any).violationName || (updatedViolation as any).description || 'Pelanggaran Tata Tertib').trim();
    const finalReporter = String(updatedViolation.reporterName || (updatedViolation as any).reporter || (updatedViolation as any).reporterTeacherName || 'Guru Piket').trim();
    const finalLocation = String(updatedViolation.location || (updatedViolation as any).lokasi || 'Lingkungan Sekolah').trim();
    const finalDesc = String(updatedViolation.description || finalRule).trim();

    const cleanViolation: ViolationRecord = {
      ...updatedViolation,
      date: normalizeRecordDate(updatedViolation.date),
      ruleName: finalRule,
      description: finalDesc,
      location: finalLocation,
      lokasi: finalLocation,
      reporterName: finalReporter,
      reporter: finalReporter,
      reporterTeacherName: finalReporter,
      violationName: finalRule,
      pelanggaran: finalRule,
      note: finalDesc
    } as any;
    const updated = violations.map(v => v.id === cleanViolation.id ? cleanViolation : v);
    setViolations(updated);
    saveViolations(updated);
    triggerSheetsSync({ violations: updated });
  };

  const handleDeleteViolation = (id: string) => {
    lastLocalActionRef.current = Date.now();
    const updated = violations.filter(v => v.id !== id);
    setViolations(updated);
    saveViolations(updated);
    triggerSheetsSync({ violations: updated });
  };

  // Handlers for Rewards
  const handleSaveReward = (reward: RewardRecord) => {
    lastLocalActionRef.current = Date.now();
    const finalTitle = String(reward.competitionName || reward.ruleName || (reward as any).title || (reward as any).prestasi || 'Prestasi Siswa').trim();
    const finalReporter = String(reward.reporterName || (reward as any).recordedBy || (reward as any).reporter || (reward as any).reporterTeacherName || 'Wali Kelas').trim();

    const cleanReward: RewardRecord = {
      ...reward,
      date: normalizeRecordDate(reward.date),
      competitionName: finalTitle,
      ruleName: finalTitle,
      title: finalTitle,
      reporterName: finalReporter,
      recordedBy: finalReporter,
      reporterTeacherName: finalReporter,
      reporter: finalReporter
    } as any;
    const updated = [cleanReward, ...rewards];
    setRewards(updated);
    saveRewards(updated);
    triggerSheetsSync({ rewards: updated });
  };

  const handleUpdateReward = (updatedReward: RewardRecord) => {
    lastLocalActionRef.current = Date.now();
    const finalTitle = String(updatedReward.competitionName || updatedReward.ruleName || (updatedReward as any).title || (updatedReward as any).prestasi || 'Prestasi Siswa').trim();
    const finalReporter = String(updatedReward.reporterName || (updatedReward as any).recordedBy || (updatedReward as any).reporter || (updatedReward as any).reporterTeacherName || 'Wali Kelas').trim();

    const cleanReward: RewardRecord = {
      ...updatedReward,
      date: normalizeRecordDate(updatedReward.date),
      competitionName: finalTitle,
      ruleName: finalTitle,
      title: finalTitle,
      reporterName: finalReporter,
      recordedBy: finalReporter,
      reporterTeacherName: finalReporter,
      reporter: finalReporter
    } as any;
    const updated = rewards.map(r => r.id === cleanReward.id ? cleanReward : r);
    setRewards(updated);
    saveRewards(updated);
    triggerSheetsSync({ rewards: updated });
  };

  const handleDeleteReward = (id: string) => {
    lastLocalActionRef.current = Date.now();
    const updated = rewards.filter(r => r.id !== id);
    setRewards(updated);
    saveRewards(updated);
    triggerSheetsSync({ rewards: updated });
  };

  // Handlers for Compensations
  const handleAddCompensation = (comp: CompensationRecord) => {
    lastLocalActionRef.current = Date.now();
    const cleanComp: CompensationRecord = {
      ...comp,
      date: normalizeRecordDate(comp.date)
    };
    const updated = [cleanComp, ...compensations];
    setCompensations(updated);
    saveCompensations(updated);
    triggerSheetsSync({ compensations: updated });
  };

  const handleDeleteCompensation = (id: string) => {
    lastLocalActionRef.current = Date.now();
    const updated = compensations.filter(c => c.id !== id);
    setCompensations(updated);
    saveCompensations(updated);
    triggerSheetsSync({ compensations: updated });
  };

  // Rules Catalog Handlers
  const handleSaveViolationRules = (rules: ViolationRule[]) => {
    setViolationRules(rules);
  };

  const handleSaveRewardRules = (rules: RewardRule[]) => {
    setRewardRules(rules);
  };

  // Role Switching & PIN
  const handleToggleRole = () => {
    if (role === 'staff') {
      setRole('public');
      if (['data_siswa', 'data_guru', 'data_pelanggaran', 'data_reward', 'penghitungan', 'kelola_poin', 'input_pelanggaran', 'input_reward'].includes(currentTab)) {
        setCurrentTab('dashboard');
      }
    } else {
      setPendingActionAfterPin(() => () => {
        setRole('staff');
      });
      setPinModalOpen(true);
    }
  };

  const handleRequireStaffLogin = (targetTab?: NavTab) => {
    setPendingActionAfterPin(() => () => {
      setRole('staff');
      if (targetTab) setCurrentTab(targetTab);
    });
    setPinModalOpen(true);
  };

  // Quick shortcuts
  const handleQuickInputViolation = (student: Student) => {
    setPreselectedStudent(student);
    setCurrentTab('input_pelanggaran');
  };

  const handleQuickInputReward = (student: Student) => {
    setPreselectedStudent(student);
    setCurrentTab('input_reward');
  };

  // Settings save handler with server persistence
  const handleSaveSettings = (newSettings: SchoolSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);

    const webhook = (newSettings.googleSheetsWebhook || newSettings.googleSheetsWebhookUrl || '').trim();
    const sheetUrl = (newSettings.googleSheetsUrl || '').trim();

    fetch('/api/global-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleSheetsWebhook: webhook,
        googleSheetsUrl: sheetUrl,
        settings: newSettings
      })
    }).catch(err => console.log('Error updating server global config:', err));
  };

  // Open Surat Modal
  const handleOpenSuratModal = (
    summary: StudentScoreSummary,
    type: 'panggilan_100' | 'skorsing_300' | 'pembinaan_500' = 'panggilan_100'
  ) => {
    setSuratModalData({
      open: true,
      summary,
      type
    });
  };

  // Open Sertifikat Modal
  const handleOpenSertifikatModal = (reward: RewardRecord) => {
    setSertifikatModalData({
      open: true,
      reward
    });
  };

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-800 flex flex-col font-sans selection:bg-emerald-900 selection:text-white">
      {/* Navigation Header */}
      <Navbar
        role={role}
        settings={settings}
        onToggleRole={handleToggleRole}
        onOpenSheetsModal={() => setSheetsModalOpen(true)}
        onOpenSettingsModal={() => setSettingsModalOpen(true)}
        onToggleMobileSidebar={() => setMobileSidebarOpen(prev => !prev)}
        urgentAlertCount={urgentAlertCount}
        isSyncing={isLoadingSpreadsheet}
        onManualSync={() => fetchSpreadsheetData(false)}
        lastSyncTime={lastSyncTime}
      />

      {/* Main Body Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setCurrentTab(tab);
            setPreselectedStudent(null);
          }}
          role={role}
          urgentAlertCount={urgentAlertCount}
          mobileOpen={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          onRequireStaffLogin={() => handleRequireStaffLogin()}
        />

        {/* Content Canvas */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          {sheetsSyncStatus && (
            <div className="mb-4 px-4 py-2.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in">
              <span>{sheetsSyncStatus}</span>
              <button
                onClick={() => setSheetsSyncStatus(null)}
                className="text-emerald-700 hover:text-emerald-900 ml-3 text-base leading-none font-bold cursor-pointer"
                title="Tutup"
              >
                ×
              </button>
            </div>
          )}
          {currentTab === 'dashboard' && (
            <DashboardView
              students={students}
              violations={violations}
              rewards={rewards}
              compensations={compensations}
              summaries={summaries}
              settings={settings}
              role={role}
              onNavigate={(tab) => {
                if (['data_siswa', 'data_guru', 'data_pelanggaran', 'data_reward', 'penghitungan', 'kelola_poin', 'input_pelanggaran', 'input_reward'].includes(tab) && role !== 'staff') {
                  handleRequireStaffLogin(tab);
                } else {
                  setCurrentTab(tab);
                }
              }}
              onSelectStudentForSurat={handleOpenSuratModal}
              onSelectRewardForCert={handleOpenSertifikatModal}
            />
          )}

          {currentTab === 'data_siswa' && (
            <DataSiswaView
              students={students}
              summaries={summaries}
              violations={violations}
              rewards={rewards}
              compensations={compensations}
              currentAcademicYear={settings.academicYear || '2026/2027'}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteAllStudents={handleDeleteAllStudents}
              onImportStudents={handleImportStudents}
              onQuickInputViolation={handleQuickInputViolation}
              onQuickInputReward={handleQuickInputReward}
              onPromoteYear={handlePromoteYear}
            />
          )}

          {currentTab === 'data_guru' && (
            <DataGuruView
              teachers={teachers}
              students={students}
              piketSchedules={piketSchedules}
              violations={violations}
              rewards={rewards}
              settings={settings}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onDeleteAllTeachers={handleDeleteAllTeachers}
              onUpdatePiketSchedule={handleUpdatePiketSchedule}
              onUpdateAllPiketSchedules={handleUpdateAllPiketSchedules}
              onOpenJurnalPiket={handleOpenJurnalPiket}
              onImportTeachers={handleImportTeachers}
              onOpenSheetsModal={() => setSheetsModalOpen(true)}
              onFetchFromSheets={() => fetchSpreadsheetData(false)}
              isLoadingSheets={isLoadingSpreadsheet}
            />
          )}

          {currentTab === 'data_pelanggaran' && (
            <DataPelanggaranView
              violations={violations}
              students={students}
              teachers={teachers}
              piketSchedules={piketSchedules}
              violationRules={violationRules}
              summaries={summaries}
              settings={settings}
              onDeleteViolation={handleDeleteViolation}
              onUpdateViolation={handleUpdateViolation}
              onNavigateToInput={() => setCurrentTab('input_pelanggaran')}
              onOpenSurat={(sum) => handleOpenSuratModal(sum, 'panggilan_100')}
            />
          )}

          {currentTab === 'data_reward' && (
            <DataRewardView
              rewards={rewards}
              students={students}
              teachers={teachers}
              rewardRules={rewardRules}
              settings={settings}
              onDeleteReward={handleDeleteReward}
              onUpdateReward={handleUpdateReward}
              onNavigateToInput={() => setCurrentTab('input_reward')}
              onOpenSertifikat={handleOpenSertifikatModal}
            />
          )}

          {currentTab === 'penghitungan' && (
            <PenghitunganView
              summaries={summaries}
              compensations={compensations}
              violations={violations}
              settings={settings}
              onAddCompensation={handleAddCompensation}
              onDeleteCompensation={handleDeleteCompensation}
              onOpenSurat={handleOpenSuratModal}
            />
          )}

          {currentTab === 'kelola_poin' && (
            <KelolaPoinView
              violationRules={violationRules}
              rewardRules={rewardRules}
              onSaveViolationRules={handleSaveViolationRules}
              onSaveRewardRules={handleSaveRewardRules}
            />
          )}

          {currentTab === 'input_pelanggaran' && (
            <InputPelanggaranView
              students={students}
              teachers={teachers}
              piketSchedules={piketSchedules}
              violationRules={violationRules}
              summaries={summaries}
              settings={settings}
              preselectedStudent={preselectedStudent}
              onSaveViolation={handleSaveViolation}
              onNavigateToData={() => setCurrentTab('data_pelanggaran')}
            />
          )}

          {currentTab === 'input_reward' && (
            <InputRewardView
              students={students}
              teachers={teachers}
              rewardRules={rewardRules}
              settings={settings}
              preselectedStudent={preselectedStudent}
              onSaveReward={handleSaveReward}
              onOpenCertificate={handleOpenSertifikatModal}
              onNavigateToData={() => setCurrentTab('data_reward')}
            />
          )}

          {currentTab === 'edukasi' && (
            <EdukasiView
              violationRules={violationRules}
              rewardRules={rewardRules}
              settings={settings}
            />
          )}

          {currentTab === 'portal_publik' && (
            <PublicPortalView
              students={students}
              summaries={summaries}
              violations={violations}
              rewards={rewards}
              compensations={compensations}
              settings={settings}
              onOpenSertifikat={handleOpenSertifikatModal}
            />
          )}
        </main>
      </div>

      {/* Official Letter Modal (Panggilan Ortu, Skorsing, Pembinaan di Rumah) */}
      {suratModalData.open && suratModalData.summary && (
        <SuratModal
          isOpen={suratModalData.open}
          onClose={() => setSuratModalData(prev => ({ ...prev, open: false }))}
          summary={suratModalData.summary}
          violations={violations.filter(v => v.studentId === suratModalData.summary?.student.id)}
          settings={settings}
          initialType={suratModalData.type}
        />
      )}

      {/* Official Certificate Modal */}
      {sertifikatModalData.open && sertifikatModalData.reward && (
        <SertifikatModal
          isOpen={sertifikatModalData.open}
          onClose={() => setSertifikatModalData(prev => ({ ...prev, open: false }))}
          reward={sertifikatModalData.reward}
          settings={settings}
        />
      )}

      {/* Google Sheets Sync Integration Modal */}
      {sheetsModalOpen && (
        <GoogleSheetsModal
          isOpen={sheetsModalOpen}
          onClose={() => setSheetsModalOpen(false)}
          settings={settings}
          students={students}
          teachers={teachers}
          piketSchedules={piketSchedules}
          violations={violations}
          rewards={rewards}
          compensations={compensations}
          summaries={summaries}
          onSaveSettings={handleSaveSettings}
          onImportFullData={handleImportFullData}
        />
      )}

      {/* Jurnal Piket Harian Modal */}
      {jurnalPiketModalOpen && jurnalPiketData && (
        <JurnalPiketModal
          isOpen={jurnalPiketModalOpen}
          onClose={() => {
            setJurnalPiketModalOpen(false);
            setJurnalPiketData(null);
          }}
          selectedDate={new Date().toISOString().slice(0, 10)}
          dayName={jurnalPiketData.dayName}
          dutyTeachers={jurnalPiketData.dutyTeachers}
          violations={violations}
          rewards={rewards}
          settings={settings}
        />
      )}

      {/* Kode Akses Security Login Modal */}
      {pinModalOpen && (
        <PinLoginModal
          isOpen={pinModalOpen}
          onClose={() => {
            setPinModalOpen(false);
            setPendingActionAfterPin(null);
          }}
          correctPin={settings.staffPin || settings.adminPin || '1234'}
          onSuccess={() => {
            setRole('staff');
            if (pendingActionAfterPin) {
              pendingActionAfterPin();
            }
            setPinModalOpen(false);
            setPendingActionAfterPin(null);
          }}
        />
      )}

      {/* Settings Modal */}
      {settingsModalOpen && (
        <PengaturanModal
          isOpen={settingsModalOpen}
          onClose={() => setSettingsModalOpen(false)}
          settings={settings}
          onSaveSettings={handleSaveSettings}
        />
      )}
    </div>
  );
}
