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
    { name: "Pengaturan_Aplikasi", color: "#0F766E" },
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
    violations: [],
    rewards: [],
    compensations: []
  };

  // 1. Settings
  var settingsSheet = ss.getSheetByName("Pengaturan_Aplikasi");
  if (settingsSheet) {
    var values = settingsSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var key = values[i][0];
      var val = values[i][1];
      if (key) {
        var strVal = String(val);
        data.settings[key] = strVal;
        if (key === "headmasterName") data.settings["principalName"] = strVal;
        if (key === "headmasterNip") data.settings["principalNip"] = strVal;
      }
    }
  }

  // 2. Students (Data_Siswa)
  var studentSheet = ss.getSheetByName("Data_Siswa");
  if (studentSheet) {
    var values = studentSheet.getDataRange().getValues();
    if (values.length > 1) {
      // Find the header row (scan up to row 10 for a row containing key student column names)
      var headerRowIdx = 0;
      for (var r = 0; r < Math.min(values.length, 10); r++) {
        var rowStr = values[r].map(function(c) { return String(c || "").toLowerCase().trim(); }).join(" ");
        if (rowStr.indexOf("nisn") !== -1 || rowStr.indexOf("nik") !== -1 || rowStr.indexOf("nama siswa") !== -1 || rowStr.indexOf("kelas") !== -1 || rowStr.indexOf("rombel") !== -1 || rowStr.indexOf("siswa") !== -1) {
          headerRowIdx = r;
          break;
        }
      }

      var headers = values[headerRowIdx].map(function(h) { return String(h || "").toLowerCase().trim(); });

      var colNo = -1, colNik = -1, colNisn = -1, colName = -1, colClass = -1, colGender = -1, colParentName = -1, colAyah = -1, colIbu = -1, colWali = -1, colParentPhone = -1, colParentAddress = -1, colAccessCode = -1, colNotes = -1, colId = -1;

      headers.forEach(function(h, idx) {
        if (!h) return;
        if (h === "no" || h === "no." || h === "nomor" || h === "no urut" || h === "#") {
          colNo = idx;
        } else if (h.indexOf("hp") !== -1 || h.indexOf("wa") !== -1 || h.indexOf("telepon") !== -1 || h.indexOf("telp") !== -1 || h.indexOf("whatsapp") !== -1 || h.indexOf("kontak") !== -1 || h.indexOf("ponsel") !== -1 || h.indexOf("handphone") !== -1 || h.indexOf("phone") !== -1) {
          colParentPhone = idx;
        } else if (h === "nik" || h.indexOf("16 digit") !== -1 || (h.indexOf("nik") !== -1 && h.indexOf("teknik") === -1)) {
          colNik = idx;
        } else if (h.indexOf("nisn") !== -1 || h === "nis" || h.indexOf("no induk") !== -1 || h.indexOf("induk") !== -1) {
          colNisn = idx;
        } else if (h.indexOf("kelas") !== -1 || h.indexOf("rombel") !== -1 || h.indexOf("rombongan") !== -1 || h.indexOf("tingkat") !== -1) {
          colClass = idx;
        } else if (h.indexOf("kelamin") !== -1 || h.indexOf("gender") !== -1 || h === "l/p" || h === "jk" || h === "sex") {
          colGender = idx;
        } else if ((h.indexOf("nama siswa") !== -1 || h === "nama" || h.indexOf("nama lengkap") !== -1 || h.indexOf("peserta didik") !== -1 || h.indexOf("murid") !== -1) && h.indexOf("wali") === -1 && h.indexOf("orang") === -1 && h.indexOf("guru") === -1 && h.indexOf("ortu") === -1 && h.indexOf("ayah") === -1 && h.indexOf("ibu") === -1) {
          colName = idx;
        } else if (h.indexOf("nama ayah") !== -1 || h === "ayah" || h === "bapak") {
          colAyah = idx;
        } else if (h.indexOf("nama ibu") !== -1 || h.indexOf("ibu kandung") !== -1 || h === "ibu") {
          colIbu = idx;
        } else if (h.indexOf("nama wali") !== -1 || h === "wali" || h.indexOf("wali murid") !== -1) {
          colWali = idx;
        } else if (h.indexOf("orang tua") !== -1 || h.indexOf("orangtua") !== -1 || h.indexOf("ortu") !== -1 || h.indexOf("parent") !== -1) {
          colParentName = idx;
        } else if (h.indexOf("alamat") !== -1 || h.indexOf("domisili") !== -1 || h.indexOf("tempat tinggal") !== -1) {
          colParentAddress = idx;
        } else if (h.indexOf("kode") !== -1 || h.indexOf("akses") !== -1 || h.indexOf("pin") !== -1) {
          colAccessCode = idx;
        } else if (h.indexOf("catatan") !== -1 || h.indexOf("keterangan") !== -1) {
          colNotes = idx;
        } else if (h.indexOf("id sistem") !== -1 || h === "id" || h.indexOf("id_siswa") !== -1) {
          colId = idx;
        }
      });

      // Smart Heuristic Fallback if columns are not explicitly labeled
      var sampleRows = values.slice(headerRowIdx + 1, Math.min(values.length, headerRowIdx + 6));
      if (sampleRows.length > 0) {
        var numCols = sampleRows[0].length;
        for (var c = 0; c < numCols; c++) {
          if (c === colNo) continue;
          var sampleVals = sampleRows.map(function(r) { return String(r[c] || "").trim(); }).filter(Boolean);
          if (sampleVals.length === 0) continue;

          if (colNik === -1 && sampleVals.every(function(v) { return /^\d{16}$/.test(v.replace(/[^0-9]/g, '')); })) {
            colNik = c;
          } else if (colNisn === -1 && sampleVals.every(function(v) { return /^\d{8,10}$/.test(v.replace(/[^0-9]/g, '')); })) {
            colNisn = c;
          } else if (colGender === -1 && sampleVals.every(function(v) { return /^(l|p|laki|perempuan|pria|wanita)$/i.test(v); })) {
            colGender = c;
          } else if (colParentPhone === -1 && sampleVals.some(function(v) { return /^(\+?62|08)\d{8,13}$/.test(v.replace(/[^0-9+]/g, '')); })) {
            colParentPhone = c;
          } else if (colClass === -1 && sampleVals.some(function(v) { return /(kelas|rombel|[1-6]\s*[a-fA-F]?|[ivxIVX]+)/i.test(v); })) {
            colClass = c;
          }
        }
      }

      // Safe Name Fallback (find first text column that isn't NIK/NISN/No/Class/Phone)
      if (colName === -1) {
        for (var c = 0; c < 6; c++) {
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

        // Skip header re-declarations or completely empty rows
        if (!rawNisn && !rawName && !rawNik) continue;
        if (rawName.toLowerCase().indexOf("nama siswa") !== -1 || rawName.toLowerCase().indexOf("nama lengkap") !== -1) continue;

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
        var rawParentPhone = colParentPhone !== -1 && row[colParentPhone] !== undefined ? String(row[colParentPhone]).replace(/^'/, '').replace(/[^0-9+]/g, '') : "";
        var rawParentAddress = colParentAddress !== -1 && row[colParentAddress] !== undefined ? String(row[colParentAddress]).trim() : "";
        var rawAccessCode = colAccessCode !== -1 && row[colAccessCode] !== undefined ? String(row[colAccessCode]).replace(/^'/, '').trim() : "";
        var rawIdCandidate = colId !== -1 && row[colId] ? String(row[colId]).trim() : "";
        if (!rawIdCandidate || /^(\+?62|08)\d+$/.test(rawIdCandidate)) {
          rawIdCandidate = "student_" + (rawNisn || (i + "_" + Math.random().toString(36).substring(2, 6)));
        }
        var rawId = rawIdCandidate;

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

  // 3. Teachers
  var teacherSheet = ss.getSheetByName("Data_Guru");
  if (teacherSheet) {
    var values = teacherSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[1]) {
        data.teachers.push({
          nip: String(row[0] || ""),
          name: String(row[1] || ""),
          role: row[2] === "Kepala Sekolah" ? "kepala_sekolah" :
                row[2] === "Wali Kelas" ? "wali_kelas" :
                row[2] === "Guru Bimbingan Konseling (BK)" ? "guru_bk" :
                row[2] === "Guru Tim Piket" ? "guru_piket" :
                row[2] === "Pembina OSIS / Kesiswaan" ? "pembina_osis" : "guru_mapel",
          subject: String(row[3] || ""),
          classAssigned: String(row[4] || ""),
          phone: String(row[5] || ""),
          id: row[6] ? String(row[6]) : ("teacher_" + i)
        });
      }
    }
  }

  // 4. Violations
  var violationSheet = ss.getSheetByName("Data_Pelanggaran");
  if (violationSheet) {
    var values = violationSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[12] || row[1]) {
        data.violations.push({
          id: row[12] ? String(row[12]) : ("violation_" + i),
          studentId: "",
          studentNisn: String(row[1]),
          studentName: String(row[2]),
          studentClass: String(row[3]),
          ruleName: String(row[4]),
          category: String(row[5]),
          points: Number(row[6]) || 0,
          reporterName: String(row[7]),
          parentName: String(row[8]),
          parentPhone: String(row[9]),
          description: String(row[10] || ""),
          whatsappSent: row[11] === "Sudah Terkirim",
          academicYear: row[13] ? String(row[13]) : "2026/2027",
          date: String(row[0]),
          createdAt: row[14] ? String(row[14]) : new Date().toISOString()
        });
      }
    }
  }

  // 5. Rewards
  var rewardSheet = ss.getSheetByName("Data_Reward");
  if (rewardSheet) {
    var values = rewardSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[11] || row[1]) {
        data.rewards.push({
          id: row[11] ? String(row[11]) : ("reward_" + i),
          studentId: "",
          studentNisn: String(row[1]),
          studentName: String(row[2]),
          studentClass: String(row[3]),
          competitionName: String(row[4]),
          level: String(row[5]),
          rank: String(row[6]),
          points: Number(row[7]) || 0,
          organizer: String(row[8]),
          reporterName: String(row[9]),
          notes: String(row[10] || ""),
          academicYear: row[12] ? String(row[12]) : "2026/2027",
          date: String(row[0]),
          createdAt: row[13] ? String(row[13]) : new Date().toISOString()
        });
      }
    }
  }

  // 6. Compensations
  var compensationSheet = ss.getSheetByName("Data_Kompensasi");
  if (compensationSheet) {
    var values = compensationSheet.getDataRange().getValues();
    for (var i = 1; i < values.length; i++) {
      var row = values[i];
      if (row[9] || row[1]) {
        data.compensations.push({
          id: row[9] ? String(row[9]) : ("compensation_" + i),
          studentId: "",
          studentNisn: String(row[1]),
          studentName: String(row[2]),
          studentClass: String(row[3]),
          taskName: String(row[4]),
          deductedPoints: Number(row[5]) || 0,
          status: String(row[6] || "Disetujui"),
          supervisorName: String(row[7]),
          notes: String(row[8] || ""),
          academicYear: row[10] ? String(row[10]) : "2026/2027",
          date: String(row[0]),
          createdAt: row[11] ? String(row[11]) : new Date().toISOString()
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
      const student = studentMap.get(v.studentId);
      return {
        ...v,
        studentNisn: student?.nisn || '',
        violationName: v.ruleName || '',
        reporterTeacherName: v.reporterName || '',
        parentName: student?.parentName || '',
        parentPhone: student?.parentPhone || '',
        note: v.description || '',
        parentNotified: !!v.whatsappSent
      };
    });

    const enrichedRewards = (payload.rewards || []).map(r => {
      const student = studentMap.get(r.studentId);
      return {
        ...r,
        studentNisn: student?.nisn || '',
        reporterTeacherName: r.reporterName || '',
        note: r.notes || ''
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
      violations: enrichedViolations,
      rewards: enrichedRewards,
      compensations: enrichedCompensations,
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
  piketSchedules?: any[],
  settings?: any
): Promise<{ success: boolean; message: string }> => {
  return syncAllToGoogleSheets(webhookUrl, {
    students,
    teachers,
    piketSchedules,
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

