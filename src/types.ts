export type UserRole = 'public' | 'staff';

export type ViolationCategoryType = 'berat' | 'sedang' | 'ringan' | 'khusus';

export interface Student {
  id: string;
  nisn: string;
  nik?: string;
  name: string;
  class: string;
  gender: 'L' | 'P';
  parentName: string;
  parentPhone: string;
  parentAddress?: string;
  accessCode?: string; // Pin for parent private lookup
  avatar?: string;
  academicYear?: string; // e.g. "2026/2027"
  createdAt: string;
}

export interface Teacher {
  id: string;
  nip: string;
  name: string;
  role: 'guru_mapel' | 'wali_kelas' | 'guru_bk' | 'guru_piket' | 'pembina_osis' | 'kepala_sekolah';
  subject?: string;
  classAssigned?: string;
  phone?: string;
  avatar?: string;
}

export type DayOfWeek = 'Senin' | 'Selasa' | 'Rabu' | 'Kamis' | 'Jumat' | 'Sabtu';

export interface PiketSchedule {
  day: DayOfWeek;
  teacherIds: string[];
  notes?: string;
  dutyHours?: string;
}

export interface ViolationRule {
  id: string;
  code: string;
  category: ViolationCategoryType;
  name: string;
  points: number;
  description?: string;
}

export interface RewardRule {
  id: string;
  code: string;
  name: string;
  level: 'Nasional' | 'Provinsi' | 'Kota/Kab' | 'Sekolah' | 'Umum';
  rank: 'Juara I' | 'Juara II' | 'Juara III' | 'Peserta Lomba' | 'Apresiasi Khusus';
  points: number;
  description?: string;
}

export interface ViolationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  ruleId: string;
  ruleName: string;
  category: ViolationCategoryType;
  points: number;
  date: string; // YYYY-MM-DD
  time?: string;
  location?: string;
  reporterName: string; // Guru pencatat / saksi
  description: string;
  evidenceNote?: string;
  whatsappSent?: boolean;
  academicYear?: string; // e.g. "2026/2027"
  createdAt: string;
}

export interface RewardRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  ruleId: string;
  ruleName: string;
  rank: string;
  level: string;
  points: number;
  date: string;
  competitionName: string;
  organizer?: string;
  certificateNumber?: string;
  reporterName: string;
  notes?: string;
  whatsappSent?: boolean;
  academicYear?: string; // e.g. "2026/2027"
  createdAt: string;
}

export interface CompensationRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentClass: string;
  taskName: string; // e.g. "Kerja Bakti Perpustakaan & Resume Buku 5 Judul"
  deductedPoints: number; // e.g. 15
  date: string;
  supervisorName: string; // Guru BK / Wali Kelas pembina
  status: 'Disetujui' | 'Sedang Berjalan' | 'Ditolak';
  notes?: string;
  academicYear?: string; // e.g. "2026/2027"
  createdAt: string;
}

export interface SchoolSettings {
  schoolName: string;
  schoolSubtitle: string;
  schoolAddress: string;
  schoolPhone: string;
  schoolEmail: string;
  schoolWebsite: string;
  principalName: string;
  principalNip: string;
  bkCoordinatorName: string;
  bkCoordinatorNip: string;
  bkCoordinatorPhone?: string;
  staffPin: string; // default "1234"
  adminPin?: string;
  googleSheetsUrl: string;
  googleSheetsWebhook: string;
  googleSheetsWebhookUrl?: string;
  waGatewayApiKey: string;
  waGatewayDevice: string;
  letterNumberPrefix: string;
  academicYear?: string; // e.g. "2026/2027"
}

export interface StudentScoreSummary {
  student: Student;
  totalViolationPoints: number;
  totalRewardPoints: number;
  totalCompensationPoints: number;
  activeViolationPoints: number; // totalViolationPoints - totalCompensationPoints
  statusLevel: 'normal' | 'peringatan' | 'skorsing' | 'pembinaan_rumah';
  statusText: string;
  statusColor: string;
  statusBadge: string;
  violationsCount: number;
  rewardsCount: number;
  compensationsCount: number;
}
