import { Student, Teacher, PiketSchedule, ViolationRule, RewardRule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings, StudentScoreSummary } from '../types';
import { initialStudents, initialTeachers, initialPiketSchedules, initialViolationRules, initialRewardRules, initialViolations, initialRewards, initialCompensations, initialSettings, OFFICIAL_WEBHOOK_URL, STANDARD_PIKET_DUTY_NOTES } from '../data/initialData';

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
  if (s.nisn && s.nisn.length >= 8 && !['L', 'P', 'LK', 'PR'].includes(s.nisn.toUpperCase())) {
    initialStudentsByNisn.set(String(s.nisn).trim().toLowerCase(), s);
  }
  if (s.nik) initialStudentsByNik.set(String(s.nik).replace(/^'/, '').trim(), s);
  if (s.name) initialStudentsByName.set(String(s.name).trim().toLowerCase(), s);
});

export const normalizeRecordDate = (val: any): string => {
  if (!val) return new Date().toISOString().slice(0, 10);
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
};

export const isCorruptedNisn = (val: any): boolean => {
  if (!val) return true;
  const s = String(val).trim().toUpperCase();
  if (s === 'L' || s === 'P' || s === 'LK' || s === 'PR' || s === '-' || s.startsWith('NISN-') || s === 'UNDEFINED' || s === 'NULL') {
    return true;
  }
  const digits = s.replace(/[^0-9]/g, '');
  return digits.length < 8;
};

export const isCorruptedAccessCode = (code: any): boolean => {
  if (!code) return true;
  const c = String(code).trim().toUpperCase();
  return c === 'STL' || c === 'STP' || c === 'ST-L' || c === 'ST-P' || c === '-' || c === 'UNDEFINED';
};

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

    // Match with authentic record if available
    const authRecord = (rawName ? initialStudentsByName.get(rawName.toLowerCase()) : null) ||
                       (!isCorruptedNisn(rawNisn) ? initialStudentsByNisn.get(rawNisn.toLowerCase()) : null) ||
                       (rawNik ? initialStudentsByNik.get(rawNik) : null);

    // Guard NISN: If incoming NISN is corrupted (e.g. 'L' or 'P'), restore authentic 10-digit NISN
    let validNisn = rawNisn;
    if (isCorruptedNisn(rawNisn)) {
      validNisn = authRecord?.nisn || `00${idx + 10000000}`;
    }

    if (!cleanId || seenIds.has(cleanId) || /^(\+?62|08)\d+$/.test(cleanId) || cleanId.startsWith('STU-L-') || cleanId.startsWith('STU-P-') || cleanId === 'STD-L' || cleanId === 'STD-P' || cleanId.startsWith('student_')) {
      cleanId = authRecord?.id && !seenIds.has(authRecord.id) ? authRecord.id : `STU-${validNisn}-${idx}`;
    }
    seenIds.add(cleanId);

    // Guard PIN / accessCode: If incoming is corrupted (e.g. 'STL' or 'STP'), restore authentic PIN
    let cleanAccess = s.accessCode ? String(s.accessCode).replace(/^'/, '').trim().toUpperCase() : '';
    if (isCorruptedAccessCode(cleanAccess) || !cleanAccess) {
      if (authRecord?.accessCode && !isCorruptedAccessCode(authRecord.accessCode)) {
        cleanAccess = authRecord.accessCode;
      } else if (rawName) {
        const firstName = rawName.split(' ')[0] || 'SISWA';
        const cleanCls = rawClass.replace(/[^a-zA-Z0-9]/g, '');
        cleanAccess = (firstName + cleanCls).toUpperCase();
      }
    }

    // Validate parent name: if purely numeric, phone number, or invalid
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
      nik: (rawNik && rawNik !== '-' && rawNik.replace(/[^0-9]/g, '').length >= 10) ? rawNik : (authRecord?.nik || undefined),
      nisn: validNisn,
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

export const normalizeTeacherNameForMatching = (name: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/,\s*(s\.pd\.sd|s\.pd\.i|s\.pd|m\.pd|s\.ap|s\.psi|m\.m|m\.si|s\.kom|s\.ag|dr\.|drs\.|dra\.|h\.|hj\.)/gi, '')
    .replace(/\b(s\.pd\.sd|s\.pd\.i|s\.pd|m\.pd|s\.ap|s\.psi|m\.m|m\.si|s\.kom|s\.ag|dr\.|drs\.|dra\.|h\.|hj\.)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
};

export const getDayNameFromDate = (dateStr: string): 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu' | 'Minggu' => {
  if (!dateStr) return 'Senin';
  const d = new Date(dateStr + 'T00:00:00');
  const dayIndex = isNaN(d.getDay()) ? 1 : d.getDay();
  switch (dayIndex) {
    case 1: return 'Senin';
    case 2: return 'Selasa';
    case 3: return 'Rabu';
    case 4: return 'Kamis';
    case 5: return 'Jumat';
    case 6: return 'Sabtu';
    default: return 'Minggu';
  }
};

