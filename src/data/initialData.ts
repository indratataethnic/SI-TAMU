import { ViolationRule, RewardRule, Student, Teacher, PiketSchedule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings } from '../types';

export const initialTeachers: Teacher[] = [
  {
    id: 'TCH-001',
    nip: '197504122000031002',
    name: 'Drs. H. Mulyadi, M.Pd.',
    role: 'kepala_sekolah',
    subject: 'Manajemen Pendidikan',
    phone: '081234567001'
  },
  {
    id: 'TCH-002',
    nip: '198207152008012007',
    name: 'Ratna Dewi Kusuma, S.Psi., M.Pd.',
    role: 'guru_bk',
    subject: 'Bimbingan Konseling',
    phone: '081234567002'
  },
  {
    id: 'TCH-003',
    nip: '198501152010011005',
    name: 'Indartha Meiputra, S.Pd.',
    role: 'wali_kelas',
    classAssigned: 'Kelas 6',
    subject: 'Guru Kelas 6',
    phone: '081234567003'
  },
  {
    id: 'TCH-004',
    nip: '198703202012022004',
    name: 'Siti Aminah, S.Pd.',
    role: 'wali_kelas',
    classAssigned: 'Kelas 1',
    subject: 'Guru Kelas 1',
    phone: '081234567004'
  },
  {
    id: 'TCH-005',
    nip: '198909102014011006',
    name: 'Hendra Setiawan, S.Pd.',
    role: 'pembina_osis',
    subject: 'Pendidikan Jasmani & Olahraga',
    phone: '081234567005'
  },
  {
    id: 'TCH-006',
    nip: '199205182019032008',
    name: 'Nurul Hidayah, S.Pd.',
    role: 'wali_kelas',
    classAssigned: 'Kelas 3',
    subject: 'Guru Kelas 3',
    phone: '081234567006'
  },
  {
    id: 'TCH-007',
    nip: '198811252015031003',
    name: 'Agus Suryanto, S.Pd.I.',
    role: 'wali_kelas',
    classAssigned: 'Kelas 5',
    subject: 'Pendidikan Agama Islam',
    phone: '081234567007'
  }
];

export const initialPiketSchedules: PiketSchedule[] = [
  { day: 'Senin', teacherIds: ['TCH-003', 'TCH-004', 'TCH-005'], notes: 'Fokus gerbang pagi jam 06.30 - 07.15 WIB & ketertiban upacara', dutyHours: '06.30 - 15.00 WIB' },
  { day: 'Selasa', teacherIds: ['TCH-006', 'TCH-007', 'TCH-002'], notes: 'Fokus patroli ketertiban KBM lantai 1 & 2', dutyHours: '06.30 - 15.00 WIB' },
  { day: 'Rabu', teacherIds: ['TCH-003', 'TCH-006', 'TCH-004'], notes: 'Fokus ketertiban area kantin & taman saat istirahat', dutyHours: '06.30 - 15.00 WIB' },
  { day: 'Kamis', teacherIds: ['TCH-005', 'TCH-007', 'TCH-002'], notes: 'Fokus razia kelengkapan atribut seragam', dutyHours: '06.30 - 15.00 WIB' },
  { day: 'Jumat', teacherIds: ['TCH-003', 'TCH-004', 'TCH-007'], notes: 'Fokus ketertiban shalat Jumat & kebersihan kelas', dutyHours: '06.30 - 14.00 WIB' },
  { day: 'Sabtu', teacherIds: ['TCH-005', 'TCH-006'], notes: 'Fokus kegiatan ekstrakurikuler & kepramukaan', dutyHours: '06.30 - 13.00 WIB' }
];

