import { ViolationRule, RewardRule, Student, Teacher, PiketSchedule, ViolationRecord, RewardRecord, CompensationRecord, SchoolSettings } from '../types';
import { initialStudents as loadedStudents } from './initialStudents';

export const initialStudents: Student[] = loadedStudents || [];

export const initialTeachers: Teacher[] = [];

export const initialPiketSchedules: PiketSchedule[] = [
  { day: 'Senin', teacherIds: [], dutyHours: '06.30 - 15.00 WIB', notes: 'Pengawalan kedisiplinan dan kerapian seragam upacara' },
  { day: 'Selasa', teacherIds: [], dutyHours: '06.30 - 15.00 WIB', notes: 'Penyambutan siswa di gerbang dan ketertiban KBM' },
  { day: 'Rabu', teacherIds: [], dutyHours: '06.30 - 15.00 WIB', notes: 'Pemeriksaan atribut dan kerapian rambut' },
  { day: 'Kamis', teacherIds: [], dutyHours: '06.30 - 15.00 WIB', notes: 'Pengawasan area kantin dan area bermain' },
  { day: 'Jumat', teacherIds: [], dutyHours: '06.30 - 14.00 WIB', notes: 'Kedisiplinan ibadah dan kegiatan ekstrakurikuler' },
  { day: 'Sabtu', teacherIds: [], dutyHours: '06.30 - 13.00 WIB', notes: 'Pemeriksaan akhir pekan dan kepulangan' }
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
  googleSheetsWebhook: 'https://script.google.com/macros/s/AKfycbyc9XP8BPzTKcGNlcna12L31mYhotfGnJLFXhA8EhYtG2wG7lO9AQq9Aet3hu7WMjo/exec',
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
