import * as XLSX from 'xlsx';
import { Student, ViolationRecord, RewardRecord, StudentScoreSummary } from '../types';

export const downloadStudentTemplate = () => {
  const templateData = [
    {
      'NISN': '0089123410',
      'Nama Siswa': 'Contoh Siswa Baru',
      'Kelas': 'Kelas 1',
      'Jenis Kelamin (L/P)': 'L',
      'Nama Orang Tua / Wali': 'Nama Bapak/Ibu',
      'No WhatsApp Orang Tua': '081234567890',
      'Alamat': 'Jl. Contoh Alamat No. 1'
    },
    {
      'NISN': '0089123411',
      'Nama Siswa': 'Contoh Siswi Baru',
      'Kelas': 'Kelas 2',
      'Jenis Kelamin (L/P)': 'P',
      'Nama Orang Tua / Wali': 'Nama Ibu/Bapak',
      'No WhatsApp Orang Tua': '085233445566',
      'Alamat': 'Jl. Mawar No. 4'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
  XLSX.writeFile(wb, 'Template_Import_Siswa_SITAMU.xlsx');
};

export const exportStudentsToExcel = (students: Student[], summaries: StudentScoreSummary[]) => {
  const summaryMap = new Map(summaries.map(s => [s.student.id, s]));

  const rows = students.map((s, index) => {
    const sum = summaryMap.get(s.id);
    return {
      'No': index + 1,
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Kelas': s.class,
      'L/P': s.gender,
      'Nama Orang Tua': s.parentName,
      'No. WhatsApp Ortu': s.parentPhone,
      'Alamat': s.parentAddress || '-',
      'Poin Pelanggaran': sum?.totalViolationPoints || 0,
      'Poin Kompensasi': sum?.totalCompensationPoints || 0,
      'Poin Aktif': sum?.activeViolationPoints || 0,
      'Poin Reward/Prestasi': sum?.totalRewardPoints || 0,
      'Status Ketertiban': sum?.statusText || 'Normal',
      'Kode Akses Wali Murid': s.accessCode || '-'
    };
  });

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
  XLSX.writeFile(wb, `Data_Siswa_SITAMU_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportViolationsToExcel = (violations: ViolationRecord[]) => {
  const rows = violations.map((v, idx) => ({
    'No': idx + 1,
    'Tanggal': v.date,
    'Waktu': v.time || '-',
    'Nama Siswa': v.studentName,
    'Kelas': v.studentClass,
    'Kategori': v.category.toUpperCase(),
    'Jenis Pelanggaran': v.ruleName,
    'Bobot Poin': v.points,
    'Lokasi Kejadian': v.location || '-',
    'Guru Pencatat / Saksi': v.reporterName,
    'Catatan / Kronologi': v.description,
    'Status Notifikasi WA': v.whatsappSent ? 'Terkirim' : 'Belum Terkirim'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Pelanggaran');
  XLSX.writeFile(wb, `Rekap_Pelanggaran_SITAMU_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportRewardsToExcel = (rewards: RewardRecord[]) => {
  const rows = rewards.map((r, idx) => ({
    'No': idx + 1,
    'Tanggal': r.date,
    'Nama Siswa': r.studentName,
    'Kelas': r.studentClass,
    'Capaian / Peringkat': r.rank,
    'Tingkat': r.level,
    'Nama Kejuaraan / Prestasi': r.competitionName,
    'Penyelenggara': r.organizer || '-',
    'Bobot Poin': r.points,
    'No. Sertifikat / Piagam': r.certificateNumber || '-',
    'Guru Pembina / Pelapor': r.reporterName,
    'Catatan': r.notes || '-'
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Reward');
  XLSX.writeFile(wb, `Rekap_Prestasi_Reward_SITAMU_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportPenghitunganToExcel = (summaries: StudentScoreSummary[]) => {
  const rows = summaries.map((s, idx) => ({
    'No': idx + 1,
    'NISN': s.student.nisn,
    'Nama Siswa': s.student.name,
    'Kelas': s.student.class,
    'Total Poin Pelanggaran': s.totalViolationPoints,
    'Poin Kompensasi (Pengurangan)': s.totalCompensationPoints,
    'Poin Pelanggaran Aktif': s.activeViolationPoints,
    'Total Poin Reward (Prestasi)': s.totalRewardPoints,
    'Tingkat Status': s.statusBadge,
    'Tindakan Sekolah': s.statusText,
    'No WhatsApp Ortu': s.student.parentPhone
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Penghitungan_Poin');
  XLSX.writeFile(wb, `Rekap_Penghitungan_Poin_SITAMU_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const importStudentsFromExcel = async (file: File): Promise<Student[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rawJson: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (!rawJson || rawJson.length === 0) {
          throw new Error('File excel kosong atau format tidak sesuai.');
        }

        const parsedStudents: Student[] = rawJson.map((row, index) => {
          // Normalize column names
          const nisn = String(row['NISN'] || row['nisn'] || row['No Induk'] || `NISN-${Date.now()}-${index}`);
          const name = String(row['Nama Siswa'] || row['Nama'] || row['nama'] || `Siswa ${index + 1}`).trim();
          const studentClass = String(row['Kelas'] || row['kelas'] || 'VII-A').trim();
          const genderRaw = String(row['Jenis Kelamin (L/P)'] || row['Jenis Kelamin'] || row['L/P'] || row['gender'] || 'L').toUpperCase();
          const gender = genderRaw.startsWith('P') ? 'P' : 'L';
          const parentName = String(row['Nama Orang Tua / Wali'] || row['Nama Orang Tua'] || row['Orang Tua'] || '-').trim();
          const parentPhone = String(row['No WhatsApp Orang Tua'] || row['No WhatsApp'] || row['No HP'] || row['Telepon'] || '').replace(/[^0-9]/g, '');
          const parentAddress = String(row['Alamat'] || row['alamat'] || '').trim();

          const firstName = name.split(' ')[0] || 'SISWA';
          const cleanClass = studentClass.replace(/[^a-zA-Z0-9]/g, '');
          const accessCode = `${firstName.toUpperCase()}${cleanClass}`;

          return {
            id: `STU-IMP-${Date.now()}-${index}`,
            nisn,
            name,
            class: studentClass,
            gender,
            parentName: parentName || 'Orang Tua Murid',
            parentPhone: parentPhone || '081234567890',
            parentAddress,
            accessCode,
            createdAt: new Date().toISOString().slice(0, 10)
          };
        });

        resolve(parsedStudents);
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca file Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membuka file.'));
    reader.readAsArrayBuffer(file);
  });
};
