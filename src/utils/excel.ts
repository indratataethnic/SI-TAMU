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

        // Search first 15 rows to detect the actual header row
        let headerRowIdx = -1;
        for (let i = 0; i < Math.min(rows.length, 15); i++) {
          const rowStr = (rows[i] || []).map(c => String(c || '').toLowerCase().trim()).join(' ');
          if (rowStr.includes('nik') || rowStr.includes('nisn') || rowStr.includes('nama') || rowStr.includes('kelas') || rowStr.includes('rombel') || rowStr.includes('siswa') || rowStr.includes('peserta didik')) {
            headerRowIdx = i;
            break;
          }
        }

        let colNo = -1;
        let colNik = -1;
        let colNisn = -1;
        let colName = -1;
        let colClass = -1;
        let colGender = -1;
        let colParentName = -1;
        let colAyah = -1;
        let colIbu = -1;
        let colWali = -1;
        let colParentPhone = -1;
        let colParentAddress = -1;
        let colAccessCode = -1;

        if (headerRowIdx !== -1) {
          const headers = (rows[headerRowIdx] || []).map(c => String(c || '').toLowerCase().trim());
          
          headers.forEach((h, idx) => {
            if (!h) return;

            // 1. Sequence Number Column (No / No. / No Urut)
            if (h === 'no' || h === 'no.' || h === 'nomor' || h === 'no urut' || h === 'no_urut' || h === 'nomor urut' || h === '#') {
              colNo = idx;
            }
            // 2. Phone / WhatsApp Number Column (MUST be checked before Parent Name to avoid "No HP Orang Tua" being caught as name)
            else if (
              h.includes('hp') ||
              h.includes('wa') ||
              h.includes('telepon') ||
              h.includes('telp') ||
              h.includes('whatsapp') ||
              h.includes('ponsel') ||
              h.includes('handphone') ||
              h.includes('kontak') ||
              h.includes('seluler') ||
              h.includes('phone') ||
              h.includes('mobile')
            ) {
              colParentPhone = idx;
            }
            // 3. NIK (16 digit)
            else if (h === 'nik' || h.includes('16 digit') || h.includes('no ktp') || h.includes('nomor ktp') || (h.includes('nik') && !h.includes('teknik'))) {
              colNik = idx;
            }
            // 4. NISN / NIS / No Induk
            else if (h.includes('nisn') || h === 'nis' || h.includes('no induk') || h.includes('no. induk') || h.includes('nomor induk') || h.includes('induk')) {
              colNisn = idx;
            }
            // 5. Gender (L/P)
            else if (h.includes('kelamin') || h.includes('gender') || h === 'l/p' || h === 'jk' || h === 'sex' || h === 'l / p' || h === 'jenis_kelamin') {
              colGender = idx;
            }
            // 6. Class / Rombel
            else if (h.includes('kelas') || h.includes('rombel') || h.includes('rombongan') || h.includes('tingkat') || h === 'grade' || h === 'class') {
              colClass = idx;
            }
            // 7. Student Name (Explicitly exclude parent/guardian/teacher terms)
            else if (
              (h.includes('nama siswa') ||
                h === 'nama' ||
                h.includes('nama lengkap') ||
                h.includes('peserta didik') ||
                h.includes('nama murid') ||
                h.includes('nama anak') ||
                h.includes('nama_siswa') ||
                h.includes('nama_lengkap') ||
                h.includes('nama peserta didik')) &&
              !h.includes('wali') &&
              !h.includes('orang') &&
              !h.includes('ortu') &&
              !h.includes('ayah') &&
              !h.includes('ibu') &&
              !h.includes('bapak') &&
              !h.includes('guru')
            ) {
              colName = idx;
            }
            // 8. Specific Parent / Guardian Name Columns (Dapodik / EMIS / Custom)
            else if (h.includes('nama ayah') || h.includes('nama_ayah') || h === 'ayah' || h === 'nama bapak' || h === 'bapak') {
              colAyah = idx;
            } else if (h.includes('nama ibu') || h.includes('nama_ibu') || h.includes('ibu kandung') || h === 'ibu' || h === 'mama') {
              colIbu = idx;
            } else if (h.includes('nama wali') || h.includes('nama_wali') || h === 'wali' || h === 'wali murid') {
              colWali = idx;
            } else if (
              h.includes('orang tua') ||
              h.includes('orangtua') ||
              h.includes('wali') ||
              h.includes('ortu') ||
              h.includes('nama ortu') ||
              h.includes('nama orang tua') ||
              h.includes('orang tua / wali') ||
              h.includes('orang tua/wali') ||
              h.includes('parent') ||
              h.includes('guardian')
            ) {
              colParentName = idx;
            }
            // 9. Address
            else if (h.includes('alamat') || h.includes('domisili') || h.includes('tempat tinggal') || h.includes('address') || h.includes('jalan') || h.includes('dusun') || h.includes('desa')) {
              colParentAddress = idx;
            }
            // 10. Access Code / PIN
            else if (h.includes('kode') || h.includes('akses') || h.includes('pin') || h.includes('password')) {
              colAccessCode = idx;
            }
          });
        }

        const dataRows = headerRowIdx !== -1 ? rows.slice(headerRowIdx + 1) : rows;

        // Heuristic analysis on sample data rows if key columns are still unassigned
        if (dataRows.length > 0) {
          const sampleRows = dataRows.slice(0, Math.min(6, dataRows.length));
          const maxCols = Math.max(...sampleRows.map(r => (r ? r.length : 0)));

          for (let col = 0; col < maxCols; col++) {
            if (col === colNo) continue;

            const values = sampleRows.map(r => String(r[col] || '').trim()).filter(Boolean);
            if (values.length === 0) continue;

            // Check if 16-digit NIK pattern
            if (colNik === -1 && values.every(v => /^\d{16}$/.test(v.replace(/[^0-9]/g, '')))) {
              colNik = col;
              continue;
            }

            // Check if 8-10 digit NISN pattern
            if (colNisn === -1 && values.every(v => /^\d{8,10}$/.test(v.replace(/[^0-9]/g, '')))) {
              colNisn = col;
              continue;
            }

            // Check if Gender pattern (L, P, Laki-laki, Perempuan)
            if (colGender === -1 && values.every(v => /^(l|p|laki|perempuan|pria|wanita)$/i.test(v.trim()))) {
              colGender = col;
              continue;
            }

            // Check if Phone pattern (starts with 08 or 62 or +62, 9-15 digits)
            if (colParentPhone === -1 && values.some(v => /^(\+?62|08|8)\d{8,13}$/.test(v.replace(/[^0-9+]/g, '')))) {
              colParentPhone = col;
              continue;
            }

            // Check if Class pattern
            if (colClass === -1 && values.some(v => /(kelas|rombel|[1-6]\s*[a-fA-F]?|[ivxIVX]+)/i.test(v))) {
              colClass = col;
              continue;
            }
          }
        }

        // Safe Fallbacks for Student Name if still undetected
        if (colName === -1) {
          for (let col = 0; col < 8; col++) {
            if (
              col !== colNo &&
              col !== colNik &&
              col !== colNisn &&
              col !== colClass &&
              col !== colGender &&
              col !== colParentPhone &&
              col !== colParentAddress
            ) {
              colName = col;
              break;
            }
          }
        }

        // Safe Fallbacks for Parent Name if still undetected
        if (colParentName === -1 && colAyah === -1 && colIbu === -1 && colWali === -1) {
          for (let col = 0; col < 12; col++) {
            if (
              col !== colNo &&
              col !== colNik &&
              col !== colNisn &&
              col !== colName &&
              col !== colClass &&
              col !== colGender &&
              col !== colParentPhone &&
              col !== colParentAddress &&
              col !== colAccessCode
            ) {
              colParentName = col;
              break;
            }
          }
        }

        const parsedStudents: Student[] = [];

        dataRows.forEach((row, index) => {
          if (!row || row.length === 0) return;

          const nikRaw = colNik !== -1 && row[colNik] !== undefined ? String(row[colNik]).replace(/^'/, '').trim() : '';
          const nisnRaw = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : '';
          const nameRaw = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : '';

          // Skip header re-declarations or completely empty rows
          if (!nisnRaw && !nameRaw && !nikRaw) return;
          if (nameRaw.toLowerCase().includes('nama siswa') || nameRaw.toLowerCase().includes('nama lengkap') || nameRaw.toLowerCase() === 'nama') return;

          const studentClass = colClass !== -1 && row[colClass] !== undefined ? String(row[colClass]).trim() : 'Kelas 1';
          const genderRaw = colGender !== -1 && row[colGender] !== undefined ? String(row[colGender]).trim().toUpperCase() : 'L';
          const gender = genderRaw.startsWith('P') || genderRaw.includes('PEREMPUAN') || genderRaw.includes('WANITA') ? 'P' : 'L';

          // Extract Parent Name smartly across unified or individual (Ayah/Ibu/Wali) columns
          let parentName = '';
          if (colParentName !== -1 && row[colParentName] !== undefined && String(row[colParentName]).trim()) {
            parentName = String(row[colParentName]).trim();
          } else if (colAyah !== -1 && row[colAyah] !== undefined && String(row[colAyah]).trim() && String(row[colAyah]).trim() !== '-') {
            parentName = String(row[colAyah]).trim();
          } else if (colIbu !== -1 && row[colIbu] !== undefined && String(row[colIbu]).trim() && String(row[colIbu]).trim() !== '-') {
            parentName = String(row[colIbu]).trim();
          } else if (colWali !== -1 && row[colWali] !== undefined && String(row[colWali]).trim() && String(row[colWali]).trim() !== '-') {
            parentName = String(row[colWali]).trim();
          }

          // Clean parent phone
          let parentPhone = colParentPhone !== -1 && row[colParentPhone] !== undefined ? String(row[colParentPhone]).replace(/^'/, '').replace(/[^0-9+]/g, '').trim() : '';
          if (parentPhone.startsWith('8') && parentPhone.length >= 9 && parentPhone.length <= 13) {
            parentPhone = '0' + parentPhone;
          }

          let cleanNisn = nisnRaw;
          if (/^\d{9}$/.test(cleanNisn)) {
            cleanNisn = '0' + cleanNisn;
          }

          const parentAddress = colParentAddress !== -1 && row[colParentAddress] !== undefined ? String(row[colParentAddress]).trim() : '';
          let accessCode = colAccessCode !== -1 && row[colAccessCode] !== undefined ? String(row[colAccessCode]).replace(/^'/, '').trim() : '';

          if (!accessCode && nameRaw) {
            const firstName = nameRaw.split(' ')[0] || 'SISWA';
            const cleanClass = studentClass.replace(/[^a-zA-Z0-9]/g, '');
            accessCode = `${firstName.toUpperCase()}${cleanClass}`;
          }

          parsedStudents.push({
            id: `STU-IMP-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 7)}`,
            nisn: cleanNisn || `NISN-${Date.now()}-${index}`,
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
