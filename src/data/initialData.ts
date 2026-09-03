import { ViolationRule, RewardRule, Student, Teacher, PiketSchedule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings } from '../types';
import { initialStudents as loadedStudents } from './initialStudents';

export const initialStudents: Student[] = loadedStudents || [];

// Data Guru & GTK Resmi UPT SDN Karanganyar
export const initialTeachers: Teacher[] = [
  {
    id: 'TCH-199005302019031004',
    nip: '199005302019031004',
    name: 'Indartha Meiputra, S.Pd.',
    role: 'kepala_sekolah',
    subject: 'Kepala Sekolah',
    classAssigned: 'Semua Kelas',
    phone: '081234567890'
  },
  {
    id: 'TCH-198207152008012007',
    nip: '19820715 200801 2 007',
    name: 'Ratna Dewi Kusuma, S.Psi., M.Pd.',
    role: 'guru_bk',
    subject: 'Bimbingan Konseling (BK)',
    classAssigned: 'Semua Kelas',
    phone: '081330998877'
  },
  {
    id: 'TCH-198604122011012015',
    nip: '198604122011012015',
    name: 'Siti Nurhaliza, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 1 A',
    phone: '081234881122'
  },
  {
    id: 'TCH-198802182014021003',
    nip: '198802182014021003',
    name: 'Ahmad Fauzi, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 1 B',
    phone: '082140556677'
  },
  {
    id: 'TCH-198709252010012022',
    nip: '198709252010012022',
    name: 'Tri Wahyuni, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 2 A',
    phone: '085233445566'
  },
  {
    id: 'TCH-199103142015032008',
    nip: '199103142015032008',
    name: 'Rini Astuti, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 2 B',
    phone: '081358776655'
  },
  {
    id: 'TCH-198411082009021004',
    nip: '198411082009021004',
    name: 'Budi Santoso, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 3 A',
    phone: '081231223344'
  },
  {
    id: 'TCH-199208192019032014',
    nip: '199208192019032014',
    name: 'Dewi Lestari, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 3 B',
    phone: '085731998800'
  },
  {
    id: 'TCH-198506172010011019',
    nip: '198506172010011019',
    name: 'Eko Prasetyo, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 4 A',
    phone: '081336445522'
  },
  {
    id: 'TCH-198901232014022007',
    nip: '198901232014022007',
    name: 'Sri Rahayu, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 4 B',
    phone: '082234112233'
  },
  {
    id: 'TCH-198307042008011011',
    nip: '198307042008011011',
    name: 'Agus Setiawan, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 5 A',
    phone: '081235667788'
  },
  {
    id: 'TCH-199012052015032009',
    nip: '199012052015032009',
    name: 'Nurul Hidayati, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 5 B',
    phone: '085645332211'
  },
  {
    id: 'TCH-197805122005011008',
    nip: '197805122005011008',
    name: 'Bambang Hermanto, S.Pd., M.M.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 6 A',
    phone: '081233449988'
  },
  {
    id: 'TCH-199304162019032011',
    nip: '199304162019032011',
    name: 'Dwi Yuliani, S.Pd.',
    role: 'wali_kelas',
    subject: 'Guru Kelas / Tematik',
    classAssigned: 'KELAS 6 B',
    phone: '081332778899'
  },
  {
    id: 'TCH-198610152011011018',
    nip: '198610152011011018',
    name: 'M. Syamsul Arifin, S.Pd.I',
    role: 'guru_mapel',
    subject: 'Pendidikan Agama Islam (PAI)',
    classAssigned: 'Semua Kelas',
    phone: '085230667788'
  },
  {
    id: 'TCH-199107282015031006',
    nip: '199107282015031006',
    name: 'Hendra Gunawan, S.Pd.',
    role: 'guru_piket',
    subject: 'PJOK / Penjasorkes',
    classAssigned: 'Semua Kelas',
    phone: '081335889900'
  },
  {
    id: 'TCH-199403212020121009',
    nip: '199403212020121009',
    name: 'Wahyu Pratama, S.AP.',
    role: 'tenaga_kependidikan',
    subject: 'Administrasi & Tata Usaha',
    classAssigned: 'Kantor / TU',
    phone: '085730112233'
  }
];

export const initialPiketSchedules: PiketSchedule[] = [
  {
    day: 'Senin',
    teacherIds: ['TCH-199107282015031006', 'TCH-198802182014021003', 'TCH-198709252010012022'],
    dutyHours: '06.30 - 15.00 WIB',
    notes: 'Pengawalan kedisiplinan dan kerapian seragam upacara bendera'
  },
  {
    day: 'Selasa',
    teacherIds: ['TCH-198604122011012015', 'TCH-199103142015032008', 'TCH-198610152011011018'],
    dutyHours: '06.30 - 15.00 WIB',
    notes: 'Penyambutan siswa di gerbang 5S (Senyum, Salam, Sapa, Sopan, Santun) dan ketertiban KBM'
  },
  {
    day: 'Rabu',
    teacherIds: ['TCH-198411082009021004', 'TCH-199208192019032014', 'TCH-199403212020121009'],
    dutyHours: '06.30 - 15.00 WIB',
    notes: 'Pemeriksaan atribut lengkap, kuku, dan kerapian rambut siswa'
  },
  {
    day: 'Kamis',
    teacherIds: ['TCH-198506172010011019', 'TCH-198901232014022007', 'TCH-198207152008012007'],
    dutyHours: '06.30 - 15.00 WIB',
    notes: 'Pengawasan area kantin sehat, perpustakaan, dan area bermain selama jam istirahat'
  },
  {
    day: 'Jumat',
    teacherIds: ['TCH-198610152011011018', 'TCH-198307042008011011', 'TCH-199012052015032009'],
    dutyHours: '06.30 - 14.00 WIB',
    notes: 'Kedisiplinan salat dhuha/ibadah bersama dan pemantauan kegiatan pembiasaan karakter'
  },
  {
    day: 'Sabtu',
    teacherIds: ['TCH-197805122005011008', 'TCH-199304162019032011', 'TCH-199107282015031006'],
    dutyHours: '06.30 - 13.00 WIB',
    notes: 'Pemeriksaan kebersihan kelas akhir pekan dan ketertiban penjemputan kepulangan'
  }
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

export const initialViolations: ViolationRecord[] = [];

export const initialRewards: RewardRecord[] = [];

export const initialCompensations: CompensationRecord[] = [];

export const OFFICIAL_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyc9XP8BPzTKcGNlcna12L31mYhotfGnJLFXhA8EhYtG2wG7lO9AQq9Aet3hu7WMjo/exec';

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
  googleSheetsWebhook: OFFICIAL_WEBHOOK_URL,
  googleSheetsWebhookUrl: OFFICIAL_WEBHOOK_URL,
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