export const initialViolationRules: ViolationRule[] = [
  // Pelanggaran Berat (20 Poin)
  {
    id: 'V-B01',
    code: 'B-01',
    category: 'berat',
    name: 'Membawa obat/minuman terlarang',
    points: 20,
    description: 'Membawa, mengonsumsi, atau mengedarkan minuman keras, obat terlarang / narkotika di lingkungan sekolah.'
  },
  {
    id: 'V-B02',
    code: 'B-02',
    category: 'berat',
    name: 'Foto/video pornografi',
    points: 20,
    description: 'Menyimpan, melihat, membuat, atau menyebarluaskan konten asusila/pornografi.'
  },
  {
    id: 'V-B03',
    code: 'B-03',
    category: 'berat',
    name: 'Membawa rokok & merokok',
    points: 20,
    description: 'Membawa rokok konvensional / rokok elektrik (vape) dan/atau merokok di lingkungan atau saat berseragam sekolah.'
  },
  {
    id: 'V-B04',
    code: 'B-04',
    category: 'berat',
    name: 'Melukai/mengancam orang lain',
    points: 20,
    description: 'Melakukan perundungan fisik, penganiayaan, pengeroyokan, atau intimidasi verbal/fisik.'
  },
  {
    id: 'V-B05',
    code: 'B-05',
    category: 'berat',
    name: 'Tindakan kurang pantas (asusila)',
    points: 20,
    description: 'Melakukan perbuatan tidak senonoh atau pelecehan di lingkungan sekolah.'
  },
  {
    id: 'V-B06',
    code: 'B-06',
    category: 'berat',
    name: 'Mengambil barang bukan miliknya',
    points: 20,
    description: 'Mencuri, menggelapkan, atau merampas hak milik warga sekolah atau pihak lain.'
  },
  {
    id: 'V-B07',
    code: 'B-07',
    category: 'berat',
    name: 'Izin keluar kelas & tidak kembali',
    points: 20,
    description: 'Meninggalkan kelas atau area sekolah tanpa izin resmi (membolos).'
  },

  // Pelanggaran Sedang (10 Poin)
  {
    id: 'V-S01',
    code: 'S-01',
    category: 'sedang',
    name: 'Membawa senjata tajam (tanpa izin)',
    points: 10,
    description: 'Membawa pisau, gear, cutter besar, atau benda berbahaya tanpa instruksi tugas pembelajaran.'
  },
  {
    id: 'V-S02',
    code: 'S-02',
    category: 'sedang',
    name: 'Terlambat masuk sekolah',
    points: 10,
    description: 'Tiba di gerbang/kelas melebihi batas bel masuk yang telah ditetapkan sekolah.'
  },

  // Pelanggaran Ringan (5 Poin)
  {
    id: 'V-R01',
    code: 'R-01',
    category: 'ringan',
    name: 'Seragam tidak rapi/tidak sesuai jadwal',
    points: 5,
    description: 'Memakai seragam yang tidak sesuai ketentuan hari atau tidak dimasukkan secara rapi.'
  },
  {
    id: 'V-R02',
    code: 'R-02',
    category: 'ringan',
    name: 'Tidak menggunakan atribut sekolah',
    points: 5,
    description: 'Tidak memakai topi, dasi, ikat pinggang standar, kaos kaki sesuai ketentuan, atau badge lokasi.'
  },
  {
    id: 'V-R03',
    code: 'R-03',
    category: 'ringan',
    name: 'Aksesori tidak berkaitan dengan sekolah',
    points: 5,
    description: 'Mengenakan gelang tali berlebihan, rantai celana, tato tempel, atau aksesori non-edukasi.'
  },
  {
    id: 'V-R04',
    code: 'R-04',
    category: 'ringan',
    name: 'Perhiasan berlebihan',
    points: 5,
    description: 'Menggunakan perhiasan emas/mewah berlebihan atau makeup mencolok yang tidak pantas untuk siswa.'
  },
  {
    id: 'V-R05',
    code: 'R-05',
    category: 'ringan',
    name: 'Mengubah warna rambut',
    points: 5,
    description: 'Mengecat atau menyemir rambut dengan warna selain warna alami rambut.'
  },
  {
    id: 'V-R06',
    code: 'R-06',
    category: 'ringan',
    name: 'Murid laki-laki berambut panjang',
    points: 5,
    description: 'Rambut melewati kerah baju, menutup daun telinga, atau melewati alis mata (gondrong).'
  },
  {
    id: 'V-R07',
    code: 'R-07',
    category: 'ringan',
    name: 'Murid perempuan berambut tidak rapi',
    points: 5,
    description: 'Rambut tidak diikat rapi atau terurai mengganggu saat kegiatan belajar berlangsung.'
  }
];

