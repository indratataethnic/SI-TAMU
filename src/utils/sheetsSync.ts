export const getGoogleAppsScriptTemplate = (schoolName: string = 'SMPN 1 Teladan') => {
  return `/**
 * =========================================================================
 * GOOGLE APPS SCRIPT DATABASE PENGHUBUNG SI TAMU
 * Sekolah: ${schoolName}
 * =========================================================================
 * CARA PEMASANGAN (Hanya butuh 1 menit):
 * 1. Buka Google Spreadsheet baru di Google Drive Anda.
 * 2. Klik menu "Ekstensi" (Extensions) > pilih "Apps Script".
 * 3. Hapus semua kode yang ada, lalu salin dan tempel (Paste) SELURUH KODE DI BAWAH INI.
 * 4. Klik tombol "Simpan" (ikon disket).
 * 5. Klik tombol biru "Terapkan" (Deploy) di kanan atas > pilih "Penerapan Baru" (New Deployment).
 * 6. Pilih jenis: "Aplikasi Web" (Web App).
 * 7. Pada "Akses" (Who has access), pilih: "Siapa saja" (Anyone).
 * 8. Klik "Terapkan" (Deploy), lalu Salin URL Aplikasi Web yang dihasilkan.
 * 9. Tempelkan URL tersebut ke kolom Webhook Google Spreadsheet di Pengaturan SI TAMU!
 * =========================================================================
 */

function doPost(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var postData = JSON.parse(e.postData.contents);
    var action = postData.action;

    if (action === "SYNC_ALL" || action === "INIT_SHEETS") {
      setupSheets(ss);
      
      if (postData.teachers) writeDataToSheet(ss, "Data_Guru", postData.teachers);
      if (postData.students) writeDataToSheet(ss, "Data_Siswa", postData.students);
      if (postData.violations) writeDataToSheet(ss, "Data_Pelanggaran", postData.violations);
      if (postData.rewards) writeDataToSheet(ss, "Data_Reward", postData.rewards);
      if (postData.compensations) writeDataToSheet(ss, "Data_Kompensasi", postData.compensations);

      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Data SI TAMU berhasil disinkronkan ke Google Spreadsheet!",
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: "Action tidak dikenali."
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "online",
    message: "Google Apps Script SI TAMU siap menerima sinkronisasi data!",
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function setupSheets(ss) {
  var requiredSheets = ["Data_Guru", "Data_Siswa", "Data_Pelanggaran", "Data_Reward", "Data_Kompensasi"];
  requiredSheets.forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.setTabColor("#064E3B"); // Emerald Green
    }
  });
}

function writeDataToSheet(ss, sheetName, items) {
  if (!items || items.length === 0) return;
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  sheet.clear();

  // Extract headers
  var firstItem = items[0];
  var headers = Object.keys(firstItem);
  sheet.appendRow(headers);

  // Format header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground("#064E3B");
  headerRange.setFontColor("#FFFFFF");
  headerRange.setFontWeight("bold");

  // Map values
  var rows = items.map(function(item) {
    return headers.map(function(header) {
      var val = item[header];
      if (typeof val === 'object' && val !== null) {
        return JSON.stringify(val);
      }
      return val !== undefined ? val : "";
    });
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  }
}
`;
};

export const testGoogleSheetsWebhook = async (webhookUrl: string): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl || !webhookUrl.startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Apps Script belum valid.' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'GET',
      mode: 'no-cors'
    });
    return { 
      success: true, 
      message: 'Koneksi ke Google Apps Script berhasil terhubung! (Mode No-CORS Web App)' 
    };
  } catch (err: any) {
    return { success: false, message: `Gagal menghubungkan ke Webhook: ${err.message}` };
  }
};

export const syncAllToGoogleSheets = async (
  webhookUrl: string,
  payload: {
    teachers?: any[];
    students: any[];
    violations: any[];
    rewards: any[];
    compensations: any[];
  }
): Promise<{ success: boolean; message: string }> => {
  if (!webhookUrl) {
    return { success: false, message: 'URL Webhook belum diisi.' };
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'SYNC_ALL',
        ...payload
      })
    });

    return {
      success: true,
      message: 'Perintah sinkronisasi berhasil dikirim ke Google Spreadsheet Anda!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Sinkronisasi gagal: ${err.message}`
    };
  }
};

export const syncFullStateToSheets = async (
  webhookUrl: string,
  students: any[],
  violations: any[],
  rewards: any[],
  compensations: any[],
  summaries?: any[],
  teachers?: any[]
): Promise<{ success: boolean; message: string }> => {
  return syncAllToGoogleSheets(webhookUrl, {
    teachers,
    students,
    violations,
    rewards,
    compensations
  });
};
