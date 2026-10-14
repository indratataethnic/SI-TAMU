# Security Specification for SITAMU Firebase Integration

## 1. Data Invariants
- Siswa (`students`): Memiliki ID unik, nama, NISN, dan kelas.
- Guru (`teachers`): Memiliki ID unik, nama lengkap, dan peran/mata pelajaran.
- Pelanggaran (`violations`): Harus terhubung ke siswa yang sah (`studentId`), memiliki nama pelanggaran (`ruleName`), poin positif, dan tanggal valid.
- Penghargaan/Reward (`rewards`): Terhubung ke siswa yang sah (`studentId`), memiliki nama ajang/prestasi, dan poin positif.
- Kompensasi (`compensations`): Terhubung ke siswa (`studentId`) dan memiliki pengurangan poin yang sah.
- Master Tata Tertib & Master Reward: Mengatur katalog referensi poin di sekolah.
- Pengaturan (`settings`): Menyimpan konfigurasi umum sekolah.

## 2. Dirty Dozen Threat Vectors
1. ID Poisoning (karakter ilegal atau string > 128 karakter pada ID dokumen).
2. Ghost Field Injection (menyuntikkan field arbitrary yang tidak diizinkan pada dokumen siswa/pelanggaran).
3. Poin Pelanggaran Negatif (menginput poin <= 0 atau non-angka).
4. Pemalsuan Siswa (mencatat pelanggaran tanpa studentId yang valid).
5. State short-circuiting pada konfigurasi sekolah.
6. Penghapusan sepihak tanpa identitas.
7. Modifikasi id dokumen setelah dibuat.
8. Denial of Wallet via oversized payload (>10KB pada deskripsi pelanggaran).
9. Pelanggaran batas maksimal poin reward (>100 poin per entri tanpa izin).
10. Update liar tanpa mematuhi skema data.
11. Query scraping tak terkontrol.
12. Pembobolan data PII nomor kontak orang tua secara massal.

## 3. Defense Strategy
- Validasi ketat ukuran karakter (string size constraints <= 500 chars).
- Validasi integer/number ranges untuk poin (1-100 poin per pelanggaran).
- Pembatasan field yang dapat diubah saat `update` menggunakan `affectedKeys()`.