export const initialRewardRules: RewardRule[] = [
  // Juara I
  {
    id: 'REW-01',
    code: 'REW-01',
    name: 'Juara I Nasional',
    level: 'Nasional',
    rank: 'Juara I',
    points: 9,
    description: 'Meraih peringkat 1 dalam ajang perlombaan / olimpiade / kejuaraan tingkat Nasional.'
  },
  {
    id: 'REW-02',
    code: 'REW-02',
    name: 'Juara I Provinsi',
    level: 'Provinsi',
    rank: 'Juara I',
    points: 6,
    description: 'Meraih peringkat 1 dalam kejuaraan / kompetisi tingkat Provinsi.'
  },
  {
    id: 'REW-03',
    code: 'REW-03',
    name: 'Juara I Kota/Kab',
    level: 'Kota/Kab',
    rank: 'Juara I',
    points: 3,
    description: 'Meraih peringkat 1 dalam kejuaraan / kompetisi tingkat Kota/Kabupaten.'
  },

  // Juara II
  {
    id: 'REW-04',
    code: 'REW-04',
    name: 'Juara II Nasional',
    level: 'Nasional',
    rank: 'Juara II',
    points: 8,
    description: 'Meraih peringkat 2 dalam kejuaraan tingkat Nasional.'
  },
  {
    id: 'REW-05',
    code: 'REW-05',
    name: 'Juara II Provinsi',
    level: 'Provinsi',
    rank: 'Juara II',
    points: 5,
    description: 'Meraih peringkat 2 dalam kejuaraan tingkat Provinsi.'
  },
  {
    id: 'REW-06',
    code: 'REW-06',
    name: 'Juara II Kota/Kab',
    level: 'Kota/Kab',
    rank: 'Juara II',
    points: 2,
    description: 'Meraih peringkat 2 dalam kejuaraan tingkat Kota/Kabupaten.'
  },

  // Juara III
  {
    id: 'REW-07',
    code: 'REW-07',
    name: 'Juara III Nasional',
    level: 'Nasional',
    rank: 'Juara III',
    points: 7,
    description: 'Meraih peringkat 3 dalam kejuaraan tingkat Nasional.'
  },
  {
    id: 'REW-08',
    code: 'REW-08',
    name: 'Juara III Provinsi',
    level: 'Provinsi',
    rank: 'Juara III',
    points: 4,
    description: 'Meraih peringkat 3 dalam kejuaraan tingkat Provinsi.'
  },
  {
    id: 'REW-09',
    code: 'REW-09',
    name: 'Juara III Kota/Kab',
    level: 'Kota/Kab',
    rank: 'Juara III',
    points: 1,
    description: 'Meraih peringkat 3 dalam kejuaraan tingkat Kota/Kabupaten.'
  },

  // Peserta Lomba
  {
    id: 'REW-10',
    code: 'REW-10',
    name: 'Peserta Lomba',
    level: 'Umum',
    rank: 'Peserta Lomba',
    points: 0,
    description: 'Mewakili sekolah dalam ajang perlombaan resmi (apresiasi piagam partisipasi).'
  }
];

