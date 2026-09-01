import React, { useState, useEffect, useMemo } from 'react';
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
import { syncFullStateToSheets } from './utils/sheetsSync';

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
    return calculateSummaries(students, violations, rewards, compensations);
  }, [students, violations, rewards, compensations]);

  // Urgent alerts for >=100 points
  const urgentAlertCount = useMemo(() => {
    return summaries.filter(s => s.activeViolationPoints >= 100).length;
  }, [summaries]);

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

  // Background Google Sheets Sync Helper
  const triggerSheetsSync = () => {
    if (settings.googleSheetsWebhookUrl) {
      syncFullStateToSheets(
        settings.googleSheetsWebhookUrl,
        students,
        violations,
        rewards,
        compensations,
        summaries
      ).catch(err => console.log('Background sheets sync:', err));
    }
  };

  // Handlers for Students
  const handleAddStudent = (student: Student) => {
    setStudents(prev => [student, ...prev]);
    triggerSheetsSync();
  };

  const handleUpdateStudent = (student: Student) => {
    setStudents(prev => prev.map(s => s.id === student.id ? student : s));
    triggerSheetsSync();
  };

  const handleDeleteStudent = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id));
    setViolations(prev => prev.filter(v => v.studentId !== id));
    setRewards(prev => prev.filter(r => r.studentId !== id));
    setCompensations(prev => prev.filter(c => c.studentId !== id));
    triggerSheetsSync();
  };

  const handleImportStudents = (imported: Student[]) => {
    setStudents(imported);
    triggerSheetsSync();
  };

  // Handlers for Teachers
  const handleAddTeacher = (teacher: Teacher) => {
    setTeachers(prev => [teacher, ...prev]);
  };

  const handleUpdateTeacher = (teacher: Teacher) => {
    setTeachers(prev => prev.map(t => t.id === teacher.id ? teacher : t));
  };

  const handleDeleteTeacher = (id: string) => {
    setTeachers(prev => prev.filter(t => t.id !== id));
  };

  const handleImportTeachers = (imported: Teacher[]) => {
    setTeachers(imported);
  };

  // Handlers for Piket Schedules
  const handleUpdatePiketSchedule = (schedule: PiketSchedule) => {
    setPiketSchedules(prev => {
      const exists = prev.some(p => p.day === schedule.day);
      if (exists) {
        return prev.map(p => p.day === schedule.day ? schedule : p);
      }
      return [...prev, schedule];
    });
  };

  const handleUpdateAllPiketSchedules = (schedules: PiketSchedule[]) => {
    setPiketSchedules(schedules);
  };

  const handleOpenJurnalPiket = (dayName: DayOfWeek, dutyTeachers: Teacher[]) => {
    setJurnalPiketData({ dayName, dutyTeachers });
    setJurnalPiketModalOpen(true);
  };

  // Handlers for Violations
  const handleSaveViolation = (violation: ViolationRecord) => {
    setViolations(prev => [violation, ...prev]);
    triggerSheetsSync();
  };

  const handleDeleteViolation = (id: string) => {
    setViolations(prev => prev.filter(v => v.id !== id));
    triggerSheetsSync();
  };

  // Handlers for Rewards
  const handleSaveReward = (reward: RewardRecord) => {
    setRewards(prev => [reward, ...prev]);
    triggerSheetsSync();
  };

  const handleDeleteReward = (id: string) => {
    setRewards(prev => prev.filter(r => r.id !== id));
    triggerSheetsSync();
  };

  // Handlers for Compensations
  const handleAddCompensation = (comp: CompensationRecord) => {
    setCompensations(prev => [comp, ...prev]);
    triggerSheetsSync();
  };

  const handleDeleteCompensation = (id: string) => {
    setCompensations(prev => prev.filter(c => c.id !== id));
    triggerSheetsSync();
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
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onImportStudents={handleImportStudents}
              onQuickInputViolation={handleQuickInputViolation}
              onQuickInputReward={handleQuickInputReward}
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
          violations={violations}
          rewards={rewards}
          compensations={compensations}
          summaries={summaries}
          onSaveSettings={(newSettings) => setSettings(newSettings)}
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
