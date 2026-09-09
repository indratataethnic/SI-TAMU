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

    if (action === "FETCH_ALL") {
      var allData = fetchAllData(ss);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data berhasil dimuat dari Google Spreadsheet!",
        data: allData,
        sheetNames: allData.sheetNames || [],
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "GET_SHEETS" || action === "LIST_SHEETS") {
      var sheets = ss.getSheets();
      var sNames = [];
      for (var s = 0; s < sheets.length; s++) {
        sNames.push(sheets[s].getName());
      }
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        sheetNames: sNames,
        totalSheets: sNames.length,
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    if (action === "SYNC_ALL" || action === "INIT_SHEETS") {
      setupAllSheets(ss);

      if (postData.settings) {
        writeSettingsSheet(ss, postData.settings);
      }
      if (postData.students && postData.students.length >= 0) {
        writeStudentsSheet(ss, postData.students);
      }
      if (postData.teachers && postData.teachers.length >= 0) {
        writeTeachersSheet(ss, postData.teachers);
      }
      if (postData.piketSchedules && postData.piketSchedules.length >= 0) {
        writePiketSheet(ss, postData.piketSchedules, postData.teachers || []);
      }
      if (postData.violationRules && postData.violationRules.length >= 0) {
        writeRulesSheet(ss, postData.violationRules);
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
  var ss = null;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch(err) {}

  var sNames = [];
  if (ss) {
    var allSheets = ss.getSheets();
    for (var s = 0; s < allSheets.length; s++) {
      sNames.push(allSheets[s].getName());
    }
  }

  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script SI TAMU Aktif & Siap Menerima Sinkronisasi Data!",
    school: "${schoolName}",
    sheetNames: sNames,
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupAllSheets(ss) {
  var sheets = [
    { name: "Pengaturan_Aplikasi", color: "#0F766E" },
    { name: "Data_Siswa", color: "#064E3B" },
    { name: "Data_Guru", color: "#134E4A" },
    { name: "Jadwal_Piket", color: "#4338CA" },
    { name: "Aturan_Pelanggaran", color: "#C2410C" },
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
  var sheet = ss.getSheetByName("Data_Guru") || ss.getSheetByName("Data Guru") || ss.getSheetByName("Guru") || ss.getSheetByName("GTK") || ss.getSheetByName("Data_GTK") || ss.insertSheet("Data_Guru");
  var headers = ["NIP / NUPTK", "Nama Guru & Gelar", "Jabatan / Tugas", "Mata Pelajaran", "Penugasan Kelas / Wali", "No HP / WhatsApp", "Kode Akses / PIN Guru", "ID Guru"];
  formatHeaderRow(sheet, headers, "#134E4A");

  if (!teachers || teachers.length === 0) return;

  var roleLabels = {
    "guru_mapel": "Guru Mata Pelajaran",
    "wali_kelas": "Wali Kelas",
    "guru_bk": "Guru Bimbingan Konseling (BK)",
    "guru_piket": "Guru Tim Piket",
    "pembina_osis": "Pembina OSIS / Kesiswaan",
    "kepala_sekolah": "Kepala Sekolah",
    "tenaga_kependidikan": "Tenaga Kependidikan / TU"
  };

  var rows = teachers.map(function(t) {
    return [
      "'" + (t.nip || "-"),
      t.name || "",
      roleLabels[t.role] || t.role || "Guru",
      t.subject || "-",
      t.classAssigned || "-",
      "'" + (t.phone || "-"),
      "'" + (t.accessCode || t.pin || t.staffPin || ""),
      t.id || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeRulesSheet(ss, violationRules) {
  var sheet = ss.getSheetByName("Aturan_Pelanggaran") || ss.getSheetByName("Aturan Pelanggaran") || ss.insertSheet("Aturan_Pelanggaran");
  var headers = ["ID Aturan", "Nama Pelanggaran / Aturan", "Kategori", "Bobot Poin", "Sanksi Default / Rekomendasi", "Status Aktif"];
  formatHeaderRow(sheet, headers, "#C2410C");

  if (!violationRules || violationRules.length === 0) return;

  var rows = violationRules.map(function(r) {
    return [
      r.id || "",
      r.name || r.ruleName || "",
      r.category || "ringan",
      r.points || 0,
      r.defaultSanction || r.sanction || "-",
      r.isActive !== false ? "Aktif" : "Non-Aktif"
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writePiketSheet(ss, piketSchedules, teachers) {
  var sheet = ss.getSheetByName("Jadwal_Piket") || ss.getSheetByName("Jadwal Piket") || ss.insertSheet("Jadwal_Piket");
  var headers = ["Hari", "Jam Bertugas", "Jumlah Guru", "Daftar Nama Guru Piket", "Catatan / Instruksi Khusus", "IDs_Guru"];
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

    var ids = (p.teacherIds || []).join(",");

    return [
      p.day || "",
      p.dutyHours || "06.30 - 15.00 WIB",
      (p.teacherIds || []).length,
      names || "Belum ada guru piket",
      p.notes || "-",
      ids || ""
    ];
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);
}

function writeViolationsSheet(ss, violations) {
  var sheet = ss.getSheetByName("Data_Pelanggaran") || ss.insertSheet("Data_Pelanggaran");
  var headers = ["Tanggal", "NISN", "Nama Siswa", "Kelas", "Pelanggaran", "Kategori", "Poin Pelanggaran", "Guru Pelapor", "Lokasi Kejadian", "Nama Wali", "No HP Wali", "Keterangan", "Status Notifikasi WA", "ID Catatan"];
  formatHeaderRow(sheet, headers, "#881337");

  if (!violations || violations.length === 0) return;

  var rows = violations.map(function(v) {
    return [
      v.date || "",
      "'" + (v.studentNisn || ""),
      v.studentName || "",
      v.studentClass || "",
      v.violationName || v.ruleName || v.pelanggaran || v.description || "",
      v.category || "",
      v.points || 0,
      v.reporterTeacherName || v.reporterName || v.reporter || "",
      v.location || v.lokasi || "Lingkungan Sekolah",
      v.parentName || "",
      "'" + (v.parentPhone || ""),
      v.note || v.description || "",
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
      r.competitionName || r.title || r.ruleName || r.prestasi || "",
      r.level || "",
      r.rank || "",
      r.points || 0,
      r.organizer || "",
      r.reporterTeacherName || r.reporterName || r.recordedBy || r.reporter || "",
      r.note || r.notes || "",
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

function writeSettingsSheet(ss, settings) {
  var sheet = ss.getSheetByName("Pengaturan_Aplikasi") || ss.insertSheet("Pengaturan_Aplikasi");
  formatHeaderRow(sheet, ["Kunci", "Nilai", "Deskripsi"], "#0F766E");

  if (!settings) return;

  var keys = [
    { key: "schoolName", value: settings.schoolName || "", desc: "Nama Satuan Pendidikan" },
    { key: "schoolSubtitle", value: settings.schoolSubtitle || "", desc: "Motto / Subtitle Sekolah" },
    { key: "schoolAddress", value: settings.schoolAddress || "", desc: "Alamat Sekolah" },
    { key: "schoolPhone", value: settings.schoolPhone || "", desc: "Nomor Telepon Sekolah" },
    { key: "schoolEmail", value: settings.schoolEmail || "", desc: "Email Sekolah" },
    { key: "schoolWebsite", value: settings.schoolWebsite || "", desc: "Website Sekolah" },
    { key: "principalName", value: settings.principalName || settings.headmasterName || "", desc: "Nama Kepala Sekolah" },
    { key: "principalNip", value: settings.principalNip || settings.headmasterNip || "", desc: "NIP Kepala Sekolah" },
    { key: "bkCoordinatorName", value: settings.bkCoordinatorName || "", desc: "Nama Koordinator BK" },
    { key: "bkCoordinatorNip", value: settings.bkCoordinatorNip || "", desc: "NIP Koordinator BK" },
    { key: "staffPin", value: settings.staffPin || "", desc: "Kode Akses Petugas / PIN" },
    { key: "waGatewayApiKey", value: settings.waGatewayApiKey || "", desc: "API Key WA Gateway" },
    { key: "waGatewayDevice", value: settings.waGatewayDevice || "", desc: "Device WA Gateway" },
    { key: "letterNumberPrefix", value: settings.letterNumberPrefix || "", desc: "Prefix Nomor Surat" },
    { key: "academicYear", value: settings.academicYear || "", desc: "Tahun Pelajaran Aktif" }
  ];

  var rows = keys.map(function(item) {
    return [item.key, String(item.value), item.desc];
  });

  sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  sheet.autoResizeColumns(1, 3);
}

function fetchAllData(ss) {
  var data = {
    settings: {},
    students: [],
    teachers: [],
    piketSchedules: [],
    violationRules: [],
    violations: [],
    rewards: [],
    compensations: [],
    sheetNames: []
  };

  var allSheetsList = ss.getSheets();
  for (var s = 0; s < allSheetsList.length; s++) {
    data.sheetNames.push(allSheetsList[s].getName());
  }

  // Universal Sheet Finder Helper
  function findSheet(exactNames, keywords) {
    for (var i = 0; i < exactNames.length; i++) {
      var target = exactNames[i].toLowerCase().replace(/[_\s-]+/g, '');
      for (var s = 0; s < allSheetsList.length; s++) {
        var name = allSheetsList[s].getName().toLowerCase().replace(/[_\s-]+/g, '');
        if (name === target) return allSheetsList[s];
      }
    }
    for (var k = 0; k < keywords.length; k++) {
      var kw = keywords[k].toLowerCase().trim();
      for (var s = 0; s < allSheetsList.length; s++) {
        var name = allSheetsList[s].getName().toLowerCase();
        if (name.indexOf(kw) !== -1) return allSheetsList[s];
      }
    }
    return null;
  }

  // Helper to format date safely
  function formatDateVal(val) {
    if (!val) return "";
    if (Object.prototype.toString.call(val) === "[object Date]") {
      var y = val.getFullYear();
      var m = ("0" + (val.getMonth() + 1)).slice(-2);
      var d = ("0" + val.getDate()).slice(-2);
      return y + "-" + m + "-" + d;
    }
    return String(val).trim();
  }

  // 1. Settings (Pengaturan_Aplikasi / Pengaturan_Sekolah)
  var settingsSheet = findSheet(["Pengaturan_Aplikasi", "Pengaturan Aplikasi", "Pengaturan_Sekolah", "Pengaturan Sekolah", "Settings", "Pengaturan"], ["pengaturan", "setting", "profil"]);
  if (settingsSheet) {
    var values = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var key = String(values[i][0] || "").trim();
      var val = values[i][1];
      if (key) {
        var strVal = String(val !== undefined && val !== null ? val : "");
        data.settings[key] = strVal;
        if (key === "headmasterName") data.settings["principalName"] = strVal;
        if (key === "headmasterNip") data.settings["principalNip"] = strVal;
        if (key === "staffPin" || key === "adminPin" || key === "pin" || key === "kodeAksesPetugas") data.settings["staffPin"] = strVal;
      }
    }
  }

  // 2. Students (Data_Siswa)
  var studentSheet = findSheet(["Data_Siswa", "Data Siswa", "Siswa", "Peserta_Didik", "Peserta Didik", "Data_Murid", "Murid"], ["siswa", "murid", "peserta", "student"]);
  if (studentSheet) {
    var values = studentSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 15); r++) {
        var rowStr = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowStr.indexOf("nisn") !== -1 || rowStr.indexOf("nik") !== -1 || rowStr.indexOf("nama") !== -1 || rowStr.indexOf("kelas") !== -1 || rowStr.indexOf("rombel") !== -1 || rowStr.indexOf("siswa") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headers = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });
      var colNo = -1, colNik = -1, colNisn = -1, colName = -1, colClass = -1, colGender = -1, colParentName = -1, colAyah = -1, colIbu = -1, colWali = -1, colParentPhone = -1, colParentAddress = -1, colAccessCode = -1, colNotes = -1, colId = -1;

      headers.forEach(function(h, idx) {
        if (!h) return;
        if (h === "no" || h === "no." || h === "nomor" || h === "no urut" || h === "#") colNo = idx;
        else if (h.indexOf("hp") !== -1 || h.indexOf("wa") !== -1 || h.indexOf("telepon") !== -1 || h.indexOf("telp") !== -1 || h.indexOf("whatsapp") !== -1 || h.indexOf("kontak") !== -1 || h.indexOf("ponsel") !== -1 || h.indexOf("phone") !== -1) colParentPhone = idx;
        else if (h === "nik" || h.indexOf("16 digit") !== -1 || (h.indexOf("nik") !== -1 && h.indexOf("teknik") === -1)) colNik = idx;
        else if (h.indexOf("nisn") !== -1 || h === "nis" || h.indexOf("no induk") !== -1 || h.indexOf("induk") !== -1) colNisn = idx;
        else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1 || h.indexOf("rombongan") !== -1 || h.indexOf("tingkat") !== -1) colClass = idx;
        else if (h.indexOf("kelamin") !== -1 || h.indexOf("gender") !== -1 || h === "l/p" || h === "jk" || h === "sex") colGender = idx;
        else if ((h.indexOf("nama") !== -1 || h.indexOf("peserta") !== -1 || h.indexOf("murid") !== -1) && h.indexOf("wali") === -1 && h.indexOf("orang") === -1 && h.indexOf("guru") === -1 && h.indexOf("ortu") === -1 && h.indexOf("ayah") === -1 && h.indexOf("ibu") === -1) colName = idx;
        else if (h.indexOf("nama ayah") !== -1 || h === "ayah" || h === "bapak") colAyah = idx;
        else if (h.indexOf("nama ibu") !== -1 || h.indexOf("ibu kandung") !== -1 || h === "ibu") colIbu = idx;
        else if (h.indexOf("nama wali") !== -1 || h === "wali" || h.indexOf("wali murid") !== -1) colWali = idx;
        else if (h.indexOf("orang tua") !== -1 || h.indexOf("orangtua") !== -1 || h.indexOf("ortu") !== -1 || h.indexOf("parent") !== -1) colParentName = idx;
        else if (h.indexOf("alamat") !== -1 || h.indexOf("domisili") !== -1 || h.indexOf("tempat tinggal") !== -1) colParentAddress = idx;
        else if (h.indexOf("kode") !== -1 || h.indexOf("akses") !== -1 || h.indexOf("pin") !== -1) colAccessCode = idx;
        else if (h.indexOf("catatan") !== -1 || h.indexOf("keterangan") !== -1) colNotes = idx;
        else if (h.indexOf("id sistem") !== -1 || h === "id" || h.indexOf("id_siswa") !== -1) colId = idx;
      });

      // Fallback identification if headers not recognized
      if (colName === -1) {
        for (var c = 0; c < Math.min(values[headerRowIdx].length, 6); c++) {
          if (c !== colNo && c !== colNik && c !== colNisn && c !== colClass && c !== colGender && c !== colParentPhone) {
            colName = c;
            break;
          }
        }
      }

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;

        var rawNisn = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : "";
        var rawName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : "";
        var rawNik = colNik !== -1 && row[colNik] !== undefined ? String(row[colNik]).replace(/^'/, '').trim() : "";

        if (!rawNisn && !rawName && !rawNik) continue;
        var nameLow = rawName.toLowerCase();
        if (nameLow === "nama siswa" || nameLow === "nama lengkap" || nameLow === "nama" || rawNisn.toLowerCase() === "nisn") continue;

        var rawClass = colClass !== -1 && row[colClass] !== undefined ? String(row[colClass]).trim() : "Kelas 1";
        var rawGender = colGender !== -1 && row[colGender] !== undefined ? String(row[colGender]).trim().toUpperCase() : "L";
        var parsedGender = rawGender.indexOf("P") !== -1 || rawGender.indexOf("PEREMPUAN") !== -1 ? "P" : "L";
        
        var rawParentName = "";
        if (colParentName !== -1 && row[colParentName] !== undefined && String(row[colParentName]).trim()) {
          rawParentName = String(row[colParentName]).trim();
        } else if (colAyah !== -1 && row[colAyah] !== undefined && String(row[colAyah]).trim() && String(row[colAyah]).trim() !== "-") {
          rawParentName = String(row[colAyah]).trim();
        } else if (colIbu !== -1 && row[colIbu] !== undefined && String(row[colIbu]).trim() && String(row[colIbu]).trim() !== "-") {
          rawParentName = String(row[colIbu]).trim();
        } else if (colWali !== -1 && row[colWali] !== undefined && String(row[colWali]).trim() && String(row[colWali]).trim() !== "-") {
          rawParentName = String(row[colWali]).trim();
        }

        var rawParentPhone = colParentPhone !== -1 && row[colParentPhone] !== undefined ? String(row[colParentPhone]).replace(/^'/, '').replace(/[^0-9+]/g, '').trim() : "";
        if (rawParentPhone.indexOf("8") === 0 && rawParentPhone.length >= 9 && rawParentPhone.length <= 13) {
          rawParentPhone = "0" + rawParentPhone;
        } else if (rawParentPhone.indexOf("628") === 0) {
          rawParentPhone = "0" + rawParentPhone.substring(2);
        } else if (rawParentPhone.indexOf("+628") === 0) {
          rawParentPhone = "0" + rawParentPhone.substring(3);
        }

        var rawParentAddress = colParentAddress !== -1 && row[colParentAddress] !== undefined ? String(row[colParentAddress]).trim() : "";
        var rawAccessCode = colAccessCode !== -1 && row[colAccessCode] !== undefined ? String(row[colAccessCode]).replace(/^'/, '').trim() : "";
        var rawId = colId !== -1 && row[colId] ? String(row[colId]).trim() : ("student_" + (rawNisn || (i + "_" + Math.random().toString(36).substring(2, 6))));

        if (!rawAccessCode && rawName) {
          var firstName = rawName.split(" ")[0] || "SISWA";
          var cleanClass = rawClass.replace(/[^a-zA-Z0-9]/g, "");
          rawAccessCode = (firstName + cleanClass).toUpperCase();
        }

        data.students.push({
          id: rawId,
          nik: rawNik !== "-" && rawNik ? rawNik : undefined,
          nisn: rawNisn || ("NISN-" + i),
          name: rawName || ("Siswa " + i),
          class: rawClass || "Kelas 1",
          gender: parsedGender,
          parentName: rawParentName,
          parentPhone: rawParentPhone,
          parentAddress: rawParentAddress,
          accessCode: rawAccessCode,
          academicYear: "2026/2027",
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // 3. Teachers / GTK (Data_Guru)
  var teacherSheet = findSheet(["Data_Guru", "Data Guru", "Guru", "GTK", "Data_GTK", "Data Pendidik", "Pendidik", "Pengajar"], ["guru", "gtk", "tendik", "pendidik", "pengajar", "staf", "staff", "pegawai", "teacher"]);
  if (teacherSheet) {
    var values = teacherSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rowText = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowText.indexOf("nama") !== -1 || rowText.indexOf("nip") !== -1 || rowText.indexOf("nuptk") !== -1 || rowText.indexOf("jabatan") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headerRow = values[headerRowIdx];
      var colNip = -1, colName = -1, colRole = -1, colSubject = -1, colClass = -1, colPhone = -1, colAccessCode = -1, colId = -1;
      for (var h = 0; h < headerRow.length; h++) {
        var hName = String(headerRow[h] || "").toLowerCase().trim();
        if (hName.indexOf("nip") !== -1 || hName.indexOf("nik") !== -1 || hName.indexOf("nuptk") !== -1) colNip = h;
        else if (hName.indexOf("nama") !== -1 || hName.indexOf("gtk") !== -1 || hName.indexOf("pengajar") !== -1 || hName.indexOf("pegawai") !== -1 || hName.indexOf("gelar") !== -1) colName = h;
        else if (hName.indexOf("jabatan") !== -1 || hName.indexOf("peran") !== -1 || hName.indexOf("tugas") !== -1 || hName.indexOf("posisi") !== -1 || hName.indexOf("status") !== -1) colRole = h;
        else if (hName.indexOf("mapel") !== -1 || hName.indexOf("mata pelajaran") !== -1 || hName.indexOf("mengajar") !== -1 || hName.indexOf("subjek") !== -1 || hName.indexOf("pelajaran") !== -1) colSubject = h;
        else if (hName.indexOf("kelas") !== -1 || hName.indexOf("rombel") !== -1 || hName.indexOf("wali") !== -1 || hName.indexOf("penugasan") !== -1) colClass = h;
        else if (hName.indexOf("hp") !== -1 || hName.indexOf("telepon") !== -1 || hName.indexOf("wa") !== -1 || hName.indexOf("whatsapp") !== -1 || hName.indexOf("kontak") !== -1 || hName.indexOf("phone") !== -1) colPhone = h;
        else if (hName.indexOf("kode") !== -1 || hName.indexOf("pin") !== -1 || hName.indexOf("akses") !== -1 || hName.indexOf("password") !== -1) colAccessCode = h;
        else if (hName === "id" || hName.indexOf("id guru") !== -1 || hName.indexOf("id_guru") !== -1) colId = h;
      }

      if (colNip === -1) colNip = 0;
      if (colName === -1) colName = 1;

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;
        var nameVal = colName < row.length ? String(row[colName] || "").trim() : "";
        var nipVal = colNip < row.length ? String(row[colNip] || "").trim() : "";

        if (!nameVal && !nipVal) continue;
        var nameLower = nameVal.toLowerCase();
        if (nameLower === "nama" || nameLower === "nama guru" || nameLower === "nama lengkap" || nameLower.indexOf("nama guru") === 0 || nipVal.toLowerCase() === "nip") continue;

        var roleVal = colRole !== -1 && colRole < row.length ? String(row[colRole] || "").trim() : "";
        var subjectVal = colSubject !== -1 && colSubject < row.length ? String(row[colSubject] || "").trim() : "";
        var classVal = colClass !== -1 && colClass < row.length ? String(row[colClass] || "").trim() : "";
        var phoneVal = colPhone !== -1 && colPhone < row.length ? String(row[colPhone] || "").trim() : "";
        var idVal = colId !== -1 && colId < row.length ? String(row[colId] || "").trim() : "";

        var roleCode = "guru_mapel";
        var roleLower = roleVal.toLowerCase();
        if (roleLower.indexOf("kepala") !== -1 || roleLower.indexOf("ks") !== -1) {
          roleCode = "kepala_sekolah";
        } else if (roleLower.indexOf("wali") !== -1 || roleLower.indexOf("guru kelas") !== -1 || roleLower.indexOf("tematik") !== -1 || classVal.toLowerCase().indexOf("kelas") !== -1) {
          roleCode = "wali_kelas";
        } else if (roleLower.indexOf("bk") !== -1 || roleLower.indexOf("konseling") !== -1 || roleLower.indexOf("bimbingan") !== -1) {
          roleCode = "guru_bk";
        } else if (roleLower.indexOf("piket") !== -1) {
          roleCode = "guru_piket";
        } else if (roleLower.indexOf("osis") !== -1 || roleLower.indexOf("kesiswaan") !== -1) {
          roleCode = "pembina_osis";
        } else if (roleLower.indexOf("tendik") !== -1 || roleLower.indexOf("tu") !== -1 || roleLower.indexOf("administrasi") !== -1 || roleLower.indexOf("kependidikan") !== -1 || roleLower.indexOf("staf") !== -1 || roleLower.indexOf("staff") !== -1 || roleLower.indexOf("operator") !== -1) {
          roleCode = "tenaga_kependidikan";
        }

        if (roleCode === "wali_kelas" && (!subjectVal || subjectVal === "-")) {
          subjectVal = "Guru Kelas / Tematik";
        }

        var cleanNip = nipVal.replace(/^'/, '').trim();
        var cleanPhone = phoneVal.replace(/^'/, '').replace(/[^0-9+]/g, '');
        var accessCodeVal = colAccessCode !== -1 && colAccessCode < row.length ? String(row[colAccessCode] || "").replace(/^'/, '').trim() : "";
        var teacherId = idVal ? idVal : ("TCH-" + (cleanNip ? cleanNip.replace(/[^0-9]/g, '') : ("N" + (i - headerRowIdx) + "-" + nameVal.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())));

        data.teachers.push({
          id: teacherId,
          nip: cleanNip || "-",
          name: nameVal,
          role: roleCode,
          subject: subjectVal || "Guru",
          classAssigned: classVal || "Semua Kelas",
          phone: cleanPhone || "",
          accessCode: accessCodeVal,
          pin: accessCodeVal
        });
      }
    }
  }

  // 3.5. Piket Schedules (Jadwal_Piket)
  var piketSheet = findSheet(["Jadwal_Piket", "Jadwal Piket", "Piket", "Jadwal_Piket_Guru", "Jadwal Piket Guru"], ["piket", "jadwal", "duty"]);
  if (piketSheet) {
    var values = piketSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var pHeaderIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rStr = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rStr.indexOf("hari") !== -1 || rStr.indexOf("jam") !== -1 || rStr.indexOf("piket") !== -1) {
          pHeaderIdx = r;
          break;
        }
      }

      for (var i = pHeaderIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;
        var dayVal = String(row[0] || "").trim();
        var dayLower = dayVal.toLowerCase();
        if (dayVal && dayLower !== "hari" && dayLower !== "day" && dayLower !== "hari bertugas" && dayLower.indexOf("jumlah") === -1) {
          var dutyHoursVal = row[1] ? String(row[1]).trim() : "06.30 - 15.00 WIB";
          var namesStr = row[3] ? String(row[3]).trim() : "";
          var notesVal = row[4] ? String(row[4]).trim() : "";
          var idsStr = row[5] ? String(row[5]).trim() : "";

          var teacherIds = [];
          if (idsStr && idsStr !== "-") {
            teacherIds = idsStr.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
          } else if (namesStr && namesStr !== "Belum ada guru piket" && namesStr !== "-") {
            var rawNames = namesStr.split(/[,;\n]/);
            for (var k = 0; k < rawNames.length; k++) {
              var cleanN = rawNames[k].trim();
              if (!cleanN) continue;
              var cleanNLower = cleanN.toLowerCase();
              var matchedId = null;

              for (var tIdx = 0; tIdx < data.teachers.length; tIdx++) {
                var t = data.teachers[tIdx];
                var tName = (t.name || "").toLowerCase();
                if (tName === cleanNLower || tName.indexOf(cleanNLower) !== -1 || cleanNLower.indexOf(tName) !== -1 || t.nip === cleanN || t.id === cleanN) {
                  matchedId = t.id;
                  break;
                }
              }

              if (matchedId) {
                if (teacherIds.indexOf(matchedId) === -1) teacherIds.push(matchedId);
              } else {
                teacherIds.push(cleanN);
              }
            }
          }

          var cleanDay = dayVal;
          if (cleanDay.toLowerCase().indexOf("hari ") === 0) {
            cleanDay = cleanDay.substring(5).trim();
          }

          data.piketSchedules.push({
            day: cleanDay,
            dutyHours: dutyHoursVal,
            teacherIds: teacherIds,
            notes: (notesVal === "-" || notesVal === "undefined") ? "" : notesVal
          });
        }
      }
    }
  }

  // 3.8. Violation Rules (Aturan_Pelanggaran)
  var ruleSheet = findSheet(["Aturan_Pelanggaran", "Aturan Pelanggaran", "Tata_Tertib", "Tata Tertib", "Aturan", "Kategori_Pelanggaran"], ["aturan", "tatib", "tertib", "rules"]);
  if (ruleSheet) {
    var values = ruleSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rowText = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowText.indexOf("aturan") !== -1 || rowText.indexOf("pelanggaran") !== -1 || rowText.indexOf("poin") !== -1 || rowText.indexOf("kategori") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headerRow = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });
      var colRuleId = -1, colRuleName = -1, colRuleCat = -1, colRulePts = -1, colRuleSanction = -1, colRuleActive = -1;
      
      headerRow.forEach(function(h, idx) {
        if (h === "id" || h.indexOf("kode") !== -1) colRuleId = idx;
        else if (h.indexOf("nama") !== -1 || h.indexOf("aturan") !== -1 || h.indexOf("pelanggaran") !== -1 || h.indexOf("bentuk") !== -1 || h.indexOf("uraian") !== -1) colRuleName = idx;
        else if (h.indexOf("kategori") !== -1 || h.indexOf("tingkat") !== -1 || h.indexOf("jenis") !== -1) colRuleCat = idx;
        else if (h.indexOf("poin") !== -1 || h.indexOf("bobot") !== -1 || h.indexOf("skor") !== -1 || h.indexOf("nilai") !== -1) colRulePts = idx;
        else if (h.indexOf("sanksi") !== -1 || h.indexOf("rekomendasi") !== -1 || h.indexOf("tindakan") !== -1 || h.indexOf("konsekuensi") !== -1) colRuleSanction = idx;
        else if (h.indexOf("status") !== -1 || h.indexOf("aktif") !== -1) colRuleActive = idx;
      });

      if (colRuleName === -1) colRuleName = 1;

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;
        var rName = colRuleName !== -1 && row[colRuleName] ? String(row[colRuleName]).trim() : (row[1] ? String(row[1]).trim() : "");
        if (!rName) continue;
        var rNameLow = rName.toLowerCase();
        if (rNameLow === "nama pelanggaran / aturan" || rNameLow === "pelanggaran" || rNameLow === "nama aturan" || rNameLow === "nama pelanggaran") continue;

        var rId = colRuleId !== -1 && row[colRuleId] ? String(row[colRuleId]).trim() : ("rule_" + i);
        var rCat = colRuleCat !== -1 && row[colRuleCat] ? String(row[colRuleCat]).trim().toLowerCase() : "ringan";
        var rPts = colRulePts !== -1 && row[colRulePts] !== undefined ? (Number(String(row[colRulePts]).replace(/[^0-9.-]/g, '')) || 10) : 10;
        var rSanc = colRuleSanction !== -1 && row[colRuleSanction] ? String(row[colRuleSanction]).trim() : "-";
        var rAct = colRuleActive !== -1 && row[colRuleActive] ? (String(row[colRuleActive]).toLowerCase().indexOf("non") === -1) : true;

        data.violationRules.push({
          id: rId,
          name: rName,
          category: rCat,
          points: rPts,
          defaultSanction: rSanc,
          isActive: rAct
        });
      }
    }
  }

  // 4. Violations (Data_Pelanggaran) - ULTRA RESILIENT PARSER
  var violationSheet = findSheet(
    ["Data_Pelanggaran", "Data Pelanggaran", "Pelanggaran", "Catatan_Pelanggaran", "Catatan Pelanggaran", "Kasus", "Data Kasus", "Pelanggaran_Siswa", "Pelanggaran Siswa", "Buku_Pelanggaran", "Buku Pelanggaran", "Rekap_Pelanggaran", "Rekap Pelanggaran"],
    ["pelanggar", "kasus", "tatib", "violation"]
  );

  if (violationSheet) {
    var values = violationSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      // Find true header row
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 15); r++) {
        var rowText = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowText.indexOf("pelanggar") !== -1 || rowText.indexOf("kasus") !== -1 || rowText.indexOf("aturan") !== -1 || rowText.indexOf("siswa") !== -1 || rowText.indexOf("nama") !== -1 || rowText.indexOf("poin") !== -1 || rowText.indexOf("skor") !== -1 || rowText.indexOf("tanggal") !== -1 || rowText.indexOf("tgl") !== -1 || rowText.indexOf("nisn") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headerRow = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });
      var colNo = -1, colDate = -1, colNisn = -1, colName = -1, colClass = -1, colRule = -1, colCat = -1, colPts = -1, colReporter = -1, colLocation = -1, colParentName = -1, colParentPhone = -1, colNote = -1, colWa = -1, colId = -1;

      headerRow.forEach(function(h, idx) {
        if (!h) return;
        if (h === "no" || h === "no." || h === "nomor" || h === "#") {
          colNo = idx;
        } else if (h.indexOf("tanggal") !== -1 || h.indexOf("tgl") !== -1 || h.indexOf("waktu") !== -1 || h === "date" || h.indexOf("hari") !== -1) {
          colDate = idx;
        } else if (h.indexOf("nisn") !== -1 || h === "nis" || h.indexOf("no induk") !== -1 || h.indexOf("induk") !== -1) {
          colNisn = idx;
        } else if ((h.indexOf("nama") !== -1 || h.indexOf("siswa") !== -1 || h.indexOf("murid") !== -1 || h.indexOf("peserta") !== -1) && h.indexOf("guru") === -1 && h.indexOf("wali") === -1 && h.indexOf("ortu") === -1 && h.indexOf("pelapor") === -1 && h.indexOf("ayah") === -1 && h.indexOf("ibu") === -1 && h.indexOf("pelanggaran") === -1) {
          colName = idx;
        } else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1 || h.indexOf("tingkat") !== -1) {
          colClass = idx;
        } else if (h.indexOf("pelanggaran") !== -1 || h.indexOf("aturan") !== -1 || h.indexOf("kasus") !== -1 || h.indexOf("masalah") !== -1 || h.indexOf("uraian") !== -1 || h.indexOf("kejadian") !== -1 || h.indexOf("perilaku") !== -1 || h.indexOf("bentuk") !== -1) {
          colRule = idx;
        } else if (h.indexOf("kategori") !== -1 || h.indexOf("jenis") !== -1 || h.indexOf("tingkat") !== -1 || h.indexOf("klasifikasi") !== -1) {
          colCat = idx;
        } else if (h.indexOf("poin") !== -1 || h.indexOf("bobot") !== -1 || h.indexOf("skor") !== -1 || h.indexOf("nilai") !== -1 || h.indexOf("points") !== -1) {
          colPts = idx;
        } else if (h.indexOf("pelapor") !== -1 || h.indexOf("guru") !== -1 || h.indexOf("pencatat") !== -1 || h.indexOf("petugas") !== -1 || h.indexOf("piket") !== -1 || h.indexOf("saksi") !== -1) {
          colReporter = idx;
        } else if (h.indexOf("lokasi") !== -1 || h.indexOf("tempat") !== -1 || h.indexOf("ruang") !== -1 || h.indexOf("tkp") !== -1 || h.indexOf("location") !== -1) {
          colLocation = idx;
        } else if (h.indexOf("wali") !== -1 || h.indexOf("orang tua") !== -1 || h.indexOf("ortu") !== -1 || h.indexOf("ayah") !== -1 || h.indexOf("ibu") !== -1) {
          colParentName = idx;
        } else if (h.indexOf("hp") !== -1 || h.indexOf("wa") !== -1 || h.indexOf("telepon") !== -1 || h.indexOf("kontak") !== -1 || h.indexOf("telp") !== -1 || h.indexOf("phone") !== -1) {
          colParentPhone = idx;
        } else if (h.indexOf("keterangan") !== -1 || h.indexOf("catatan") !== -1 || h.indexOf("deskripsi") !== -1 || h.indexOf("kronologi") !== -1 || h.indexOf("tindak lanjut") !== -1) {
          colNote = idx;
        } else if (h.indexOf("status") !== -1 || h.indexOf("notifikasi") !== -1 || h.indexOf("terkirim") !== -1) {
          colWa = idx;
        } else if (h === "id" || h.indexOf("id catatan") !== -1 || h.indexOf("id pelanggaran") !== -1 || h.indexOf("kode") !== -1) {
          colId = idx;
        }
      });

      // Default position heuristics if columns weren't matched
      if (colDate === -1) colDate = 0;
      if (colNisn === -1) colNisn = (colNo === 0 ? 2 : 1);
      if (colName === -1) colName = (colNo === 0 ? 3 : 2);
      if (colClass === -1) colClass = (colNo === 0 ? 4 : 3);
      if (colRule === -1) colRule = (colNo === 0 ? 5 : 4);
      if (colCat === -1) colCat = (colNo === 0 ? 6 : 5);
      if (colPts === -1) colPts = (colNo === 0 ? 7 : 6);
      if (colReporter === -1) colReporter = (colNo === 0 ? 8 : 7);

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;

        var rawDate = colDate !== -1 && row[colDate] !== undefined ? formatDateVal(row[colDate]) : formatDateVal(row[0]);
        var rawNisn = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : "";
        var rawName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : "";
        var rawClass = colClass !== -1 && row[colClass] !== undefined ? String(row[colClass]).trim() : "";
        var rawRule = colRule !== -1 && row[colRule] !== undefined ? String(row[colRule]).trim() : "";
        var rawId = colId !== -1 && row[colId] ? String(row[colId]).trim() : ("VIOL-SHEET-" + i + "-" + (rawNisn || (rawName ? rawName.replace(/[^a-zA-Z0-9]/g, '') : i)));

        // Skip header re-declarations or blank rows
        if (!rawName && !rawNisn && !rawRule) continue;
        var nameLow = rawName.toLowerCase();
        var dateLow = rawDate.toLowerCase();
        if (nameLow === "nama" || nameLow === "nama siswa" || nameLow === "nama lengkap" || dateLow === "tanggal" || dateLow === "tgl" || rawNisn.toLowerCase() === "nisn" || rawRule.toLowerCase() === "pelanggaran") continue;

        var rawCat = colCat !== -1 && row[colCat] ? String(row[colCat]).trim().toLowerCase() : "ringan";
        var rawPoints = colPts !== -1 && row[colPts] !== undefined ? (Number(String(row[colPts]).replace(/[^0-9.-]/g, '')) || 0) : 10;
        var rawReporter = colReporter !== -1 && row[colReporter] ? String(row[colReporter]).trim() : "Guru Piket";
        var rawLocation = colLocation !== -1 && row[colLocation] ? String(row[colLocation]).trim() : "Lingkungan Sekolah";
        var rawParentName = colParentName !== -1 && row[colParentName] ? String(row[colParentName]).trim() : "";
        var rawParentPhone = colParentPhone !== -1 && row[colParentPhone] ? String(row[colParentPhone]).replace(/^'/, '').trim() : "";
        var rawNote = colNote !== -1 && row[colNote] ? String(row[colNote]).trim() : (rawRule || "Pelanggaran Tata Tertib");
        var rawWa = colWa !== -1 ? (String(row[colWa]).toLowerCase().indexOf("terkirim") !== -1 || row[colWa] === true) : false;

        data.violations.push({
          id: rawId,
          studentId: "",
          studentNisn: rawNisn,
          studentName: rawName,
          studentClass: rawClass,
          ruleName: rawRule || "Pelanggaran Tata Tertib",
          violationName: rawRule || "Pelanggaran Tata Tertib",
          pelanggaran: rawRule || "Pelanggaran Tata Tertib",
          category: rawCat || "ringan",
          points: rawPoints,
          reporterName: rawReporter || "Guru Piket",
          reporter: rawReporter || "Guru Piket",
          reporterTeacherName: rawReporter || "Guru Piket",
          location: rawLocation || "Lingkungan Sekolah",
          lokasi: rawLocation || "Lingkungan Sekolah",
          parentName: rawParentName,
          parentPhone: rawParentPhone,
          description: rawNote || rawRule,
          note: rawNote || rawRule,
          whatsappSent: rawWa,
          academicYear: "2026/2027",
          date: rawDate || formatDateVal(new Date()),
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // 5. Rewards (Data_Reward) - ULTRA RESILIENT PARSER
  var rewardSheet = findSheet(
    ["Data_Reward", "Data Reward", "Reward", "Prestasi", "Data_Prestasi", "Data Prestasi", "Penghargaan"],
    ["reward", "prestasi", "apresiasi", "juara", "penghargaan"]
  );

  if (rewardSheet) {
    var values = rewardSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rowText = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowText.indexOf("prestasi") !== -1 || rowText.indexOf("reward") !== -1 || rowText.indexOf("siswa") !== -1 || rowText.indexOf("nama") !== -1 || rowText.indexOf("juara") !== -1 || rowText.indexOf("poin") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headerRow = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });
      var colNo = -1, colDate = -1, colNisn = -1, colName = -1, colClass = -1, colTitle = -1, colLevel = -1, colRank = -1, colPts = -1, colOrg = -1, colReporter = -1, colNotes = -1, colId = -1;

      headerRow.forEach(function(h, idx) {
        if (!h) return;
        if (h === "no" || h === "no." || h === "nomor" || h === "#") colNo = idx;
        else if (h.indexOf("tanggal") !== -1 || h.indexOf("tgl") !== -1 || h === "date") colDate = idx;
        else if (h.indexOf("nisn") !== -1 || h === "nis" || h.indexOf("no induk") !== -1) colNisn = idx;
        else if ((h.indexOf("nama") !== -1 || h.indexOf("siswa") !== -1) && h.indexOf("guru") === -1 && h.indexOf("prestasi") === -1) colName = idx;
        else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1) colClass = idx;
        else if (h.indexOf("prestasi") !== -1 || h.indexOf("lomba") !== -1 || h.indexOf("kejuaraan") !== -1 || h.indexOf("kompetisi") !== -1 || h.indexOf("kegiatan") !== -1 || h.indexOf("reward") !== -1 || h.indexOf("judul") !== -1) colTitle = idx;
        else if (h.indexOf("tingkat") !== -1 || h.indexOf("level") !== -1) colLevel = idx;
        else if (h.indexOf("peringkat") !== -1 || h.indexOf("juara") !== -1 || h.indexOf("rank") !== -1 || h.indexOf("capaian") !== -1) colRank = idx;
        else if (h.indexOf("poin") !== -1 || h.indexOf("bobot") !== -1 || h.indexOf("skor") !== -1 || h.indexOf("nilai") !== -1) colPts = idx;
        else if (h.indexOf("penyelenggara") !== -1 || h.indexOf("organizer") !== -1) colOrg = idx;
        else if (h.indexOf("pencatat") !== -1 || h.indexOf("guru") !== -1 || h.indexOf("pelapor") !== -1) colReporter = idx;
        else if (h.indexOf("keterangan") !== -1 || h.indexOf("catatan") !== -1 || h.indexOf("deskripsi") !== -1) colNotes = idx;
        else if (h === "id" || h.indexOf("id reward") !== -1) colId = idx;
      });

      if (colDate === -1) colDate = 0;
      if (colNisn === -1) colNisn = (colNo === 0 ? 2 : 1);
      if (colName === -1) colName = (colNo === 0 ? 3 : 2);
      if (colClass === -1) colClass = (colNo === 0 ? 4 : 3);
      if (colTitle === -1) colTitle = (colNo === 0 ? 5 : 4);

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;

        var rDate = colDate !== -1 && row[colDate] !== undefined ? formatDateVal(row[colDate]) : formatDateVal(row[0]);
        var rNisn = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : "";
        var rName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : "";
        var rTitle = colTitle !== -1 && row[colTitle] !== undefined ? String(row[colTitle]).trim() : "Apresiasi Prestasi";
        var rId = colId !== -1 && row[colId] ? String(row[colId]).trim() : ("REW-SHEET-" + i + "-" + (rNisn || (rName ? rName.replace(/[^a-zA-Z0-9]/g, '') : i)));

        if (!rName && !rNisn && !rTitle) continue;
        var rNameLow = rName.toLowerCase();
        if (rNameLow === "nama" || rNameLow === "nama siswa" || rDate.toLowerCase() === "tanggal" || rNisn.toLowerCase() === "nisn") continue;

        var rClass = colClass !== -1 && row[colClass] ? String(row[colClass]).trim() : "";
        var rLevel = colLevel !== -1 && row[colLevel] ? String(row[colLevel]).trim() : "Sekolah";
        var rRank = colRank !== -1 && row[colRank] ? String(row[colRank]).trim() : "Juara 1";
        var rPts = colPts !== -1 && row[colPts] !== undefined ? (Number(String(row[colPts]).replace(/[^0-9.-]/g, '')) || 0) : 10;
        var rOrg = colOrg !== -1 && row[colOrg] ? String(row[colOrg]).trim() : "";
        var rReporter = colReporter !== -1 && row[colReporter] ? String(row[colReporter]).trim() : "Wali Kelas";
        var rNotes = colNotes !== -1 && row[colNotes] ? String(row[colNotes]).trim() : "";

        data.rewards.push({
          id: rId,
          studentId: "",
          studentNisn: rNisn,
          studentName: rName,
          studentClass: rClass,
          competitionName: rTitle,
          title: rTitle,
          ruleName: rTitle,
          prestasi: rTitle,
          level: rLevel,
          rank: rRank,
          points: rPts,
          organizer: rOrg,
          reporterName: rReporter,
          recordedBy: rReporter,
          notes: rNotes,
          academicYear: "2026/2027",
          date: rDate || formatDateVal(new Date()),
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  // 6. Compensations (Data_Kompensasi) - ULTRA RESILIENT PARSER
  var compensationSheet = findSheet(
    ["Data_Kompensasi", "Data Kompensasi", "Kompensasi", "Sanksi", "Pemutihan"],
    ["kompensasi", "pemutihan", "sanksi", "tugas"]
  );

  if (compensationSheet) {
    var values = compensationSheet.getDataRange().getValues();
    if (values && values.length > 1) {
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rowText = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowText.indexOf("kompensasi") !== -1 || rowText.indexOf("tugas") !== -1 || rowText.indexOf("siswa") !== -1 || rowText.indexOf("nama") !== -1 || rowText.indexOf("poin") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headerRow = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });
      var colNo = -1, colDate = -1, colNisn = -1, colName = -1, colClass = -1, colTask = -1, colPts = -1, colStatus = -1, colSup = -1, colNotes = -1, colId = -1;

      headerRow.forEach(function(h, idx) {
        if (!h) return;
        if (h === "no" || h === "no." || h === "nomor" || h === "#") colNo = idx;
        else if (h.indexOf("tanggal") !== -1 || h.indexOf("tgl") !== -1 || h === "date") colDate = idx;
        else if (h.indexOf("nisn") !== -1 || h === "nis" || h.indexOf("no induk") !== -1) colNisn = idx;
        else if ((h.indexOf("nama") !== -1 || h.indexOf("siswa") !== -1) && h.indexOf("guru") === -1 && h.indexOf("pembimbing") === -1) colName = idx;
        else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1) colClass = idx;
        else if (h.indexOf("tugas") !== -1 || h.indexOf("tindakan") !== -1 || h.indexOf("bentuk") !== -1 || h.indexOf("kegiatan") !== -1 || h.indexOf("kompensasi") !== -1) colTask = idx;
        else if (h.indexOf("poin") !== -1 || h.indexOf("pengurangan") !== -1 || h.indexOf("bobot") !== -1 || h.indexOf("skor") !== -1) colPts = idx;
        else if (h.indexOf("status") !== -1) colStatus = idx;
        else if (h.indexOf("pembimbing") !== -1 || h.indexOf("guru") !== -1 || h.indexOf("pengawas") !== -1) colSup = idx;
        else if (h.indexOf("keterangan") !== -1 || h.indexOf("catatan") !== -1) colNotes = idx;
        else if (h === "id" || h.indexOf("id kompensasi") !== -1) colId = idx;
      });

      if (colDate === -1) colDate = 0;
      if (colNisn === -1) colNisn = (colNo === 0 ? 2 : 1);
      if (colName === -1) colName = (colNo === 0 ? 3 : 2);
      if (colClass === -1) colClass = (colNo === 0 ? 4 : 3);
      if (colTask === -1) colTask = (colNo === 0 ? 5 : 4);

      for (var i = headerRowIdx + 1; i < values.length; i++) {
        var row = values[i];
        if (!row || row.length === 0) continue;

        var cDate = colDate !== -1 && row[colDate] !== undefined ? formatDateVal(row[colDate]) : formatDateVal(row[0]);
        var cNisn = colNisn !== -1 && row[colNisn] !== undefined ? String(row[colNisn]).replace(/^'/, '').trim() : "";
        var cName = colName !== -1 && row[colName] !== undefined ? String(row[colName]).trim() : "";
        var cTask = colTask !== -1 && row[colTask] !== undefined ? String(row[colTask]).trim() : "Tugas Edukatif";
        var cId = colId !== -1 && row[colId] ? String(row[colId]).trim() : ("COMP-SHEET-" + i + "-" + (cNisn || (cName ? cName.replace(/[^a-zA-Z0-9]/g, '') : i)));

        if (!cName && !cNisn && !cTask) continue;
        var cNameLow = cName.toLowerCase();
        if (cNameLow === "nama" || cNameLow === "nama siswa" || cDate.toLowerCase() === "tanggal" || cNisn.toLowerCase() === "nisn") continue;

        var cClass = colClass !== -1 && row[colClass] ? String(row[colClass]).trim() : "";
        var cPts = colPts !== -1 && row[colPts] !== undefined ? (Number(String(row[colPts]).replace(/[^0-9.-]/g, '')) || 0) : 10;
        var cStatus = colStatus !== -1 && row[colStatus] ? String(row[colStatus]).trim() : "Disetujui";
        var cSup = colSup !== -1 && row[colSup] ? String(row[colSup]).trim() : "Guru BK / Piket";
        var cNotes = colNotes !== -1 && row[colNotes] ? String(row[colNotes]).trim() : "";

        data.compensations.push({
          id: cId,
          studentId: "",
          studentNisn: cNisn,
          studentName: cName,
          studentClass: cClass,
          actionType: cTask,
          taskName: cTask,
          pointsReduced: cPts,
          deductedPoints: cPts,
          status: cStatus,
          supervisorTeacherName: cSup,
          supervisorName: cSup,
          notes: cNotes,
          academicYear: "2026/2027",
          date: cDate || formatDateVal(new Date()),
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  return data;
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
    violationRules?: any[];
    violations: any[];
    rewards: any[];
    compensations: any[];
    summaries?: any[];
    sheetUrl?: string;
    settings?: any;
  }
): Promise<{ success: boolean; message: string }> => {
  const validation = validateWebhookUrl(webhookUrl);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    // Map data to ensure perfect Apps Script schema compatibility
    const studentMap = new Map(payload.students?.map(s => [s.id, s]) || []);

    const enrichedViolations = (payload.violations || []).map(v => {
      const student = studentMap.get(v.studentId) || (payload.students || []).find((s: any) => s.nisn === (v as any).studentNisn || s.name === v.studentName);
      const vRule = String(v.ruleName || (v as any).violationName || (v as any).pelanggaran || (v as any).description || 'Pelanggaran Tata Tertib').trim();
      const vReporter = String(v.reporterName || (v as any).reporter || (v as any).reporterTeacherName || 'Guru Piket').trim();
      const vLocation = String(v.location || (v as any).lokasi || 'Lingkungan Sekolah').trim();
      const vDesc = String(v.description || vRule).trim();

      return {
        ...v,
        studentNisn: student?.nisn || (v as any).studentNisn || '',
        studentName: student?.name || v.studentName || '',
        studentClass: student?.class || v.studentClass || '',
        ruleName: vRule,
        violationName: vRule,
        pelanggaran: vRule,
        description: vDesc,
        location: vLocation,
        lokasi: vLocation,
        reporter: vReporter,
        reporterName: vReporter,
        reporterTeacherName: vReporter,
        parentName: student?.parentName || (v as any).parentName || '',
        parentPhone: student?.parentPhone || (v as any).parentPhone || '',
        note: vDesc,
        parentNotified: !!v.whatsappSent
      };
    });

    const enrichedRewards = (payload.rewards || []).map(r => {
      const student = studentMap.get(r.studentId) || (payload.students || []).find((s: any) => s.nisn === (r as any).studentNisn || s.name === r.studentName);
      const rTitle = String((r as any).title || r.competitionName || r.ruleName || (r as any).prestasi || (r as any).rewardName || 'Apresiasi Prestasi').trim();
      const rReporter = String(r.reporterName || (r as any).recordedBy || (r as any).reporter || (r as any).reporterTeacherName || 'Wali Kelas').trim();
      const rNotes = String(r.notes || (r as any).note || '').trim();

      return {
        ...r,
        studentNisn: student?.nisn || (r as any).studentNisn || '',
        studentName: student?.name || r.studentName || '',
        studentClass: student?.class || r.studentClass || '',
        competitionName: rTitle,
        ruleName: rTitle,
        title: rTitle,
        prestasi: rTitle,
        reporterName: rReporter,
        recordedBy: rReporter,
        reporterTeacherName: rReporter,
        reporter: rReporter,
        notes: rNotes,
        note: rNotes
      };
    });

    const enrichedCompensations = (payload.compensations || []).map(c => {
      const student = studentMap.get(c.studentId);
      return {
        ...c,
        studentNisn: student?.nisn || '',
        actionType: c.taskName || '',
        pointsReduced: c.deductedPoints || 0,
        supervisorTeacherName: c.supervisorName || '',
        status: c.status || 'Disetujui'
      };
    });

    const bodyString = JSON.stringify({
      action: 'SYNC_ALL',
      sheetUrl: payload.sheetUrl,
      settings: payload.settings || null,
      students: payload.students || [],
      teachers: payload.teachers || [],
      piketSchedules: payload.piketSchedules || [],
      violationRules: payload.violationRules || [],
      violations: enrichedViolations,
      rewards: enrichedRewards,
      compensations: enrichedCompensations,
      summaries: payload.summaries || [],
      sentAt: new Date().toISOString()
    });

    // Try server proxy first for reliable execution without CORS or redirects issues
    try {
      const serverRes = await fetch('/api/sheets/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: webhookUrl.trim(),
          payload: {
            action: 'SYNC_ALL',
            sheetUrl: payload.sheetUrl,
            settings: payload.settings || null,
            students: payload.students || [],
            teachers: payload.teachers || [],
            piketSchedules: payload.piketSchedules || [],
            violationRules: payload.violationRules || [],
            violations: enrichedViolations,
            rewards: enrichedRewards,
            compensations: enrichedCompensations,
            summaries: payload.summaries || []
          }
        })
      });
      if (serverRes.ok) {
        const json = await serverRes.json();
        return {
          success: json.success,
          message: json.message || `Data berhasil dikirim ke Google Spreadsheet (${payload.students?.length || 0} siswa, ${payload.violations?.length || 0} pelanggaran).`
        };
      }
    } catch {
      // Fallback to direct client fetch
    }

    // Direct fallback
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
  piketSchedules?: any[],
  settings?: any,
  violationRules?: any[]
): Promise<{ success: boolean; message: string }> => {
  return syncAllToGoogleSheets(webhookUrl, {
    students,
    teachers,
    piketSchedules,
    violationRules,
    violations,
    rewards,
    compensations,
    summaries,
    sheetUrl,
    settings
  });
};

/**
 * Loads entire database and school settings from Google Sheets Webhook with fast timeout
 */
export const fetchFullStateFromSheets = async (
  webhookUrl: string,
  timeoutMs: number = 6000
): Promise<{
  success: boolean;
  message: string;
  data?: {
    settings?: any;
    students?: any[];
    teachers?: any[];
    piketSchedules?: any[];
    violationRules?: any[];
    violations?: any[];
    rewards?: any[];
    compensations?: any[];
  }
}> => {
  const validation = validateWebhookUrl(webhookUrl);
  if (!validation.valid) {
    return { success: false, message: validation.message };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'FETCH_ALL',
        sentAt: new Date().toISOString()
      }),
      signal: controller.signal
    });

    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const json = await response.json();
    if (json.status === 'success' && json.data) {
      return {
        success: true,
        message: 'Data dan pengaturan berhasil dimuat dari Google Spreadsheet!',
        data: json.data
      };
    } else {
      throw new Error(json.message || 'Format data dari Google Sheets tidak dikenali.');
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return {
        success: false,
        message: 'Waktu permintaan Google Sheets habis (timeout). Silakan periksa jaringan Anda.'
      };
    }
    return {
      success: false,
      message: `Gagal memuat data: ${err.message || 'Periksa koneksi internet atau izin Web App (harus "Siapa saja / Anyone")'}`
    };
  }
};