export const initialStudents: Student[] = [
  {
    id: 'STU-001',
    nisn: '0089123401',
    nik: '3515011204120001',
    name: 'Ahmad Faiz Al-Farizi',
    class: 'Kelas 6',
    gender: 'L',
    parentName: 'H. Bambang Sulistyo',
    parentPhone: '081234567890',
    parentAddress: 'Jl. Merdeka No. 12, RT 02/RW 04',
    accessCode: 'FAIZ6',
    createdAt: '2026-01-10'
  },
  {
    id: 'STU-002',
    nisn: '0089123402',
    nik: '3515015508120002',
    name: 'Annisa Putri Rahmawati',
    class: 'Kelas 6',
    gender: 'P',
    parentName: 'Drs. Rahmanto, M.Pd.',
    parentPhone: '081398765432',
    parentAddress: 'Perum Gading Asri Blok C-14',
    accessCode: 'NISA6',
    createdAt: '2026-01-10'
  },
  {
    id: 'STU-003',
    nisn: '0089123403',
    nik: '3515011909130003',
    name: 'Bagas Aditya Pratama',
    class: 'Kelas 5',
    gender: 'L',
    parentName: 'Suryadi Wibowo',
    parentPhone: '085211223344',
    parentAddress: 'Jl. Pemuda No. 45',
    accessCode: 'BAGAS5',
    createdAt: '2026-01-11'
  },
  {
    id: 'STU-004',
    nisn: '0089123404',
    nik: '3515012211140004',
    name: 'Daffa Rizky Ramadhan',
    class: 'Kelas 4',
    gender: 'L',
    parentName: 'Hendra Saputra',
    parentPhone: '087788990011',
    parentAddress: 'Jl. Kenanga Raya No. 8',
    accessCode: 'DAFFA4',
    createdAt: '2026-01-12'
  },
  {
    id: 'STU-005',
    nisn: '0089123405',
    nik: '3515016003150005',
    name: 'Nayla Salsabila Azzahra',
    class: 'Kelas 3',
    gender: 'P',
    parentName: 'dr. Agus Santoso',
    parentPhone: '081288776655',
    parentAddress: 'Jl. Dahlia Hijau No. 22',
    accessCode: 'NAYLA3',
    createdAt: '2026-01-12'
  },
  {
    id: 'STU-006',
    nisn: '0089123406',
    nik: '3515011407160006',
    name: 'Rezky Arya Maulana',
    class: 'Kelas 2',
    gender: 'L',
    parentName: 'M. Yusuf Efendi',
    parentPhone: '089612345678',
    parentAddress: 'Jl. Melati Indah No. 5',
    accessCode: 'REZKY2',
    createdAt: '2026-01-15'
  },
  {
    id: 'STU-007',
    nisn: '0089123407',
    nik: '3515015002170007',
    name: 'Zahra Amelia Dewi',
    class: 'Kelas 1',
    gender: 'P',
    parentName: 'Eko Wahyudi',
    parentPhone: '082199887766',
    parentAddress: 'Komp. Graha Harmoni No. 9',
    accessCode: 'ZAHRA1',
    createdAt: '2026-01-15'
  }
];

export const initialViolations: ViolationRecord[] = [
  {
    id: 'REC-V01',
    studentId: 'STU-003',
    studentName: 'Bagas Aditya Pratama',
    studentClass: 'Kelas 5',
    ruleId: 'V-S02',
    ruleName: 'Terlambat masuk sekolah',
    category: 'sedang',
    points: 10,
    date: '2026-08-25',
    time: '07:25 WIB',
    location: 'Gerbang Utama Sekolah',
    reporterName: 'Pak Indartha, S.Pd.',
    description: 'Siswa tiba di sekolah pukul 07.25 WIB, melewati bel masuk.',
    whatsappSent: true,
    createdAt: '2026-08-25T07:30:00Z'
  },
  {
    id: 'REC-V02',
    studentId: 'STU-003',
    studentName: 'Bagas Aditya Pratama',
    studentClass: 'Kelas 5',
    ruleId: 'V-B07',
    ruleName: 'Izin keluar kelas & tidak kembali',
    category: 'berat',
    points: 20,
    date: '2026-08-27',
    time: '10:45 WIB',
    location: 'Kantin / Belakang Lab Komputer',
    reporterName: 'Ibu Ratna, M.Pd.',
    description: 'Izin ke toilet pada jam ke-4 namun tidak kembali ke kelas sampai bel istirahat.',
    whatsappSent: false,
    createdAt: '2026-08-27T11:00:00Z'
  },
  {
    id: 'REC-V03',
    studentId: 'STU-003',
    studentName: 'Bagas Aditya Pratama',
    studentClass: 'Kelas 5',
    ruleId: 'V-B03',
    ruleName: 'Membawa rokok & merokok',
    category: 'berat',
    points: 20,
    date: '2026-08-29',
    time: '13:30 WIB',
    location: 'Area Parkir Belakang',
    reporterName: 'Pak Indartha, S.Pd.',
    description: 'Kedapatan membawa pods rokok elektrik di saku jaket.',
    whatsappSent: true,
    createdAt: '2026-08-29T13:45:00Z'
  },
  {
    id: 'REC-V04',
    studentId: 'STU-006',
    studentName: 'Rezky Arya Maulana',
    studentClass: 'Kelas 2',
    ruleId: 'V-R01',
    ruleName: 'Seragam tidak rapi/tidak sesuai jadwal',
    category: 'ringan',
    points: 5,
    date: '2026-08-28',
    time: '07:15 WIB',
    location: 'Lapangan Upacara',
    reporterName: 'Ibu Siti Aminah, S.Pd.',
    description: 'Tidak memakai kaos kaki putih dan baju tidak dimasukkan rapi.',
    whatsappSent: true,
    createdAt: '2026-08-28T07:20:00Z'
  }
];

