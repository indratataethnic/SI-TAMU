import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));

const CONFIG_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(CONFIG_DIR, "global-config.json");
const DB_FILE = path.join(CONFIG_DIR, "app-db.json");

const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbzfi6UuJ0WRhDrtSqcdIGbpmJlwiqZJHqz91fQSR2p8VyP6NV38TVd5wTlD_Fo7zn8/exec";

// Ensure data folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// In-memory caches for sub-millisecond response
let cachedConfig: any = {
  googleSheetsWebhook: DEFAULT_WEBHOOK_URL,
  googleSheetsUrl: "",
  settings: null
};
let cachedDb: any = null;

try {
  if (fs.existsSync(CONFIG_FILE)) {
    const loaded = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    const rawWebhook = (loaded.googleSheetsWebhook || "").trim();
    const isObsolete = !rawWebhook || rawWebhook.includes("AKfycbyc9XP8BPzTKcGN") || rawWebhook.includes("AKfycbyBJJxFH7yOZLtD1IB61Gfi9LvZc0MnpPc0FdV7GjdxIuCx4tRrOOfE5fD7FqyLwys");
    const cleanWebhook = isObsolete ? DEFAULT_WEBHOOK_URL : rawWebhook;

    cachedConfig = {
      ...cachedConfig,
      ...loaded,
      googleSheetsWebhook: cleanWebhook
    };
    if (isObsolete) {
      fs.writeFileSync(CONFIG_FILE, JSON.stringify(cachedConfig, null, 2), "utf-8");
    }
  } else {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cachedConfig, null, 2), "utf-8");
  }
} catch (e) {
  cachedConfig = {
    googleSheetsWebhook: DEFAULT_WEBHOOK_URL,
    googleSheetsUrl: "",
    settings: null
  };
}

function normalizeDateString(val: any): string {
  if (!val) return new Date().toISOString().slice(0, 10);
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    const parts = s.split('/');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return s.slice(0, 10);
}

function normalizeDbRecords(db: any) {
  if (!db) return db;
  if (Array.isArray(db.violations)) {
    db.violations = db.violations.map((v: any) => {
      const vRule = v.ruleName || v.pelanggaran || v.violationName || v.description || "Pelanggaran Tata Tertib";
      const vReporter = v.reporterName || v.reporter || v.reporterTeacherName || "Guru Piket";
      const vLocation = v.location || v.lokasi || "Lingkungan Sekolah";
      return {
        ...v,
        ruleName: vRule,
        violationName: vRule,
        pelanggaran: vRule,
        reporterName: vReporter,
        reporter: vReporter,
        reporterTeacherName: vReporter,
        location: vLocation,
        lokasi: vLocation,
        date: normalizeDateString(v.date)
      };
    });
  }
  if (Array.isArray(db.rewards)) {
    db.rewards = db.rewards.map((r: any) => {
      const rTitle = r.title || r.competitionName || r.ruleName || r.prestasi || r.rewardName || "Apresiasi Prestasi";
      const rReporter = r.reporterName || r.recordedBy || r.reporter || r.reporterTeacherName || "Guru";
      return {
        ...r,
        ruleName: rTitle,
        competitionName: rTitle,
        title: rTitle,
        reporterName: rReporter,
        recordedBy: rReporter,
        reporterTeacherName: rReporter,
        date: normalizeDateString(r.date)
      };
    });
  }
  return db;
}

try {
  if (fs.existsSync(DB_FILE)) {
    cachedDb = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    normalizeDbRecords(cachedDb);
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), "utf-8");
  }
} catch (e) {
  cachedDb = null;
}

// Multi-device real-time sync state
let dbVersion = Date.now();
const sseClients = new Set<express.Response>();

function broadcastUpdate(reason = "data_changed") {
  dbVersion = Date.now();
  const payload = JSON.stringify({
    type: "DATA_UPDATED",
    version: dbVersion,
    reason,
    timestamp: new Date().toISOString()
  });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
      if (typeof (client as any).flush === "function") {
        (client as any).flush();
      }
    } catch {
      sseClients.delete(client);
    }
  }
}

