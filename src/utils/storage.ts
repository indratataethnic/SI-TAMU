import { Student, Teacher, PiketSchedule, ViolationRule, RewardRule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings, StudentScoreSummary } from '../types';
import { initialStudents, initialTeachers, initialPiketSchedules, initialViolationRules, initialRewardRules, initialViolations, initialRewards, initialCompensations, initialSettings } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'sitamu_students',
  TEACHERS: 'sitamu_teachers',
  PIKET_SCHEDULES: 'sitamu_piket_schedules',
  VIOLATION_RULES: 'sitamu_violation_rules',
  REWARD_RULES: 'sitamu_reward_rules',
  VIOLATIONS: 'sitamu_violations',
  REWARDS: 'sitamu_rewards',
  COMPENSATIONS: 'sitamu_compensations',
  SETTINGS: 'sitamu_settings',
  USER_ROLE: 'sitamu_user_role'
};

export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : initialStudents;
  } catch (e) {
    console.error('Failed reading students from storage', e);
    return initialStudents;
  }
};

export const loadStudents = getStoredStudents;

export const saveStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
};

export const getStoredTeachers = (): Teacher[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    return raw ? JSON.parse(raw) : initialTeachers;
  } catch (e) {
    console.error('Failed reading teachers from storage', e);
    return initialTeachers;
  }
};

export const loadTeachers = getStoredTeachers;

export const saveTeachers = (teachers: Teacher[]): void => {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(teachers));
};

export const getStoredPiketSchedules = (): PiketSchedule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIKET_SCHEDULES);
    return raw ? JSON.parse(raw) : initialPiketSchedules;
  } catch (e) {
    console.error('Failed reading piket schedules from storage', e);
    return initialPiketSchedules;
  }
};

export const loadPiketSchedules = getStoredPiketSchedules;

export const savePiketSchedules = (schedules: PiketSchedule[]): void => {
  localStorage.setItem(STORAGE_KEYS.PIKET_SCHEDULES, JSON.stringify(schedules));
};

export const getStoredViolationRules = (): ViolationRule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIOLATION_RULES);
    return raw ? JSON.parse(raw) : initialViolationRules;
  } catch (e) {
    return initialViolationRules;
  }
};

export const loadViolationRules = getStoredViolationRules;

export const saveViolationRules = (rules: ViolationRule[]): void => {
  localStorage.setItem(STORAGE_KEYS.VIOLATION_RULES, JSON.stringify(rules));
};

export const getStoredRewardRules = (): RewardRule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARD_RULES);
    return raw ? JSON.parse(raw) : initialRewardRules;
  } catch (e) {
    return initialRewardRules;
  }
};

export const loadRewardRules = getStoredRewardRules;

export const saveRewardRules = (rules: RewardRule[]): void => {
  localStorage.setItem(STORAGE_KEYS.REWARD_RULES, JSON.stringify(rules));
};

export const getStoredViolations = (): ViolationRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VIOLATIONS);
    return raw ? JSON.parse(raw) : initialViolations;
  } catch (e) {
    return initialViolations;
  }
};

export const loadViolations = getStoredViolations;

export const saveViolations = (records: ViolationRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(records));
};

export const getStoredRewards = (): RewardRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARDS);
    return raw ? JSON.parse(raw) : initialRewards;
  } catch (e) {
    return initialRewards;
  }
};

export const loadRewards = getStoredRewards;

export const saveRewards = (records: RewardRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(records));
};

export const getStoredCompensations = (): CompensationRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPENSATIONS);
    return raw ? JSON.parse(raw) : initialCompensations;
  } catch (e) {
    return initialCompensations;
  }
};

export const loadCompensations = getStoredCompensations;

export const saveCompensations = (records: CompensationRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.COMPENSATIONS, JSON.stringify(records));
};

export const getStoredSettings = (): SchoolSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    return raw ? JSON.parse(raw) : initialSettings;
  } catch (e) {
    return initialSettings;
  }
};

export const loadSettings = getStoredSettings;

export const saveSettings = (settings: SchoolSettings): void => {
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
};

export const loadUserRole = (): 'staff' | 'public' => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.USER_ROLE);
    return raw === 'staff' || raw === 'public' ? raw : 'staff';
  } catch (e) {
    return 'staff';
  }
};

export const saveUserRole = (role: 'staff' | 'public'): void => {
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
};

export const resetAllToDefault = (): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(initialStudents));
  localStorage.setItem(STORAGE_KEYS.VIOLATION_RULES, JSON.stringify(initialViolationRules));
  localStorage.setItem(STORAGE_KEYS.REWARD_RULES, JSON.stringify(initialRewardRules));
  localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(initialViolations));
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(initialRewards));
  localStorage.setItem(STORAGE_KEYS.COMPENSATIONS, JSON.stringify(initialCompensations));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
};

export const calculateStudentSummaries = (
  students: Student[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  compensations: CompensationRecord[]
): StudentScoreSummary[] => {
  return students.map(student => {
    const studentViolations = violations.filter(v => v.studentId === student.id);
    const studentRewards = rewards.filter(r => r.studentId === student.id);
    const studentCompensations = compensations.filter(
      c => c.studentId === student.id && c.status === 'Disetujui'
    );

    const totalViolationPoints = studentViolations.reduce((sum, v) => sum + (Number(v.points) || 0), 0);
    const totalRewardPoints = studentRewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
    const totalCompensationPoints = studentCompensations.reduce((sum, c) => sum + (Number(c.deductedPoints) || 0), 0);

    const activeViolationPoints = Math.max(0, totalViolationPoints - totalCompensationPoints);

    let statusLevel: 'normal' | 'peringatan' | 'skorsing' | 'pembinaan_rumah' = 'normal';
    let statusText = 'Tertib / Normal';
    let statusColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
    let statusBadge = '🟢 Aman';

    if (activeViolationPoints >= 500) {
      statusLevel = 'pembinaan_rumah';
      statusText = 'Dikembalikan ke Orang Tua (≥500 Poin)';
      statusColor = 'text-rose-700 bg-rose-50 border-rose-300';
      statusBadge = '🔴 Pembinaan Rumah';
    } else if (activeViolationPoints >= 300) {
      statusLevel = 'skorsing';
      statusText = 'Skorsing & Perjanjian Khusus (≥300 Poin)';
      statusColor = 'text-red-700 bg-red-50 border-red-200';
      statusBadge = '⛔ Skorsing';
    } else if (activeViolationPoints >= 100) {
      statusLevel = 'peringatan';
      statusText = 'Panggilan Orang Tua I (≥100 Poin)';
      statusColor = 'text-amber-700 bg-amber-50 border-amber-200';
      statusBadge = '⚠️ Peringatan Ortu';
    }

    return {
      student,
      totalViolationPoints,
      totalRewardPoints,
      totalCompensationPoints,
      activeViolationPoints,
      statusLevel,
      statusText,
      statusColor,
      statusBadge,
      violationsCount: studentViolations.length,
      rewardsCount: studentRewards.length,
      compensationsCount: studentCompensations.length
    };
  });
};

export const calculateSummaries = calculateStudentSummaries;