export const initialRewards: RewardRecord[] = [
  {
    id: 'REC-R01',
    studentId: 'STU-002',
    studentName: 'Annisa Putri Rahmawati',
    studentClass: 'Kelas 6',
    ruleId: 'REW-01',
    ruleName: 'Juara I Nasional',
    rank: 'Juara I',
    level: 'Nasional',
    points: 9,
    date: '2026-08-18',
    competitionName: 'Olimpiade Sains Nasional (OSN) Matematika SD',
    organizer: 'Pusat Prestasi Nasional Kemdikbudristek',
    certificateNumber: 'OSN/MAT/2026/089',
    reporterName: 'Ibu Ratna, M.Pd.',
    notes: 'Meraih medali emas OSN dengan nilai sempurna di babak final.',
    whatsappSent: true,
    createdAt: '2026-08-18T10:00:00Z'
  },
  {
    id: 'REC-R02',
    studentId: 'STU-001',
    studentName: 'Ahmad Faiz Al-Farizi',
    studentClass: 'Kelas 6',
    ruleId: 'REW-03',
    ruleName: 'Juara I Kota/Kab',
    rank: 'Juara I',
    level: 'Kota/Kab',
    points: 3,
    date: '2026-08-22',
    competitionName: 'Lomba Bercerita Bahasa Indonesia FLS2N SD',
    organizer: 'Dinas Pendidikan Kota',
    certificateNumber: 'FLS2N/PIDATO/KAB/042',
    reporterName: 'Pak Indartha, S.Pd.',
    notes: 'Juara 1 Tingkat Kota dan maju mewakili ke tingkat Provinsi.',
    whatsappSent: true,
    createdAt: '2026-08-22T14:30:00Z'
  },
  {
    id: 'REC-R03',
    studentId: 'STU-005',
    studentName: 'Nayla Salsabila Azzahra',
    studentClass: 'Kelas 3',
    ruleId: 'REW-02',
    ruleName: 'Juara I Provinsi',
    rank: 'Juara I',
    level: 'Provinsi',
    points: 6,
    date: '2026-08-26',
    competitionName: 'Kejuaraan Karate Pelajar SD Usia Dini Se-Jawa Barat',
    organizer: 'FORKI Provinsi',
    certificateNumber: 'FORKI/KATA/JBR/118',
    reporterName: 'Pak Hendra, S.Pd.',
    notes: 'Kategori Kata Perorangan Putri Tingkat SD.',
    whatsappSent: true,
    createdAt: '2026-08-26T16:00:00Z'
  }
];

