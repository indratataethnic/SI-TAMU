import * as XLSX from 'xlsx';
import { Student, ViolationRecord, RewardRecord, StudentScoreSummary } from '../types';

export const downloadStudentTemplate = () => {
  const templateData = [
    {
      'NIK (16 Digit)': '3515011204120001',
      'NISN': '0089123410',
      'Nama Siswa': 'Contoh Siswa Baru',
      'Kelas': 'Kelas 1',
      'Jenis Kelamin (L/P)': 'L',
      'Nama Orang Tua / Wali': 'Nama Bapak/Ibu',
      'No WhatsApp Orang Tua': '081234567890',
      'Alamat': 'Jl. Contoh Alamat No. 1'
    },
    {
      'NIK (16 Digit)': '3515015508120002',
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
      'NIK (16 Digit)': s.nik || '-',
      'NISN': s.nisn,
      'Nama Siswa': s.name,
      'Kelas': s.class,
      'Jenis Kelamin (L/P)': s.gender,
      'Nama Orang Tua / Wali': s.parentName || '-',
      'No WhatsApp Orang Tua': s.parentPhone || '-',
      'Alamat Rumah': s.parentAddress || '-',
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
        
        // Convert worksheet to 2D array matrix to support sheets with title rows
        const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

        if (!rows || rows.length === 0) {
          throw new Error('File excel kosong atau format tidak sesuai.');
        }

        // Search first 10 rows to detect the actual header row
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 10); i++) {
          const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase().trim()).join(' ');
          if (rowStr.includes('nik') || rowStr.includes('nisn') || rowStr.includes('nama') || rowStr.includes('kelas') || rowStr.includes('rombel')) {
            headerRowIdx = i;
            break;
          }
        }

        let colNik = -1, colNisn = -1, colName = -1, colClass = -1, colGender = -1, colParentName = -1, colParentPhone = -1, colParentAddress = -1, colAccessCode = -1;

        if (headerRowIdx !== -1) {
          const headers = (rows[headerRowIdx] || []).map(c => String(c || '').toLowerCase().trim());
          headers.forEach((h, idx) => {
            if (!h) return;
            if (h === 'nik' || (h.includes('nik') && !h.includes('teknik'))) colNik = idx;
            else if (h.includes('nisn') || h === 'nis' || h.includes('no induk') || h.includes('induk')) colNisn = idx;
            else if ((h.includes('nama siswa') || h === 'nama' || h.includes('nama lengkap') || h.includes('peserta didik') || h.includes('murid')) && !h.includes('wali') && !h.includes('orang') && !h.includes('guru') && !h.includes('ortu') && !h.includes('ayah') && !h.includes('ibu')) colName = idx;
            else if (h.includes('kelas') || h.includes('rombel') || h.includes('rombongan')) colClass = idx;
            else if (h.includes('kelamin') || h.includes('gender') || h === 'l/p' || h === 'jk') colGender = idx;
            else if (h.includes('orang tua') || h.includes('wali') || h.includes('ortu') || h.includes('ayah') || h.includes('ibu')) colParentName = idx;
            else if (h.includes('hp') || h.includes('wa') || h.includes('telepon') || h.includes('whatsapp') || h.includes('kontak')) colParentPhone = idx;
            else if (h.includes('alamat') || h.includes('domisili')) colParentAddress = idx;
            else if (h.includes('kode') || h.includes('akses') || h.includes('pin')) colAccessCode = idx;
          });
        }

        // Default fallbacks if no header row was explicitly detected
        if (colNik === -1) colNik = 0;
        if (colNisn === -1) colNisn = 1;
        if (colName === -1) colName = 2;
        if (colClass === -1) colClass = 3;
        if (colGender === -1) colGender = 4;
        if (colParentName === -1) colParentName = 5;
        if (colParentPhone === -1) colParentPhone = 6;
        if (colParentAddress === -1) colParentAddress = 7;

        const dataRows = headerRowIdx !== -1 ? rows.slice(headerRowIdx + 1) : rows;
        const parsedStudents: Student[] = [];

        dataRows.forEach((row, index) => {
          if (!row || row.length === 0) return;

          const nikRaw = colNik !== -1 && row[colNik] !== undefined ? String(row[colNik]).replace(/^'/, '').trim() : '';
          const nisnRaw = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : '';
          const nameRaw = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : '';

          // Skip header re-declarations or empty rows
          if (!nisnRaw && !nameRaw && !nikRaw) return;
          if (nameRaw.toLowerCase().includes('nama siswa') || nameRaw.toLowerCase().includes('nama lengkap')) return;

          const studentClass = colClass !== -1 && row[colClass] !== undefined ? String(row[colClass]).trim() : 'Kelas 1';
          const genderRaw = colGender !== -1 && row[colGender] !== undefined ? String(row[colGender]).trim().toUpperCase() : 'L';
          const gender = genderRaw.startsWith('P') ? 'P' : 'L';
          const parentName = colParentName !== -1 && row[colParentName] !== undefined ? String(row[colParentName]).trim() : '';
          const parentPhone = colParentPhone !== -1 && row[colParentPhone] !== undefined ? String(row[colParentPhone]).replace(/[^0-9]/g, '') : '';
          const parentAddress = colParentAddress !== -1 && row[colParentAddress] !== undefined ? String(row[colParentAddress]).trim() : '';
          let accessCode = colAccessCode !== -1 && row[colAccessCode] !== undefined ? String(row[colAccessCode]).trim() : '';

          if (!accessCode && nameRaw) {
            const firstName = nameRaw.split(' ')[0] || 'SISWA';
            const cleanClass = studentClass.replace(/[^a-zA-Z0-9]/g, '');
            accessCode = `${firstName.toUpperCase()}${cleanClass}`;
          }

          parsedStudents.push({
            id: `STU-IMP-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            nisn: nisnRaw || `NISN-${Date.now()}-${index}`,
            nik: nikRaw !== '-' && nikRaw ? nikRaw : undefined,
            name: nameRaw || `Siswa ${index + 1}`,
            class: studentClass || 'Kelas 1',
            gender,
            parentName: parentName || '',
            parentPhone: parentPhone || '',
            parentAddress,
            accessCode,
            createdAt: new Date().toISOString().slice(0, 10)
          });
        });

        if (parsedStudents.length === 0) {
          throw new Error('Tidak ada data siswa yang valid ditemukan dalam file Excel.');
        }

        resolve(parsedStudents);
      } catch (err: any) {
        reject(new Error(err?.message || 'Gagal membaca file Excel.'));
      }
    };

    reader.onerror = () => reject(new Error('Gagal membuka file.'));
    reader.readAsArrayBuffer(file);
  });
};
