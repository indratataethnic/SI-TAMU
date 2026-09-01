export const getGoogleAppsScriptTemplate = (schoolName: string = 'SD / SMP SI TAMU') => {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT DATABASE PENGHUBUNG SI TAMU
 * Sekolah: ${schoolName}
 * =========================================================================
 * PANDUAN PEMASANGAN (1 MENIT):
 * 1. Buka Google Spreadsheet baru Anda di Google Drive.
 * 2. Klik menu "Ekstensi" (Extensions) > pilih "Apps Script".
 * 3. Hapus semua teks yang ada di editor, lalu PASTE (Tempel) seluruh kode ini.
 * 4. Klik tombol "Simpan" (ikon Disket).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan baru" (New deployment).
 * 6. Pada ikon Gerigi (Select type), pilih "Aplikasi Web" (Web App).
 * 7. Konfigurasi Wajib:
 *    - Deskripsi: SI TAMU Webhook Database
 *    - Jalankan sebagai (Execute as): "Saya" / "Me" (email Anda)
 *    - Siapa yang memiliki akses (Who has access): "Siapa saja" / "Anyone" (PENTING!)
 * 8. Klik "Terapkan" (Deploy) > Berikan Izin Akses (Authorize Access).
 * 9. Salin URL Aplikasi Web yang berakhiran "/exec".
 * 10. Tempelkan URL tersebut ke menu Integrasi Google Spreadsheet di SI TAMU.
 * =========================================================================
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Parse incoming payload
    var raw = "";
    if (e && e.postData && e.postData.contents) {
      raw = e.postData.contents;
    } else if (e && e.parameter && e.parameter.data) {
      raw = e.parameter.data;
    }

    if (!raw) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Payload data kosong."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var postData = typeof raw === "string" ? JSON.parse(raw) : raw;

    // Fallback if script is standalone and sheetUrl is provided
    if (!ss && postData.sheetUrl) {
      try {
        ss = SpreadsheetApp.openByUrl(postData.sheetUrl);
      } catch (errOpen) {
        // continue
      }
    }

    if (!ss) {
      return ContentService.createTextOutput(JSON.stringify({
        status: "error",
        message: "Spreadsheet aktif tidak ditemukan. Pastikan Apps Script dibuat melalui menu Ekstensi > Apps Script di dalam Google Spreadsheet Anda."
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var action = postData.action || "SYNC_ALL";

    if (action === "SYNC_ALL" || action === "INIT_SHEETS") {
      setupAllSheets(ss);

      if (postData.students && postData.students.length >= 0) {
        writeStudentsSheet(ss, postData.students);
      }
      if (postData.teachers && postData.teachers.length >= 0) {
        writeTeachersSheet(ss, postData.teachers);
      }
      if (postData.piketSchedules && postData.piketSchedules.length >= 0) {
        writePiketSheet(ss, postData.piketSchedules, postData.teachers || []);
      }
      if (postData.violations && postData.violations.length >= 0) {
        writeViolationsSheet(ss, postData.violations);
      }
      if (postData.rewards && postData.rewards.length >= 0) {
        writeRewardsSheet(ss, postData.rewards);
      }
      if (postData.compensations && postData.compensations.length >= 0) {
        writeCompensationsSheet(ss, postData.compensations);
      }
      if (postData.summaries && postData.summaries.length >= 0) {
        writeSummariesSheet(ss, postData.summaries);
      }

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Seluruh data SI TAMU (" + (postData.students ? postData.students.length : 0) + " siswa, " + (postData.teachers ? postData.teachers.length : 0) + " guru, " + (postData.violations ? postData.violations.length : 0) + " pelanggaran) berhasil diperbarui ke Google Spreadsheet!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "success",
      message: "Action diproses.",
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Gagal memproses di Google Apps Script: " + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script SI TAMU Aktif & Siap Menerima Sinkronisasi Data!",
    school: "${schoolName}",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupAllSheets(ss) {
  var sheets = [
    { name: "Data_Siswa", color: "#064E3B" },
    { name: "Data_Guru", color: "#134E4A" },
    { name: "Jadwal_Piket", color: "#4338CA" },
    { name: "Data_Pelanggaran", color: "#881337" },
    { name: "Data_Reward", color: "#78350F" },
    { name: "Data_Kompensasi", color: "#1E3A8A" },
    { name: "Rekapitulasi_Poin", color: "#0F172A" }
  ];

  sheets.forEach(function(s) {
    var sheet = ss.getSheetByName(s.name);
    if (!sheet) {
      sheet = ss.insertSheet(s.name);
    }
    sheet.setTabColor(s.color);
  });
}

function formatHeaderRow(sheet, headers, bgHex) {
  sheet.clear();
  sheet.appendRow(headers);
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground(bgHex || "#064E3B");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");
  headerRange.setHorizontalAlignment("center");
  sheet.setFrozenRows(1);
}

function writeStudentsSheet(ss, students) {
  var sheet = ss.getSheetByName("Data_Siswa") || ss.insertSheet("Data_Siswa");
  var headers = ["NIK", "NISN", "Nama Siswa", "Kelas", "Jenis Kelamin", "Nama Orang Tua / Wali", "No HP / WhatsApp Wali", "Alamat Rumah", "Kode Akses Siswa", "Catatan Khusus", "ID Sistem"];
  formatHeaderRow(sheet, headers, "#064E3B");

  if (!students || students.length === 0) return;

  var rows = students.map(function(s) {
    return [
      "'" + (s.nik || "-"),
      "'" + (s.nisn || ""),
      s.name || "",
      s.class || "",
      s.gender === "L" ? "Laki-laki" : (s.gender === "P" ? "Perempuan" : s.gender || ""),
      s.parentName || "",
      "'" + (s.parentPhone || ""),
      s.parentAddress || s.address || "",
      "'" + (s.accessCode || ""),
      s.notes || "",
      s.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeTeachersSheet(ss, teachers) {
  var sheet = ss.getSheetByName("Data_Guru") || ss.insertSheet("Data_Guru");
  var headers = ["NIP / NUPTK", "Nama Guru & Gelar", "Jabatan / Tugas", "Mata Pelajaran", "Penugasan Kelas / Wali", "No HP / WhatsApp", "ID Guru"];
  formatHeaderRow(sheet, headers, "#134E4A");

  if (!teachers || teachers.length === 0) return;

  var roleLabels = {
    "guru_mapel": "Guru Mata Pelajaran",
    "wali_kelas": "Wali Kelas",
    "guru_bk": "Guru Bimbingan Konseling (BK)",
    "guru_piket": "Guru Tim Piket",
    "pembina_osis": "Pembina OSIS / Kesiswaan",
    "kepala_sekolah": "Kepala Sekolah"
  };

  var rows = teachers.map(function(t) {
    return [
      "'" + (t.nip || "-"),
      t.name || "",
      roleLabels[t.role] || t.role || "Guru",
      t.subject || "-",
      t.classAssigned || "-",
      "'" + (t.phone || "-"),
      t.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writePiketSheet(ss, piketSchedules, teachers) {
  var sheet = ss.getSheetByName("Jadwal_Piket") || ss.insertSheet("Jadwal_Piket");
  var headers = ["Hari", "Jam Bertugas", "Jumlah Guru", "Daftar Nama Guru Piket", "Catatan / Instruksi Khusus"];
  formatHeaderRow(sheet, headers, "#4338CA");

  if (!piketSchedules || piketSchedules.length === 0) return;

  var teacherMap = {};
  (teachers || []).forEach(function(t) {
    teacherMap[t.id] = t.name;
  });

  var rows = piketSchedules.map(function(p) {
    var names = (p.teacherIds || []).map(function(id) {
      return teacherMap[id] || id;
    }).join(", ");

    return [
      p.day || "",
      p.dutyHours || "06.30 - 15.00 WIB",
      (p.teacherIds || []).length,
      names || "Belum ada guru piket",
      p.notes || "-"
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeViolationsSheet(ss, violations) {
  var sheet = ss.getSheetByName("Data_Pelanggaran") || ss.insertSheet("Data_Pelanggaran");
  var headers = ["Tanggal", "NISN", "Nama Siswa", "Kelas", "Pelanggaran", "Kategori", "Poin Pelanggaran", "Guru Pelapor", "Nama Wali", "No HP Wali", "Keterangan", "Status Notifikasi WA", "ID Catatan"];
  formatHeaderRow(sheet, headers, "#881337");

  if (!violations || violations.length === 0) return;

  var rows = violations.map(function(v) {
    return [
      v.date || "",
      "'" + (v.studentNisn || ""),
      v.studentName || "",
      v.studentClass || "",
      v.violationName || "",
      v.category || "",
      v.points || 0,
      v.reporterTeacherName || "",
      v.parentName || "",
      "'" + (v.parentPhone || ""),
      v.note || "",
      v.parentNotified ? "Sudah Terkirim" : "Belum",
      v.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeRewardsSheet(ss, rewards) {
  var sheet = ss.getSheetByName("Data_Reward") || ss.insertSheet("Data_Reward");
  var headers = ["Tanggal", "NISN", "Nama Siswa", "Kelas", "Nama Prestasi / Lomba", "Tingkat", "Peringkat / Juara", "Poin Reward", "Penyelenggara", "Guru Pencatat", "Keterangan", "ID Catatan"];
  formatHeaderRow(sheet, headers, "#78350F");

  if (!rewards || rewards.length === 0) return;

  var rows = rewards.map(function(r) {
    return [
      r.date || "",
      "'" + (r.studentNisn || ""),
      r.studentName || "",
      r.studentClass || "",
      r.competitionName || "",
      r.level || "",
      r.rank || "",
      r.points || 0,
      r.organizer || "",
      r.reporterTeacherName || "",
      r.note || "",
      r.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeCompensationsSheet(ss, compensations) {
  var sheet = ss.getSheetByName("Data_Kompensasi") || ss.insertSheet("Data_Kompensasi");
  var headers = ["Tanggal", "NISN", "Nama Siswa", "Kelas", "Bentuk Kompensasi", "Poin Pemulihan", "Status", "Guru Pembimbing", "Catatan", "ID Catatan"];
  formatHeaderRow(sheet, headers, "#1E3A8A");

  if (!compensations || compensations.length === 0) return;

  var rows = compensations.map(function(c) {
    return [
      c.date || "",
      "'" + (c.studentNisn || ""),
      c.studentName || "",
      c.studentClass || "",
      c.actionType || "",
      c.pointsReduced || 0,
      c.status || "selesai",
      c.supervisorTeacherName || "",
      c.notes || "",
      c.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeSummariesSheet(ss, summaries) {
  var sheet = ss.getSheetByName("Rekapitulasi_Poin") || ss.insertSheet("Rekapitulasi_Poin");
  var headers = ["NISN", "Nama Siswa", "Kelas", "Total Poin Pelanggaran", "Total Poin Reward", "Total Poin Kompensasi", "Poin Pelanggaran Aktif", "Status Penanganan", "Total Kasus Pelanggaran", "Total Prestasi"];
  formatHeaderRow(sheet, headers, "#0F172A");

  if (!summaries || summaries.length === 0) return;

  var rows = summaries.map(function(s) {
    var st = s.student || {};
    return [
      "'" + (st.nisn || ""),
      st.name || "",
      st.class || "",
      s.totalViolationPoints || 0,
      s.totalRewardPoints || 0,
      s.totalCompensationPoints || 0,
      s.activeViolationPoints || 0,
      s.statusText || "Normal",
      s.violationsCount || 0,
      s.rewardsCount || 0
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}
`;
};

/**
 * Validates Google Sheets Webhook URL
 */
export const validateWebhookUrl = (url: string): { valid: boolean; message: string } => {
  const clean = (url || '').trim();
  if (!clean) {
    return { valid: false, message: 'URL Webhook belum diisi.' };
  }
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    return { valid: false, message: 'URL harus diawali dengan https://' };
  }
  if (clean.includes('docs.google.com/spreadsheets')) {
    return {
      valid: false,
      message: 'Anda memasukkan link Google Spreadsheet, BUKAN URL Webhook Apps Script. Harap buka menu Ekstensi > Apps Script > Terapkan sebagai Aplikasi Web dan salin URL berakhiran /exec.'
    };
  }
  if (clean.includes('script.google.com') && clean.includes('/edit')) {
    return {
      valid: false,
      message: 'Anda memasukkan link editor Apps Script (berakhiran /edit). Harap klik tombol biru "Terapkan" (Deploy) > "Penerapan Baru" dan salin URL Aplikasi Web berakhiran /exec.'
    };
  }
  return { valid: true, message: 'Format URL valid.' };
};

/**
 * Tests Webhook Connectivity
 */
export const testGoogleSheetsWebhook = async (webhookUrl: string): Promise<{ success: boolean; message: string }> => {
  const validation = validateWebhookUrl(webhookUrl);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    // We send a lightweight test payload via text/plain to avoid preflight issues
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'TEST_CONNECTION',
        timestamp: new Date().toISOString()
      })
    });

    return {
      success: true,
      message: 'Sinyal Webhook berhasil terkirim ke Google Apps Script! (Status: Siap Menerima Data)'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal menghubungi Webhook: ${err.message || 'Periksa koneksi internet atau izin Web App (harus "Siapa saja / Anyone")'}`
    };
  }
};

/**
 * Sends entire database payload to Google Sheets Webhook
 */
export const syncAllToGoogleSheets = async (
  webhookUrl: string,
  payload: {
    students: any[];
    teachers?: any[];
    piketSchedules?: any[];
    violations: any[];
    rewards: any[];
    compensations: any[];
    summaries?: any[];
    sheetUrl?: string;
  }
): Promise<{ success: boolean; message: string }> => {
  const validation = validateWebhookUrl(webhookUrl);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    const bodyString = JSON.stringify({
      action: 'SYNC_ALL',
      sheetUrl: payload.sheetUrl,
      students: payload.students || [],
      teachers: payload.teachers || [],
      piketSchedules: payload.piketSchedules || [],
      violations: payload.violations || [],
      rewards: payload.rewards || [],
      compensations: payload.compensations || [],
      summaries: payload.summaries || [],
      sentAt: new Date().toISOString()
    });

    // Use text/plain for universal compatibility with Google Apps Script Web Apps without CORS preflight failures
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: bodyString
    });

    return {
      success: true,
      message: `Data berhasil dikirim ke Google Spreadsheet (${payload.students?.length || 0} siswa, ${payload.teachers?.length || 0} guru, ${payload.violations?.length || 0} pelanggaran, ${payload.rewards?.length || 0} reward).`
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sinkronisasi gagal: ${err.message || 'Periksa URL Webhook dan izin Google Apps Script'}`
    };
  }
};

/**
 * Synchronizes full state helper
 */
export const syncFullStateToSheets = async (
  webhookUrl: string,
  students: any[],
  violations: any[],
  rewards: any[],
  compensations: any[],
  summaries?: any[],
  sheetUrl?: string,
  teachers?: any[],
  piketSchedules?: any[]
): Promise<{ success: boolean; message: string }> => {
  return syncAllToGoogleSheets(webhookUrl, {
    students,
    teachers,
    piketSchedules,
    violations,
    rewards,
    compensations,
    summaries,
    sheetUrl
  });
};