export const initialCompensations: CompensationRecord[] = [
  {
    id: 'REC-C01',
    studentId: 'STU-003',
    studentName: 'Bagas Aditya Pratama',
    studentClass: 'Kelas 5',
    taskName: 'Penataan Buku Perpustakaan & Resume 2 Buku Karakter',
    deductedPoints: 10,
    date: '2026-08-30',
    supervisorName: 'Ibu Ratna, M.Pd. (Guru BK)',
    status: 'Disetujui',
    notes: 'Tugas telah diselesaikan dengan baik dan resume telah dipresentasikan kepada guru BK.',
    createdAt: '2026-08-30T14:00:00Z'
  }
];

export const initialSettings: SchoolSettings = {
  schoolName: '',
  schoolSubtitle: '',
  schoolAddress: '',
  schoolPhone: '',
  schoolEmail: '',
  schoolWebsite: '',
  principalName: '',
  principalNip: '',
  bkCoordinatorName: '',
  bkCoordinatorNip: '',
  staffPin: '',
  googleSheetsUrl: '',
  googleSheetsWebhook: 'https://script.google.com/macros/s/AKfycbwOnSs6tO0me32w9R7x_ip6B2Eodj0Rt6WznSS_AlNDhIEhsLbNzHfl0MuWiHMAVkU/exec',
  waGatewayApiKey: '',
  waGatewayDevice: '',
  letterNumberPrefix: '',
  academicYear: ''
};

export const educationalArticles = [
  {
    id: 'edu-1',
    title: 'Disiplin Positif: Mengubah Kesalahan Menjadi Pembelajaran Berharga',
    category: 'Pembiasaan Karakter',
    readTime: '3 Menit Baca',
    summary: 'Disiplin bukanlah tentang hukuman yang menyakiti, melainkan tentang menumbuhkan kesadaran diri (internal motivation) untuk menghargai waktu, orang lain, dan diri sendiri.',
    content: `
      Disiplin positif berfokus pada pemahaman akar masalah dan solusi restoratif. Melalui sistem poin SI TAMU:
      1. Setiap siswa diajak menyadari konsekuensi logis dari tindakannya.
      2. Siswa diberi kesempatan untuk memulihkan diri melalui kegiatan kompensasi positif (restorative justice).
      3. Kolaborasi erat antara Orang Tua, Wali Kelas, dan Guru BK menjadi kunci utama keberhasilan pembentukan karakter.
    `
  },
  {
    id: 'edu-2',
    title: 'Stop Bullying! Ciptakan Sekolah Ramah Anak yang Nyaman & Harmonis',
    category: 'Etika & Anti-Bullying',
    readTime: '4 Menit Baca',
    summary: 'Kenali bentuk-bentuk perundungan (fisik, verbal, relasional, dan cyberbullying) serta langkah berani untuk menjadi Upstander yang melindungi sesama teman.',
    content: `
      Sekolah adalah rumah kedua kita. Mari bersama-sama:
      - Saling menyapa dan menghargai perbedaan latar belakang.
      - Berani melapor kepada bapak/ibu guru jika melihat tindakan intimidasi atau ketidakadilan.
      - Menggunakan media sosial secara bijak, santun, dan saling menyemangati.
    `
  },
  {
    id: 'edu-3',
    title: 'Panduan Sanksi Bertingkat & Hak Kompensasi Siswa di SI TAMU',
    category: 'Aturan & Regulasi',
    readTime: '2 Menit Baca',
    summary: 'Ketahui ambang batas poin tata tertib dan bagaimana siswa dapat mengajukan pengurangan poin melalui kontribusi positif.',
    content: `
      Ketentuan Ambang Batas Poin SI TAMU:
      - 100 Poin: Peringatan tertulis & Pemanggilan Orang Tua Tahap I untuk pembinaan terarah.
      - 300 Poin: Skorsing sementara & penandatanganan Surat Perjanjian Khusus bersama orang tua.
      - 500 Poin: Pengembalian siswa kepada orang tua untuk pembinaan intensif di rumah.
      
      Hak Kompensasi: Siswa yang beriktikad baik dapat mengajukan permohonan kegiatan kompensasi (seperti karya literasi, bakti kebersihan, atau tugas sosial) kepada Guru BK untuk mengurangi akumulasi poin pelanggaran.
    `
  }
];