export const isTeacherRecorder = (
  teacher: Teacher,
  record: { reporterId?: string; reporterNip?: string; reporterName?: string }
): boolean => {
  if (!teacher || !record) return false;
  if (record.reporterId && record.reporterId === teacher.id) return true;

  const tDigits = String(teacher.nip || '').replace(/[^0-9]/g, '');
  const rDigits = String(record.reporterNip || '').replace(/[^0-9]/g, '');
  if (tDigits.length >= 8 && rDigits.length >= 8) {
    if (tDigits === rDigits || tDigits.includes(rDigits) || rDigits.includes(tDigits)) {
      return true;
    }
  }

  const cleanRepName = (record.reporterName || '').trim();
  if (cleanRepName && cleanRepName.toLowerCase() === teacher.name.trim().toLowerCase()) {
    return true;
  }

  const normTeacher = normalizeTeacherNameForMatching(teacher.name);
  const normRecord = normalizeTeacherNameForMatching(cleanRepName);
  if (normTeacher && normRecord) {
    if (normTeacher === normRecord) return true;
    if (normTeacher.length >= 4 && normRecord.length >= 4 && (normTeacher.includes(normRecord) || normRecord.includes(normTeacher))) {
      return true;
    }
  }

  return false;
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

export const sanitizePiketSchedules = (
  schedules: PiketSchedule[] = [],
  teachersList: Teacher[] = []
): PiketSchedule[] => {
  const DAYS: Array<'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu'> = [
    'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'
  ];

  const safeTeachers = Array.isArray(teachersList) && teachersList.length > 0
    ? teachersList
    : initialTeachers;

  const matchTeacher = (rawId: string): Teacher | undefined => {
    if (!rawId) return undefined;
    const cleanRaw = String(rawId).trim();
    // 1. Direct ID match
    const byId = safeTeachers.find(t => t.id === cleanRaw);
    if (byId) return byId;

    // 2. NIP match (ignoring non-digits)
    const rawDigits = cleanRaw.replace(/[^0-9]/g, '');
    if (rawDigits.length >= 8) {
      const byNip = safeTeachers.find(t => {
        const tDigits = String(t.nip || '').replace(/[^0-9]/g, '');
        return tDigits.length >= 8 && (tDigits === rawDigits || tDigits.includes(rawDigits) || rawDigits.includes(tDigits));
      });
      if (byNip) return byNip;
    }

    // 3. Name matching
    const normRaw = normalizeTeacherNameForMatching(cleanRaw);
    if (normRaw && normRaw.length >= 3) {
      const byName = safeTeachers.find(t => {
        const normName = normalizeTeacherNameForMatching(t.name);
        return normName === normRaw || (normName.length >= 4 && (normName.includes(normRaw) || normRaw.includes(normName)));
      });
      if (byName) return byName;
    }

    return undefined;
  };

  const existingMap = new Map<string, PiketSchedule>();
  if (Array.isArray(schedules)) {
    schedules.forEach(s => {
      if (s && s.day) existingMap.set(s.day, s);
    });
  }

  // Build resolved schedules for all 6 days
  const resolved = DAYS.map((day, dIdx) => {
    const existing = existingMap.get(day);
    const resolvedTeacherIds: string[] = [];
    const seen = new Set<string>();

    if (existing && Array.isArray(existing.teacherIds)) {
      existing.teacherIds.forEach(id => {
        const matched = matchTeacher(id);
        if (matched && !seen.has(matched.id)) {
          seen.add(matched.id);
          resolvedTeacherIds.push(matched.id);
        }
      });
    }

    return {
      day,
      teacherIds: resolvedTeacherIds,
      dutyHours: existing?.dutyHours || (day === 'Jumat' ? '06.30 - 14.00 WIB' : day === 'Sabtu' ? '06.30 - 13.00 WIB' : '06.30 - 15.00 WIB'),
      notes: existing?.notes || STANDARD_PIKET_DUTY_NOTES
    };
  });

  // Check if schedules need auto-populating (e.g. if all or most days have 0 teachers because of old demo IDs)
  const totalAssigned = resolved.reduce((acc, s) => acc + s.teacherIds.length, 0);
  if (totalAssigned === 0 && safeTeachers.length > 0) {
    // Distribute teachers evenly across the 6 days
    safeTeachers.forEach((t, tIdx) => {
      const dayIdx = tIdx % 6;
      if (!resolved[dayIdx].teacherIds.includes(t.id)) {
        resolved[dayIdx].teacherIds.push(t.id);
      }
    });
  }

  return resolved;
};

export const sanitizeRecords = <T extends { id: string }>(records: T[], prefix: string): T[] => {
  const seenIds = new Set<string>();
  return (records || []).map((r, idx) => {
    let cleanId = r.id ? String(r.id).trim() : '';
    if (!cleanId || seenIds.has(cleanId) || /^(\+?62|08)\d+$/.test(cleanId)) {
      cleanId = `${prefix}-${idx}-${Math.random().toString(36).substring(2, 6)}`;
    }
    seenIds.add(cleanId);
    
    // Normalize date if present
    const itemWithCleanDate = (r as any).date 
      ? { ...r, id: cleanId, date: normalizeRecordDate((r as any).date) }
      : { ...r, id: cleanId };

    return itemWithCleanDate as T;
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

export const getStoredTeachers = (): Teacher[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHERS);
    if (!raw) return sanitizeTeachers(initialTeachers);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return sanitizeTeachers(initialTeachers);
    return sanitizeTeachers(parsed);
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
    const teachers = getStoredTeachers();
    if (!raw) return sanitizePiketSchedules(initialPiketSchedules, teachers);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return sanitizePiketSchedules(initialPiketSchedules, teachers);
    return sanitizePiketSchedules(parsed, teachers);
  } catch (e) {
    console.error('Failed reading piket schedules from storage', e);
    return sanitizePiketSchedules(initialPiketSchedules, getStoredTeachers());
  }
};

export const loadPiketSchedules = getStoredPiketSchedules;

export const savePiketSchedules = (schedules: PiketSchedule[]): void => {
  const teachers = getStoredTeachers();
  localStorage.setItem(STORAGE_KEYS.PIKET_SCHEDULES, JSON.stringify(sanitizePiketSchedules(schedules, teachers)));
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
    const sId = student.id;
    const sNisn = student.nisn ? String(student.nisn).trim().toLowerCase() : '';
    const sName = student.name ? student.name.toLowerCase().replace(/\s+/g, ' ').trim() : '';

    const studentViolations = violations.filter(v => {
      const vId = v.studentId;
      const vNisn = (v as any).studentNisn ? String((v as any).studentNisn).trim().toLowerCase() : '';
      const vName = v.studentName ? String(v.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';
      
      const isMatch = (vId && vId === sId) ||
                      (sNisn && vNisn && sNisn === vNisn && sNisn.length >= 8 && !['l','p','lk','pr'].includes(sNisn)) ||
                      (sName && vName && sName === vName);
      const isYearMatch = !activeAcademicYear || !v.academicYear || v.academicYear === activeAcademicYear;
      return isMatch && isYearMatch;
    });

    const studentRewards = rewards.filter(r => {
      const rId = r.studentId;
      const rNisn = (r as any).studentNisn ? String((r as any).studentNisn).trim().toLowerCase() : '';
      const rName = r.studentName ? String(r.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';

      const isMatch = (rId && rId === sId) ||
                      (sNisn && rNisn && sNisn === rNisn && sNisn.length >= 8 && !['l','p','lk','pr'].includes(sNisn)) ||
                      (sName && rName && sName === rName);
      const isYearMatch = !activeAcademicYear || !r.academicYear || r.academicYear === activeAcademicYear;
      return isMatch && isYearMatch;
    });

    const studentCompensations = compensations.filter(c => {
      const cId = c.studentId;
      const cNisn = (c as any).studentNisn ? String((c as any).studentNisn).trim().toLowerCase() : '';
      const cName = c.studentName ? String(c.studentName).toLowerCase().replace(/\s+/g, ' ').trim() : '';

      const isMatch = (cId && cId === sId) ||
                      (sNisn && cNisn && sNisn === cNisn && sNisn.length >= 8 && !['l','p','lk','pr'].includes(sNisn)) ||
                      (sName && cName && sName === cName);
      const isYearMatch = !activeAcademicYear || !c.academicYear || c.academicYear === activeAcademicYear;
      const isApproved = !c.status || c.status === 'Disetujui' || (c as any).status === 'selesai' || (c as any).status === 'approved';
      return isMatch && isYearMatch && isApproved;
    });

    const totalViolationPoints = studentViolations.reduce((sum, v) => sum + (Number(v.points) || 0), 0);
    const totalRewardPoints = studentRewards.reduce((sum, r) => sum + (Number(r.points) || 0), 0);
    const totalCompensationPoints = studentCompensations.reduce((sum, c) => sum + (Number((c as any).deductedPoints || (c as any).pointsReduced || (c as any).points || 0) || 0), 0);

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
