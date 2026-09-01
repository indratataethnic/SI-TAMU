import { Student, ViolationRecord, RewardRecord, StudentScoreSummary, SchoolSettings } from '../types';

export const formatPhoneNumber = (phone: string): string => {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
};

export const generateViolationWAMessage = (
  student: Student,
  violation: ViolationRecord,
  activePoints: number,
  settings: SchoolSettings
): string => {
  return `*PEMBERITAHUAN TATA TERTIB SISWA*
*${settings.schoolName}*
----------------------------------------
Yth. Bapak/Ibu Wali Murid dari:
👤 *Nama:* ${student.name}
🏫 *Kelas:* ${student.class}
🆔 *NISN:* ${student.nisn}

Dengan hormat, kami menginformasikan catatan ketertiban siswa pada hari ini:
📅 *Tanggal:* ${violation.date} ${violation.time ? `(${violation.time})` : ''}
📍 *Lokasi:* ${violation.location || 'Lingkungan Sekolah'}
⚠️ *Jenis Pelanggaran:* ${violation.ruleName}
🏷️ *Kategori:* ${violation.category.toUpperCase()}
📊 *Bobot Poin:* +${violation.points} Poin
📈 *Total Akumulasi Poin Aktif:* ${activePoints} Poin
👨‍🏫 *Pencatat / Saksi:* ${violation.reporterName}

📝 *Catatan Kejadian:*
"${violation.description}"

----------------------------------------
Mohon bimbingan dan pendampingan Bapak/Ibu di rumah agar ananda senantiasa menaati tata tertib sekolah demi masa depan yang lebih baik.

_Sistem Informasi Tata Tertib Murid (SI TAMU) - ${settings.schoolName}_`;
};

export const generateRewardWAMessage = (
  student: Student,
  reward: RewardRecord,
  totalRewardPoints: number,
  settings: SchoolSettings
): string => {
  return `🎉 *APRESIASI PRESTASI & PERILAKU POSITIF SISWA* 🎉
*${settings.schoolName}*
----------------------------------------
Yth. Bapak/Ibu Wali Murid dari:
👤 *Nama:* ${student.name}
🏫 *Kelas:* ${student.class}

Selamat dan apresiasi setinggi-tingginya atas capaian membanggakan ananda:
🏆 *Peringkat/Kategori:* ${reward.rank} (${reward.level})
🌟 *Nama Prestasi:* ${reward.competitionName}
${reward.organizer ? `🏛️ *Penyelenggara:* ${reward.organizer}\n` : ''}📅 *Tanggal:* ${reward.date}
🎖️ *Poin Reward:* +${reward.points} Poin
✨ *Total Poin Prestasi:* ${totalRewardPoints} Poin

Terima kasih atas bimbingan dan doa Bapak/Ibu sekalian. Semoga ananda terus berprestasi dan menginspirasi teman-teman lainnya! 🌟

_Sistem Informasi Tata Tertib Murid (SI TAMU) - ${settings.schoolName}_`;
};

export const generateThresholdWAMessage = (
  summary: StudentScoreSummary,
  settings: SchoolSettings
): string => {
  const student = summary.student;
  const points = summary.activeViolationPoints;

  let title = 'PEMBERITAHUAN AKUMULASI POIN TATA TERTIB';
  let levelDetail = '';

  if (points >= 500) {
    title = 'URGENT: PEMBINAAN SISWA DI RUMAH (≥500 POIN)';
    levelDetail = `Akumulasi poin telah mencapai ${points} Poin. Sesuai regulasi sekolah, siswa diserahkan kembali kepada orang tua untuk pembinaan intensif di rumah.`;
  } else if (points >= 300) {
    title = 'PERINGATAN TINGKAT II: SKORSING & PERJANJIAN (≥300 POIN)';
    levelDetail = `Akumulasi poin telah mencapai ${points} Poin. Sekolah memberlakukan sanksi skorsing serta mengundang orang tua untuk penandatanganan Surat Perjanjian Khusus.`;
  } else if (points >= 100) {
    title = 'UNDANGAN PEMANGGILAN ORANG TUA TAHAP I (≥100 POIN)';
    levelDetail = `Akumulasi poin telah mencapai ${points} Poin. Mohon kesediaan Bapak/Ibu untuk hadir ke ruang Bimbingan Konseling (BK) guna koordinasi pembinaan.`;
  }

  return `*${title}*
*${settings.schoolName}*
----------------------------------------
Yth. Bapak/Ibu Wali Murid dari:
👤 *Nama:* ${student.name}
🏫 *Kelas:* ${student.class}
🆔 *NISN:* ${student.nisn}

📊 *Rincian Poin Siswa:*
• Total Poin Pelanggaran: ${summary.totalViolationPoints}
• Poin Pengurangan (Kompensasi): -${summary.totalCompensationPoints}
• *Total Poin Aktif Saat Ini:* ${points} Poin

⚠️ *Tindakan Sekolah:*
${levelDetail}

Mohon dapat segera berkoordinasi dengan Tim BK / Wali Kelas di nomor ${settings.schoolPhone}.
Terima kasih atas perhatian dan kerja samanya.

_Sistem Informasi Tata Tertib Murid (SI TAMU)_`;
};

export const openWhatsApp = (phone: string, message: string) => {
  const formattedPhone = formatPhoneNumber(phone);
  const encodedMsg = encodeURIComponent(message);
  const url = `https://wa.me/${formattedPhone}?text=${encodedMsg}`;
  window.open(url, '_blank');
};

export const sendViaGateway = async (
  phone: string,
  message: string,
  apiKey: string,
  endpoint?: string
): Promise<{ success: boolean; message: string }> => {
  if (!apiKey) {
    return { success: false, message: 'API Key WhatsApp Gateway belum dikonfigurasi.' };
  }

  const target = formatPhoneNumber(phone);
  const url = endpoint || 'https://api.fonnte.com/send';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target,
        message,
        countryCode: '62'
      })
    });

    const data = await response.json();
    if (response.ok && (data.status === true || data.status === 'success' || data.success)) {
      return { success: true, message: 'Pesan WhatsApp otomatis berhasil terkirim via Gateway!' };
    } else {
      return { success: false, message: data.reason || data.message || 'Gagal mengirim pesan via Gateway.' };
    }
  } catch (err: any) {
    return { success: false, message: `Koneksi Gateway gagal: ${err.message}` };
  }
};
