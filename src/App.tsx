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
  calculateSummaries
} from './utils/storage';
import { syncFullStateToSheets, fetchFullStateFromSheets } from './utils/sheetsSync';

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

  // Auto-save listeners
  useEffect(() => { saveStudents(students); }, [students]);
  useEffect(() => { saveTeachers(teachers); }, [teachers]);
  useEffect(() => { savePiketSchedules(piketSchedules); }, [piketSchedules]);
  useEffect(() => { saveViolationRules(violationRules); }, [violationRules]);
  useEffect(() => { saveRewardRules(rewardRules); }, [rewardRules]);
  useEffect(() => { saveViolations(violations); }, [violations]);
  useEffect(() => { saveRewards(rewards); }, [rewards]);
  useEffect(() => { saveCompensations(compensations); }, [compensations]);
  // Load global server-side config on mount to sync across different laptops / HP devices
  useEffect(() => {
    fetch('/api/global-config')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setSettings(prev => {
            const webhook = data.googleSheetsWebhook || prev.googleSheetsWebhook || '';
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
      .catch(err => console.log('Error loading global configuration:', err))
      .finally(() => {
        setTimeout(() => {
          isInitialLoadingRef.current = false;
        }, 3000);
      });
  }, []);

  // Automatic full data sync/fetch from Google Sheets on startup (LOAD ONLY, DO NOT SAVE BACK)
  useEffect(() => {
    const webhook = (settings.googleSheetsWebhook || settings.googleSheetsWebhookUrl || '').trim();
    if (!webhook) return;

    const hasAutoFetched = sessionStorage.getItem('si_tamu_auto_fetched');
    if (hasAutoFetched) {
      isInitialLoadingRef.current = false;
      return;
    }
    sessionStorage.setItem('si_tamu_auto_fetched', 'true');

    fetchFullStateFromSheets(webhook)
      .then(res => {
        if (res.success && res.data) {
          console.log('Auto-loaded data from Google Sheets successfully');
          handleImportFullData(res.data);
        }
      })
      .catch(err => console.log('Auto-fetch from sheets error:', err))
      .finally(() => {
        setTimeout(() => {
          isInitialLoadingRef.current = false;
        }, 1500);
      });
  }, [settings.googleSheetsWebhook, settings.googleSheetsWebhookUrl]);

  useEffect(() => { 
    saveSettings(settings); 
    if (isInitialLoadingRef.current) return; // DO NOT post/save back to server during initial load
    // Persist configuration & school settings to the Express backend container server
    const webhook = (settings.googleSheetsWebhook || settings.googleSheetsWebhookUrl || '').trim();
    const sheetUrl = (settings.googleSheetsUrl || '').trim();
    fetch('/api/global-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleSheetsWebhook: webhook,
        googleSheetsUrl: sheetUrl,
        settings: settings
      })
    }).catch(err => console.log('Error writing global config to server:', err));
  }, [settings]);
  useEffect(() => { saveUserRole(role); }, [role]);

  // Background Google Sheets Sync Helper with direct state support
  const triggerSheetsSync = (override?: {
    students?: Student[];
    teachers?: Teacher[];
    piketSchedules?: PiketSchedule[];
    violations?: ViolationRecord[];
    rewards?: RewardRecord[];
    compensations?: CompensationRecord[];
  }) => {
    const webhook = (settings.googleSheetsWebhook || settings.googleSheetsWebhookUrl || '').trim();
    if (!webhook) return;

    const studentsToSync = override?.students ?? students;
    const teachersToSync = override?.teachers ?? teachers;
    const piketSchedulesToSync = override?.piketSchedules ?? piketSchedules;
    const violationsToSync = override?.violations ?? violations;
    const rewardsToSync = override?.rewards ?? rewards;
    const compensationsToSync = override?.compensations ?? compensations;

    syncFullStateToSheets(
      webhook,
      studentsToSync,
      violationsToSync,
      rewardsToSync,
      compensationsToSync,
      summaries,
      settings.googleSheetsUrl,
      teachersToSync,
      piketSchedulesToSync,
      settings
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
    if (imported.settings) {
      setSettings(prev => {
        const fetched = (imported.settings || {}) as any;
        return {
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
      });
    }

    if (imported.students && imported.students.length > 0) {
      setStudents(imported.students);
    }
    if (imported.teachers && imported.teachers.length > 0) {
      setTeachers(imported.teachers);
    }
    if (imported.piketSchedules && imported.piketSchedules.length > 0) {
      setPiketSchedules(imported.piketSchedules);
    }

    const mergedStudents = (imported.students && imported.students.length > 0) ? imported.students : students;
    const sMap = new Map(mergedStudents.map(s => [s.nisn, s.id]));

    if (imported.violations && imported.violations.length > 0) {
      const mappedViolations = imported.violations.map(v => ({
        ...v,
        studentId: v.studentId || sMap.get((v as any).studentNisn || '') || ''
      }));
      setViolations(mappedViolations);
    }
    if (imported.rewards && imported.rewards.length > 0) {
      const mappedRewards = imported.rewards.map(r => ({
        ...r,
        studentId: r.studentId || sMap.get((r as any).studentNisn || '') || ''
      }));
      setRewards(mappedRewards);
    }
    if (imported.compensations && imported.compensations.length > 0) {
      const mappedCompensations = imported.compensations.map(c => ({
        ...c,
        studentId: c.studentId || sMap.get((c as any).studentNisn || '') || ''
      }));
      setCompensations(mappedCompensations);
    }
  };

  // Handlers for Students
  const handleAddStudent = (student: Student) => {
    const updated = [student, ...students];
    setStudents(updated);
    triggerSheetsSync({ students: updated });
  };

  const handleUpdateStudent = (student: Student) => {
    const updated = students.map(s => s.id === student.id ? student : s);
    setStudents(updated);
    triggerSheetsSync({ students: updated });
  };

  const handleDeleteStudent = (id: string) => {
    const updatedStudents = students.filter(s => s.id !== id);
    const updatedViolations = violations.filter(v => v.studentId !== id);
    const updatedRewards = rewards.filter(r => r.studentId !== id);
    const updatedCompensations = compensations.filter(c => c.studentId !== id);

    setStudents(updatedStudents);
    setViolations(updatedViolations);
    setRewards(updatedRewards);
    setCompensations(updatedCompensations);

    triggerSheetsSync({
      students: updatedStudents,
      violations: updatedViolations,
      rewards: updatedRewards,
      compensations: updatedCompensations
    });
  };

  const handleImportStudents = (imported: Student[]) => {
    setStudents(imported);
    triggerSheetsSync({ students: imported });
  };

  const handlePromoteYear = (promotedStudents: Student[], nextYear: string) => {
    setStudents(promotedStudents);
    const updatedSettings = { ...settings, academicYear: nextYear };
    setSettings(updatedSettings);
    triggerSheetsSync({ students: promotedStudents });
  };

  // Handlers for Teachers
  const handleAddTeacher = (teacher: Teacher) => {
    const updated = [teacher, ...teachers];
    setTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleUpdateTeacher = (teacher: Teacher) => {
    const updated = teachers.map(t => t.id === teacher.id ? teacher : t);
    setTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleDeleteTeacher = (id: string) => {
    const updated = teachers.filter(t => t.id !== id);
    setTeachers(updated);
    triggerSheetsSync({ teachers: updated });
  };

  const handleImportTeachers = (imported: Teacher[]) => {
    setTeachers(imported);
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
    triggerSheetsSync({ piketSchedules: updated });
  };

  const handleUpdateAllPiketSchedules = (schedules: PiketSchedule[]) => {
    setPiketSchedules(schedules);
    triggerSheetsSync({ piketSchedules: schedules });
  };

  const handleOpenJurnalPiket = (dayName: DayOfWeek, dutyTeachers: Teacher[]) => {
    setJurnalPiketData({ dayName, dutyTeachers });
    setJurnalPiketModalOpen(true);
  };

  // Handlers for Violations
  const handleSaveViolation = (violation: ViolationRecord) => {
    const updated = [violation, ...violations];
    setViolations(updated);
    triggerSheetsSync({ violations: updated });
  };

  const handleDeleteViolation = (id: string) => {
    const updated = violations.filter(v => v.id !== id);
    setViolations(updated);
    triggerSheetsSync({ violations: updated });
  };

  // Handlers for Rewards
  const handleSaveReward = (reward: RewardRecord) => {
    const updated = [reward, ...rewards];
    setRewards(updated);
    triggerSheetsSync({ rewards: updated });
  };

  const handleDeleteReward = (id: string) => {
    const updated = rewards.filter(r => r.id !== id);
    setRewards(updated);
    triggerSheetsSync({ rewards: updated });
  };

  // Handlers for Compensations
  const handleAddCompensation = (comp: CompensationRecord) => {
    const updated = [comp, ...compensations];
    setCompensations(updated);
    triggerSheetsSync({ compensations: updated });
  };

  const handleDeleteCompensation = (id: string) => {
    const updated = compensations.filter(c => c.id !== id);
    setCompensations(updated);
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
      if (['data_siswa', 'data_pelanggaran', 'data_reward', 'penghitungan', 'kelola_poin', 'input_pelanggaran', 'input_reward'].includes(currentTab)) {
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
              onImportStudents={handleImportStudents}
              onQuickInputViolation={handleQuickInputViolation}
              onQuickInputReward={handleQuickInputReward}
              onPromoteYear={handlePromoteYear}
            />
          )}

          {currentTab === 'data_guru' && (
            <DataGuruView
              teachers={teachers}
              piketSchedules={piketSchedules}
              violations={violations}
              rewards={rewards}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onUpdatePiketSchedule={handleUpdatePiketSchedule}
              onUpdateAllPiketSchedules={handleUpdateAllPiketSchedules}
              onOpenJurnalPiket={handleOpenJurnalPiket}
              onImportTeachers={handleImportTeachers}
            />
          )}

          {currentTab === 'data_pelanggaran' && (
            <DataPelanggaranView
              violations={violations}
              students={students}
              summaries={summaries}
              settings={settings}
              onDeleteViolation={handleDeleteViolation}
              onNavigateToInput={() => setCurrentTab('input_pelanggaran')}
              onOpenSurat={(sum) => handleOpenSuratModal(sum, 'panggilan_100')}
            />
          )}

          {currentTab === 'data_reward' && (
            <DataRewardView
              rewards={rewards}
              students={students}
              settings={settings}
              onDeleteReward={handleDeleteReward}
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
          onSaveSettings={(newSettings) => setSettings(newSettings)}
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
          onSaveSettings={(newSettings) => setSettings(newSettings)}
        />
      )}
    </div>
  );
}
