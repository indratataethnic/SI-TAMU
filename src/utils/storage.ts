import { Student, Teacher, PiketSchedule, ViolationRule, RewardRule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings, StudentScoreSummary } from '../types';
import { initialStudents, initialTeachers, initialPiketSchedules, initialViolationRules, initialRewardRules, initialViolations, initialRewards, initialCompensations, initialSettings, OFFICIAL_WEBHOOK_URL } from '../data/initialData';

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

// Map for healing corrupted or single-digit parent/contact data from authentic initial student records
const initialStudentsByNisn = new Map<string, Student>();
const initialStudentsByNik = new Map<string, Student>();
const initialStudentsByName = new Map<string, Student>();

(initialStudents || []).forEach(s => {
  if (s.nisn) initialStudentsByNisn.set(String(s.nisn).trim().toLowerCase(), s);
  if (s.nik) initialStudentsByNik.set(String(s.nik).replace(/^'/, '').trim(), s);
  if (s.name) initialStudentsByName.set(String(s.name).trim().toLowerCase(), s);
});

// Sanitization helpers to prevent duplicate React keys or invalid phone-number IDs
export const sanitizeStudents = (students: Student[]): Student[] => {
  const seenIds = new Set<string>();
  return (students || []).map((s, idx) => {
    let cleanId = s.id ? String(s.id).trim() : '';
    const rawNisn = String(s.nisn || '').replace(/^'/, '').trim();
    const rawName = String(s.name || '').trim();
    const rawNik = s.nik ? String(s.nik).replace(/^'/, '').trim() : '';
    const rawClass = String(s.class || 'Kelas 1').trim();
    
    // Normalize gender
    const gUpper = String(s.gender || 'L').trim().toUpperCase();
    const cleanGender: 'L' | 'P' = gUpper.startsWith('P') || gUpper.includes('PEREMPUAN') || gUpper.includes('WANITA') ? 'P' : 'L';

    if (!cleanId || seenIds.has(cleanId) || /^(\+?62|08)\d+$/.test(cleanId)) {
      cleanId = `STU-${rawNisn || 'NO_NISN'}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(cleanId);

    let cleanAccess = s.accessCode ? String(s.accessCode).replace(/^'/, '').trim().toUpperCase() : '';
    if (!cleanAccess && rawName) {
      const firstName = rawName.split(' ')[0] || 'SISWA';
      const cleanCls = rawClass.replace(/[^a-zA-Z0-9]/g, '');
      cleanAccess = (firstName + cleanCls).toUpperCase();
    }

    // Match with authentic record if available
    const authRecord = (rawNisn ? initialStudentsByNisn.get(rawNisn.toLowerCase()) : null) ||
                       (rawNik ? initialStudentsByNik.get(rawNik) : null) ||
                       (rawName ? initialStudentsByName.get(rawName.toLowerCase()) : null);

    // Validate parent name: if purely numeric (e.g. "1", "3", "5"), phone number, or invalid
    let cleanParentName = String(s.parentName || '').trim();
    const isInvalidParentName = !cleanParentName || 
      /^\d+$/.test(cleanParentName) || 
      cleanParentName === '-' || 
      cleanParentName === 'undefined' || 
      cleanParentName.length <= 1 ||
      cleanParentName.startsWith('08') ||
      cleanParentName.startsWith('+62');

    if (isInvalidParentName) {
      cleanParentName = authRecord?.parentName || '';
    }

    // Validate parent phone: must have at least 8 digits
    let rawParentPhone = String(s.parentPhone || '').replace(/^'/, '').replace(/[^0-9+]/g, '').trim();
    if (rawParentPhone.replace(/[^0-9]/g, '').length < 8) {
      rawParentPhone = authRecord?.parentPhone ? String(authRecord.parentPhone).replace(/^'/, '').replace(/[^0-9+]/g, '').trim() : '';
    }

    if (rawParentPhone.startsWith('8') && rawParentPhone.length >= 9 && rawParentPhone.length <= 13) {
      rawParentPhone = '0' + rawParentPhone;
    } else if (rawParentPhone.startsWith('628')) {
      rawParentPhone = '0' + rawParentPhone.substring(2);
    } else if (rawParentPhone.startsWith('+628')) {
      rawParentPhone = '0' + rawParentPhone.substring(3);
    }

    let cleanAddress = String(s.parentAddress || '').trim();
    if ((!cleanAddress || cleanAddress === '-' || cleanAddress === 'undefined') && authRecord?.parentAddress) {
      cleanAddress = authRecord.parentAddress;
    }

    return {
      ...s,
      id: cleanId,
      nik: rawNik && rawNik !== '-' ? rawNik : (authRecord?.nik || undefined),
      nisn: rawNisn || authRecord?.nisn || `00${idx + 10000000}`,
      name: rawName || authRecord?.name || `Siswa ${idx + 1}`,
      class: rawClass || authRecord?.class || 'Kelas 1',
      gender: cleanGender,
      parentName: cleanParentName,
      parentPhone: rawParentPhone,
      parentAddress: cleanAddress,
      accessCode: cleanAccess || authRecord?.accessCode || `SISWA${idx + 1}`,
      createdAt: s.createdAt || authRecord?.createdAt || new Date().toISOString()
    };
  });
};

export const sanitizeTeachers = (teachers: Teacher[]): Teacher[] => {
  const seenIds = new Set<string>();
  return (teachers || []).map((t, idx) => {
    let cleanId = t.id ? String(t.id).trim() : '';
    if (!cleanId || seenIds.has(cleanId) || /^(\+?62|08)\d+$/.test(cleanId)) {
      cleanId = `TCH-${t.nip || 'NO_NIP'}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(cleanId);
    return { ...t, id: cleanId };
  });
};

export const sanitizeRecords = <T extends { id: string }>(records: T[], prefix: string): T[] => {
  const seenIds = new Set<string>();
  return (records || []).map((r, idx) => {
    let cleanId = r.id ? String(r.id).trim() : '';
    if (!cleanId || seenIds.has(cleanId) || /^(\+?62|08)\d+$/.test(cleanId)) {
      cleanId = `${prefix}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(cleanId);
    return { ...r, id: cleanId };
  });
};

export const getStoredStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) return sanitizeStudents(initialStudents);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? sanitizeStudents(parsed) : sanitizeStudents(initialStudents);
  } catch (e) {
    console.error('Failed reading students from storage', e);
    return sanitizeStudents(initialStudents);
  }
};

export const loadStudents = getStoredStudents;

export const saveStudents = (students: Student[]): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(sanitizeStudents(students)));
};

const DUMMY_TEACHER_NAMES = new Set([
  'Rini Astuti, S.Pd.SD',
  'Siti Aminah, S.Pd.',
  'Lilik Ernawati, S.Pd.SD',
  'Tri Handayani, S.Pd.',
  'Fitriyah, S.Pd.SD',
  'Agus Prasetyo, S.Pd.',
  'Bambang Setiawan, S.Pd.',
  'Sri Wahyuni, S.Pd.',
  'Dwi Rahmawati, S.Pd.',
  'Nurul Hidayati, S.Pd.',
  'Dra. Hj. Siti Zubaidah, M.Pd.',
  'Ahmad Budi Santoso, S.Pd.',
  'M. Fathur Rohman, S.Pd.I',
  'Eko Wahyudi, S.Pd.',
  'Yuliana Safitri, S.E.'
]);

const DUMMY_TEACHER_IDS = new Set([
  'TCH-199404162022032014', 'TCH-199508192023022017', 'TCH-199105122019022006',
  'TCH-198709232014032004', 'TCH-199203102020122011', 'TCH-198507142010011012',
  'TCH-198411052009021003', 'TCH-198901202019032008', 'TCH-199308252020122015',
  'TCH-198602182011012009', 'TCH-197003151994032001', 'TCH-198804122015021002',
  'TCH-198912042016011005', 'TCH-199108152019031010', 'TCH-TU-01'
]);

export const getStoredTeachers = (): Teacher[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) return sanitizeTeachers(initialTeachers);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return sanitizeTeachers(initialTeachers);
    const filtered = parsed.filter(t => !DUMMY_TEACHER_NAMES.has(t.name) && !DUMMY_TEACHER_IDS.has(t.id));
    if (filtered.length === 0) return sanitizeTeachers(initialTeachers);
    return sanitizeTeachers(filtered);
  } catch (e) {
    console.error('Failed reading teachers from storage', e);
    return sanitizeTeachers(initialTeachers);
  }
};

export const loadTeachers = getStoredTeachers;

export const saveTeachers = (teachers: Teacher[]): void => {
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify(sanitizeTeachers(teachers)));
};

export const getStoredPiketSchedules = (): PiketSchedule[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PIKET_SCHEDULES);
    if (!raw) return initialPiketSchedules;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return initialPiketSchedules;
    const cleaned = parsed.map(p => ({
      ...p,
      teacherIds: (p.teacherIds || []).filter((id: string) => !DUMMY_TEACHER_IDS.has(id))
    }));
    const totalAssignments = cleaned.reduce((sum, p) => sum + (p.teacherIds ? p.teacherIds.length : 0), 0);
    if (totalAssignments === 0 && initialPiketSchedules.length > 0) {
      return initialPiketSchedules;
    }
    return cleaned;
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
    return raw ? sanitizeRecords(JSON.parse(raw), 'VIOL') : [];
  } catch (e) {
    return [];
  }
};

export const loadViolations = getStoredViolations;

export const saveViolations = (records: ViolationRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify(sanitizeRecords(records, 'VIOL')));
};

export const getStoredRewards = (): RewardRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REWARDS);
    return raw ? sanitizeRecords(JSON.parse(raw), 'REW') : [];
  } catch (e) {
    return [];
  }
};

export const loadRewards = getStoredRewards;

export const saveRewards = (records: RewardRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify(sanitizeRecords(records, 'REW')));
};

export const getStoredCompensations = (): CompensationRecord[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPENSATIONS);
    return raw ? sanitizeRecords(JSON.parse(raw), 'COMP') : [];
  } catch (e) {
    return [];
  }
};

export const loadCompensations = getStoredCompensations;

export const saveCompensations = (records: CompensationRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.COMPENSATIONS, JSON.stringify(sanitizeRecords(records, 'COMP')));
};

export const getStoredSettings = (): SchoolSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const parsed = raw ? JSON.parse(raw) : initialSettings;

    let webhook = (parsed.googleSheetsWebhook || parsed.googleSheetsWebhookUrl || '').trim();
    // Auto-migrate if empty or if device stored an outdated/different Google Apps Script webhook
    if (!webhook || (webhook.includes('script.google.com/macros/s/') && webhook !== OFFICIAL_WEBHOOK_URL)) {
      webhook = OFFICIAL_WEBHOOK_URL;
    }

    const merged: SchoolSettings = {
      ...initialSettings,
      ...parsed,
      googleSheetsWebhook: webhook,
      googleSheetsWebhookUrl: webhook
    };

    // If local storage was holding a stale webhook, update it immediately
    if (parsed && (parsed.googleSheetsWebhook !== webhook || parsed.googleSheetsWebhookUrl !== webhook)) {
      try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(merged));
      } catch (_) {}
    }

    return merged;
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
    return raw === 'staff' || raw === 'public' ? raw : 'public';
  } catch (e) {
    return 'public';
  }
};

export const saveUserRole = (role: 'staff' | 'public'): void => {
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
};

export const resetAllToDefault = (): void => {
  localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.TEACHERS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.PIKET_SCHEDULES, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.VIOLATION_RULES, JSON.stringify(initialViolationRules));
  localStorage.setItem(STORAGE_KEYS.REWARD_RULES, JSON.stringify(initialRewardRules));
  localStorage.setItem(STORAGE_KEYS.VIOLATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.REWARDS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.COMPENSATIONS, JSON.stringify([]));
  localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(initialSettings));
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'public');
};

export const calculateStudentSummaries = (
  students: Student[],
  violations: ViolationRecord[],
  rewards: RewardRecord[],
  compensations: CompensationRecord[],
  activeAcademicYear?: string
): StudentScoreSummary[] => {
  return students.map(student => {
    const studentViolations = violations.filter(v => 
      v.studentId === student.id && 
      (!activeAcademicYear || !v.academicYear || v.academicYear === activeAcademicYear)
    );
    const studentRewards = rewards.filter(r => 
      r.studentId === student.id && 
      (!activeAcademicYear || !r.academicYear || r.academicYear === activeAcademicYear)
    );
    const studentCompensations = compensations.filter(
      c => c.studentId === student.id && 
      c.status === 'Disetujui' && 
      (!activeAcademicYear || !c.academicYear || c.academicYear === activeAcademicYear)
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