// GET API: Retrieve real-time version for background pollers
app.get("/api/data/version", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.json({ success: true, version: dbVersion });
});

// GET API: Server-Sent Events stream for instant multi-device synchronization
app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    "Connection": "keep-alive",
    "X-Accel-Buffering": "no"
  });

  if (typeof (res as any).flushHeaders === "function") {
    (res as any).flushHeaders();
  }

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", version: dbVersion })}\n\n`);
  if (typeof (res as any).flush === "function") {
    (res as any).flush();
  }
  sseClients.add(res);

  // Heartbeat to keep connection alive through proxies & Cloud Run
  const heartbeat = setInterval(() => {
    try {
      res.write(": keepalive\n\n");
      if (typeof (res as any).flush === "function") {
        (res as any).flush();
      }
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 10000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// GET API: Retrieve globally stored spreadsheet and webhook URL
app.get("/api/global-config", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (cachedConfig) {
    return res.json(cachedConfig);
  }
  return res.json({
    googleSheetsWebhook: DEFAULT_WEBHOOK_URL,
    googleSheetsUrl: "",
    settings: null
  });
});

// POST API: Store spreadsheet, webhook URL and settings globally
app.post("/api/global-config", (req, res) => {
  try {
    const { googleSheetsWebhook, googleSheetsUrl, settings } = req.body;
    const config = {
      googleSheetsWebhook: googleSheetsWebhook || DEFAULT_WEBHOOK_URL,
      googleSheetsUrl: googleSheetsUrl || "",
      settings: settings || null
    };
    cachedConfig = config;
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    broadcastUpdate("config_updated");
    return res.json({ success: true, config });
  } catch (err: any) {
    console.error("Error writing global config:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET API: Retrieve full fast local database cache
app.get("/api/data", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  if (cachedDb) {
    normalizeDbRecords(cachedDb);
    return res.json({ success: true, data: cachedDb, version: dbVersion });
  }
  return res.json({ success: true, data: null, version: dbVersion });
});

// POST API: Fast persistence of full local database cache
app.post("/api/data", (req, res) => {
  try {
    const incoming = req.body || {};
    if (!cachedDb) cachedDb = {};

    // 1. Violations: save exact list from client
    if (Array.isArray(incoming.violations)) {
      cachedDb.violations = incoming.violations.map((v: any) => {
        const vRule = v.ruleName || v.pelanggaran || v.violationName || v.description || "Pelanggaran Tata Tertib";
        const vReporter = v.reporterName || v.reporter || v.reporterTeacherName || "Guru Piket";
        const vLocation = v.location || v.lokasi || "Lingkungan Sekolah";
        return {
          ...v,
          ruleName: vRule,
          violationName: vRule,
          pelanggaran: vRule,
          reporterName: vReporter,
          reporter: vReporter,
          reporterTeacherName: vReporter,
          location: vLocation,
          lokasi: vLocation,
          date: normalizeDateString(v.date)
        };
      });
    }

    // 2. Rewards: save exact list from client
    if (Array.isArray(incoming.rewards)) {
      cachedDb.rewards = incoming.rewards.map((r: any) => {
        const rTitle = r.title || r.competitionName || r.ruleName || r.prestasi || r.rewardName || "Apresiasi Prestasi";
        const rReporter = r.reporterName || r.recordedBy || r.reporter || r.reporterTeacherName || "Guru";
        return {
          ...r,
          ruleName: rTitle,
          competitionName: rTitle,
          title: rTitle,
          reporterName: rReporter,
          recordedBy: rReporter,
          reporterTeacherName: rReporter,
          date: normalizeDateString(r.date)
        };
      });
    }

    // 3. Compensations: save exact list from client
    if (Array.isArray(incoming.compensations)) {
      cachedDb.compensations = incoming.compensations.map((c: any) => ({
        ...c,
        date: normalizeDateString(c.date)
      }));
    }

    // 4. Students, Teachers, Piket, Settings
    if (Array.isArray(incoming.students) && incoming.students.length > 0) {
      cachedDb.students = incoming.students;
    }
    if (Array.isArray(incoming.teachers) && incoming.teachers.length > 0) {
      cachedDb.teachers = incoming.teachers;
    }
    if (Array.isArray(incoming.piketSchedules) && incoming.piketSchedules.length > 0) {
      cachedDb.piketSchedules = incoming.piketSchedules;
    }
    if (incoming.settings) {
      cachedDb.settings = { ...(cachedDb.settings || {}), ...incoming.settings };
    }

    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), "utf-8");
    broadcastUpdate("local_save");
    return res.json({ success: true, version: dbVersion, data: cachedDb });
  } catch (err: any) {
    console.error("Error writing database cache:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// POST API: Fetch data from Google Spreadsheet webhook via server proxy (no CORS issues, follows redirects)
app.post("/api/sheets/fetch", async (req, res) => {
  try {
    const webhookUrl = (req.body?.webhookUrl || cachedConfig.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
    if (!webhookUrl) {
      return res.status(400).json({ success: false, message: "URL Webhook Google Sheets belum dikonfigurasi." });
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "FETCH_ALL", sentAt: new Date().toISOString() }),
      redirect: "follow"
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: `HTTP status dari Google: ${response.status}` });
    }

    const json: any = await response.json();
    if (json.status === "success" && json.data) {
      // Sync into server cachedDb so all devices (HP, laptop, desktop) get the exact same fresh data!
      if (!cachedDb) cachedDb = {};
      if (Array.isArray(json.data.students) && json.data.students.length > 0) {
        const existingStudents = Array.isArray(cachedDb.students) ? cachedDb.students : [];
        const existingByName = new Map<string, any>();
        const existingByNisn = new Map<string, any>();
        existingStudents.forEach((s: any) => {
          if (s.name) existingByName.set(String(s.name).trim().toLowerCase(), s);
          if (s.nisn && s.nisn.length >= 8 && !['L', 'P', 'LK', 'PR'].includes(s.nisn.toUpperCase())) {
            existingByNisn.set(String(s.nisn).trim().toLowerCase(), s);
          }
        });

        cachedDb.students = json.data.students.map((s: any) => {
          const sName = String(s.name || '').trim().toLowerCase();
          const rawNisn = String(s.nisn || '').trim();
          const isCorruptedNisn = !rawNisn || ['L', 'P', 'LK', 'PR', '-'].includes(rawNisn.toUpperCase()) || rawNisn.replace(/[^0-9]/g, '').length < 8;
          const match = existingByName.get(sName) || (!isCorruptedNisn ? existingByNisn.get(rawNisn.toLowerCase()) : null);

          const rawAccess = String(s.accessCode || '').trim().toUpperCase();
          const isCorruptedAccess = !rawAccess || ['STL', 'STP', 'ST-L', 'ST-P', '-'].includes(rawAccess);

          return {
            ...match,
            ...s,
            id: (s.id && !s.id.startsWith('STU-L-') && !s.id.startsWith('STU-P-') && s.id !== 'STD-L' && s.id !== 'STD-P') ? s.id : (match?.id || s.id),
            nisn: !isCorruptedNisn ? rawNisn : (match?.nisn || s.nisn),
            accessCode: !isCorruptedAccess ? rawAccess : (match?.accessCode || s.accessCode)
          };
        });
        json.data.students = cachedDb.students;
      }
      if (Array.isArray(json.data.teachers) && json.data.teachers.length > 0) {
        cachedDb.teachers = json.data.teachers;
      }
      if (Array.isArray(json.data.piketSchedules) && json.data.piketSchedules.length > 0) {
        cachedDb.piketSchedules = json.data.piketSchedules;
      }
      if (Array.isArray(json.data.violationRules) && json.data.violationRules.length > 0) {
        cachedDb.violationRules = json.data.violationRules;
      }
      const studentMapByName = new Map<string, any>((cachedDb.students || []).map((s: any) => [String(s.name || '').toLowerCase().replace(/\s+/g, ' ').trim(), s]));
      const studentMapByNisn = new Map<string, any>((cachedDb.students || []).filter((s: any) => s.nisn && String(s.nisn).length >= 8).map((s: any) => [String(s.nisn).trim().toLowerCase(), s]));
      const studentMapById = new Map<string, any>((cachedDb.students || []).map((s: any) => [String(s.id).trim(), s]));

      if (Array.isArray(json.data.violations)) {
        if (json.data.violations.length > 0 || !cachedDb.violations || cachedDb.violations.length === 0) {
          cachedDb.violations = json.data.violations.map((v: any) => {
            const vNisn = (v.studentNisn ? String(v.studentNisn) : '').replace(/^'/, '').trim().toLowerCase();
            const vName = String(v.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const student = (v.studentId ? studentMapById.get(String(v.studentId).trim()) : null) ||
                            (vNisn && vNisn.length >= 8 ? studentMapByNisn.get(vNisn) : null) ||
                            (vName ? studentMapByName.get(vName) : null);
            const vRule = v.ruleName || v.pelanggaran || v.violationName || v.description || "Pelanggaran Tata Tertib";
            const vReporter = v.reporterName || v.reporter || v.reporterTeacherName || "Guru Piket";
            const vLocation = v.location || v.lokasi || "Lingkungan Sekolah";
            return {
              ...v,
              studentId: student ? student.id : (v.studentId || ''),
              studentName: student ? student.name : (v.studentName || ''),
              studentClass: student ? student.class : (v.studentClass || ''),
              studentNisn: student ? student.nisn : (v.studentNisn ? String(v.studentNisn).replace(/^'/, '').trim() : ''),
              ruleName: vRule,
              violationName: vRule,
              pelanggaran: vRule,
              reporterName: vReporter,
              reporter: vReporter,
              reporterTeacherName: vReporter,
              location: vLocation,
              lokasi: vLocation,
              date: normalizeDateString(v.date)
            };
          });
        }
        json.data.violations = cachedDb.violations || [];
      }
      if (Array.isArray(json.data.rewards)) {
        if (json.data.rewards.length > 0 || !cachedDb.rewards || cachedDb.rewards.length === 0) {
          cachedDb.rewards = json.data.rewards.map((r: any) => {
            const rNisn = (r.studentNisn ? String(r.studentNisn) : '').replace(/^'/, '').trim().toLowerCase();
            const rName = String(r.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const student = (r.studentId ? studentMapById.get(String(r.studentId).trim()) : null) ||
                            (rNisn && rNisn.length >= 8 ? studentMapByNisn.get(rNisn) : null) ||
                            (rName ? studentMapByName.get(rName) : null);
            const rTitle = r.title || r.competitionName || r.ruleName || r.prestasi || r.rewardName || "Apresiasi Prestasi";
            const rReporter = r.reporterName || r.recordedBy || r.reporter || r.reporterTeacherName || "Guru";
            return {
              ...r,
              studentId: student ? student.id : (r.studentId || ''),
              studentName: student ? student.name : (r.studentName || ''),
              studentClass: student ? student.class : (r.studentClass || ''),
              studentNisn: student ? student.nisn : (r.studentNisn ? String(r.studentNisn).replace(/^'/, '').trim() : ''),
              ruleName: rTitle,
              competitionName: rTitle,
              title: rTitle,
              reporterName: rReporter,
              recordedBy: rReporter,
              reporterTeacherName: rReporter,
              date: normalizeDateString(r.date)
            };
          });
        }
        json.data.rewards = cachedDb.rewards || [];
      }
      if (Array.isArray(json.data.compensations)) {
        if (json.data.compensations.length > 0 || !cachedDb.compensations || cachedDb.compensations.length === 0) {
          cachedDb.compensations = json.data.compensations.map((c: any) => {
            const cNisn = (c.studentNisn ? String(c.studentNisn) : '').replace(/^'/, '').trim().toLowerCase();
            const cName = String(c.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const student = (c.studentId ? studentMapById.get(String(c.studentId).trim()) : null) ||
                            (cNisn && cNisn.length >= 8 ? studentMapByNisn.get(cNisn) : null) ||
                            (cName ? studentMapByName.get(cName) : null);
            return {
              ...c,
              studentId: student ? student.id : (c.studentId || ''),
              studentName: student ? student.name : (c.studentName || ''),
              studentClass: student ? student.class : (c.studentClass || ''),
              studentNisn: student ? student.nisn : (c.studentNisn ? String(c.studentNisn).replace(/^'/, '').trim() : ''),
              date: normalizeDateString(c.date)
            };
          });
        }
        json.data.compensations = cachedDb.compensations || [];
      }
      if (json.data.settings) {
        cachedDb.settings = { ...(cachedDb.settings || {}), ...json.data.settings };
      }
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb), "utf-8");
      } catch (e) {
        console.error("Error writing cachedDb to file:", e);
      }
      broadcastUpdate("sheets_fetch");

      return res.json({
        success: true,
        message: json.message || "Data berhasil dimuat dari Google Spreadsheet",
        data: json.data,
        sheetNames: json.sheetNames || json.data?.sheetNames || []
      });
    } else {
      return res.json({
        success: false,
        message: json.message || "Format data dari Google Sheets tidak dikenali.",
        data: null
      });
    }
  } catch (err: any) {
    console.error("Error in /api/sheets/fetch:", err);
    return res.status(500).json({ success: false, message: err.message || "Gagal menghubungi Google Apps Script." });
  }
});

// POST API: Push full state or single update to Google Spreadsheet webhook via server proxy
app.post("/api/sheets/sync", async (req, res) => {
  try {
    const webhookUrl = (req.body?.webhookUrl || cachedConfig.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
    if (!webhookUrl) {
      return res.status(400).json({ success: false, message: "URL Webhook Google Sheets belum dikonfigurasi." });
    }

    const payload = req.body?.payload || req.body;
    const bodyString = JSON.stringify({
      action: payload.action || "SYNC_ALL",
      settings: payload.settings || cachedDb?.settings || null,
      students: payload.students || cachedDb?.students || [],
      teachers: payload.teachers || cachedDb?.teachers || [],
      piketSchedules: payload.piketSchedules || cachedDb?.piketSchedules || [],
      violationRules: payload.violationRules || cachedDb?.violationRules || [],
      violations: payload.violations || cachedDb?.violations || [],
      rewards: payload.rewards || cachedDb?.rewards || [],
      compensations: payload.compensations || cachedDb?.compensations || [],
      summaries: payload.summaries || [],
      sentAt: new Date().toISOString()
    });

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: bodyString,
      redirect: "follow"
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: `HTTP status dari Google: ${response.status}` });
    }

    const json: any = await response.json();
    return res.json({
      success: json.status === "success",
      message: json.message || "Data berhasil disinkronkan ke Google Spreadsheet"
    });
  } catch (err: any) {
    console.error("Error in /api/sheets/sync:", err);
    return res.status(500).json({ success: false, message: err.message || "Gagal menghubungi Google Apps Script." });
  }
});

// Helper function to fetch latest from Google Sheets silently in the background
async function backgroundFetchGoogleSheets() {
  try {
    const webhookUrl = (cachedConfig?.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
    if (!webhookUrl) return;

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "FETCH_ALL", sentAt: new Date().toISOString() }),
      redirect: "follow"
    });

    if (!response.ok) return;
    const json: any = await response.json();
    if (json.status === "success" && json.data) {
      if (!cachedDb) cachedDb = {};
      if (Array.isArray(json.data.students) && json.data.students.length > 0) {
        cachedDb.students = json.data.students;
      }
      if (Array.isArray(json.data.teachers)) cachedDb.teachers = json.data.teachers;
      if (Array.isArray(json.data.piketSchedules)) cachedDb.piketSchedules = json.data.piketSchedules;
      if (Array.isArray(json.data.violationRules)) cachedDb.violationRules = json.data.violationRules;
      if (Array.isArray(json.data.rewardRules)) cachedDb.rewardRules = json.data.rewardRules;
      if (Array.isArray(json.data.violations)) cachedDb.violations = json.data.violations;
      if (Array.isArray(json.data.rewards)) cachedDb.rewards = json.data.rewards;
      if (Array.isArray(json.data.compensations)) cachedDb.compensations = json.data.compensations;
      if (json.data.settings) cachedDb.settings = { ...(cachedDb.settings || {}), ...json.data.settings };
      fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb), "utf-8");
      broadcastUpdate("background_sheets_fetch");
    }
  } catch {
    // Non-blocking background fetch
  }
}

// Periodic background sync from Google Spreadsheet to keep central cache and all devices 100% up-to-date
let isCheckingSheets = false;
let lastSyncedSheetsSignature = "";

async function checkSpreadsheetBackground() {
  if (isCheckingSheets) return;
  const webhookUrl = (cachedConfig?.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
  if (!webhookUrl) return;

  try {
    isCheckingSheets = true;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ action: "FETCH_ALL", sentAt: new Date().toISOString() }),
      redirect: "follow"
    });

    if (response.ok) {
      const json: any = await response.json();
      if (json?.status === "success" && json?.data) {
        const fetchedViolations = json.data.violations || [];
        const fetchedRewards = json.data.rewards || [];
        const fetchedCompensations = json.data.compensations || [];

        // Build signature to detect ANY modifications (not just length changes)
        const currentSignature = JSON.stringify({
          v: fetchedViolations.map((v: any) => [v.id, v.studentId || v.studentName, v.points, v.date, v.ruleName || v.pelanggaran]),
          r: fetchedRewards.map((r: any) => [r.id, r.studentId || r.studentName, r.points, r.date, r.title || r.prestasi]),
          c: fetchedCompensations.map((c: any) => [c.id, c.studentId || c.studentName, c.status, c.deductedPoints || c.pointsReduced]),
          sCount: json.data.students?.length || 0,
          tCount: json.data.teachers?.length || 0
        });

        if (currentSignature !== lastSyncedSheetsSignature || !cachedDb || !cachedDb.violations) {
          lastSyncedSheetsSignature = currentSignature;
          if (!cachedDb) cachedDb = {};

          const studentList = (json.data.students && json.data.students.length > 0) ? json.data.students : (cachedDb.students || []);
          const studentMapByName = new Map<string, any>(studentList.map((s: any) => [String(s.name || '').toLowerCase().replace(/\s+/g, ' ').trim(), s]));
          const studentMapByNisn = new Map<string, any>(studentList.filter((s: any) => s.nisn && String(s.nisn).length >= 8).map((s: any) => [String(s.nisn).trim().toLowerCase(), s]));
          const studentMapById = new Map<string, any>(studentList.map((s: any) => [String(s.id).trim(), s]));

          const existingViolations = Array.isArray(cachedDb?.violations) ? cachedDb.violations : [];
          const existingRewards = Array.isArray(cachedDb?.rewards) ? cachedDb.rewards : [];

          const mappedViolations = fetchedViolations.map((v: any) => {
            const vNisn = (v.studentNisn ? String(v.studentNisn) : '').trim().toLowerCase();
            const vName = String(v.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const student = (v.studentId ? studentMapById.get(String(v.studentId).trim()) : null) ||
                            (vNisn && vNisn.length >= 8 ? studentMapByNisn.get(vNisn) : null) ||
                            (vName ? studentMapByName.get(vName) : null);
            const vRule = v.ruleName || v.pelanggaran || v.violationName || v.description || "Pelanggaran Tata Tertib";
            const vReporter = v.reporterName || v.reporter || v.reporterTeacherName || "Guru Piket";
            const vLocation = v.location || v.lokasi || "Lingkungan Sekolah";
            return {
              ...v,
              studentId: student ? student.id : (v.studentId || ''),
              studentName: student ? student.name : (v.studentName || ''),
              studentClass: student ? student.class : (v.studentClass || ''),
              studentNisn: student ? student.nisn : ((v as any).studentNisn || ''),
              ruleName: vRule,
              violationName: vRule,
              pelanggaran: vRule,
              reporterName: vReporter,
              reporter: vReporter,
              reporterTeacherName: vReporter,
              location: vLocation,
              lokasi: vLocation,
              date: normalizeDateString(v.date)
            };
          });

          const vioMap = new Map<string, any>();
          existingViolations.forEach((v: any) => { if (v && v.id) vioMap.set(v.id, v); });
          mappedViolations.forEach((v: any) => { if (v && v.id) vioMap.set(v.id, v); });

          const mappedRewards = fetchedRewards.map((r: any) => {
            const rNisn = (r.studentNisn ? String(r.studentNisn) : '').trim().toLowerCase();
            const rName = String(r.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
            const student = (r.studentId ? studentMapById.get(String(r.studentId).trim()) : null) ||
                            (rNisn && rNisn.length >= 8 ? studentMapByNisn.get(rNisn) : null) ||
                            (rName ? studentMapByName.get(rName) : null);
            const rTitle = r.title || r.competitionName || r.ruleName || r.prestasi || r.rewardName || "Apresiasi Prestasi";
            const rReporter = r.reporterName || r.recordedBy || r.reporter || r.reporterTeacherName || "Guru";
            return {
              ...r,
              studentId: student ? student.id : (r.studentId || ''),
              studentName: student ? student.name : (r.studentName || ''),
              studentClass: student ? student.class : (r.studentClass || ''),
              studentNisn: student ? student.nisn : ((r as any).studentNisn || ''),
              ruleName: rTitle,
              competitionName: rTitle,
              title: rTitle,
              reporterName: rReporter,
              recordedBy: rReporter,
              reporterTeacherName: rReporter,
              date: normalizeDateString(r.date)
            };
          });

          const rewMap = new Map<string, any>();
          existingRewards.forEach((r: any) => { if (r && r.id) rewMap.set(r.id, r); });
          mappedRewards.forEach((r: any) => { if (r && r.id) rewMap.set(r.id, r); });

          cachedDb = {
            ...cachedDb,
            ...json.data,
            violations: Array.from(vioMap.values()),
            rewards: Array.from(rewMap.values()),
            compensations: fetchedCompensations.map((c: any) => {
              const cNisn = (c.studentNisn ? String(c.studentNisn) : '').trim().toLowerCase();
              const cName = String(c.studentName || '').toLowerCase().replace(/\s+/g, ' ').trim();
              const student = (c.studentId ? studentMapById.get(String(c.studentId).trim()) : null) ||
                              (cNisn && cNisn.length >= 8 ? studentMapByNisn.get(cNisn) : null) ||
                              (cName ? studentMapByName.get(cName) : null);
              return {
                ...c,
                studentId: student ? student.id : (c.studentId || ''),
                studentName: student ? student.name : (c.studentName || ''),
                studentClass: student ? student.class : (c.studentClass || ''),
                studentNisn: student ? student.nisn : ((c as any).studentNisn || ''),
                date: normalizeDateString(c.date)
              };
            })
          };
          if (!fs.existsSync(CONFIG_DIR)) {
            fs.mkdirSync(CONFIG_DIR, { recursive: true });
          }
          fs.writeFileSync(DB_FILE, JSON.stringify(cachedDb, null, 2), "utf-8");
          broadcastUpdate("sheets_auto_sync");
          console.log(`[Auto-Sync] Google Spreadsheet updated & broadcasted to devices (${fetchedViolations.length} violations, ${fetchedRewards.length} rewards).`);
        }
      }
    }
  } catch (err: any) {
    // silently catch background error
  } finally {
    isCheckingSheets = false;
  }
}

// Background poll every 12 seconds
setInterval(checkSpreadsheetBackground, 12000);

// Vite server integration
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SI TAMU Server] Running on http://localhost:${PORT}`);
    // Run initial sync with Google Spreadsheet immediately on startup!
    setTimeout(checkSpreadsheetBackground, 1000);
  });
}

startServer();
