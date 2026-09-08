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

const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbx6UobChbf4diPF4l2gMU_v1crUtGY4DEVSQTknBgnFJ2Ioe4zps1LU7ACiHLxEl_4/exec";

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
    cachedConfig = {
      ...cachedConfig,
      ...loaded,
      googleSheetsWebhook: loaded.googleSheetsWebhook || DEFAULT_WEBHOOK_URL
    };
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

try {
  if (fs.existsSync(DB_FILE)) {
    cachedDb = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
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
    } catch {
      sseClients.delete(client);
    }
  }
}

// GET API: Retrieve real-time version for background pollers
app.get("/api/data/version", (req, res) => {
  return res.json({ success: true, version: dbVersion });
});

// GET API: Server-Sent Events stream for instant multi-device synchronization
app.get("/api/stream", (req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    "Connection": "keep-alive"
  });

  // Send initial connected event
  res.write(`data: ${JSON.stringify({ type: "CONNECTED", version: dbVersion })}\n\n`);
  sseClients.add(res);

  // Heartbeat to keep connection alive through proxies
  const heartbeat = setInterval(() => {
    try {
      res.write(": heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
      sseClients.delete(res);
    }
  }, 25000);

  req.on("close", () => {
    clearInterval(heartbeat);
    sseClients.delete(res);
  });
});

// GET API: Retrieve globally stored spreadsheet and webhook URL
app.get("/api/global-config", (req, res) => {
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
  if (cachedDb) {
    return res.json({ success: true, data: cachedDb, version: dbVersion });
  }
  return res.json({ success: true, data: null, version: dbVersion });
});

// POST API: Fast persistence of full local database cache
app.post("/api/data", (req, res) => {
  try {
    const data = req.body;
    cachedDb = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data), "utf-8");
    broadcastUpdate("local_save");
    return res.json({ success: true, version: dbVersion });
  } catch (err: any) {
    console.error("Error writing database cache:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

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
      if (Array.isArray(json.data.violations)) {
        cachedDb.violations = json.data.violations.map((v: any) => ({
          ...v,
          date: normalizeDateString(v.date)
        }));
        json.data.violations = cachedDb.violations;
      }
      if (Array.isArray(json.data.rewards)) {
        cachedDb.rewards = json.data.rewards.map((r: any) => ({
          ...r,
          date: normalizeDateString(r.date)
        }));
        json.data.rewards = cachedDb.rewards;
      }
      if (Array.isArray(json.data.compensations)) {
        cachedDb.compensations = json.data.compensations.map((c: any) => ({
          ...c,
          date: normalizeDateString(c.date)
        }));
        json.data.compensations = cachedDb.compensations;
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

// Automatically poll Google Sheets in the background every 3 minutes if webhook is set
setInterval(backgroundFetchGoogleSheets, 180000);

// POST API: Push data to Google Spreadsheet webhook via server proxy
app.post("/api/sheets/sync", async (req, res) => {
  try {
    const webhookUrl = (req.body?.webhookUrl || cachedConfig.googleSheetsWebhook || DEFAULT_WEBHOOK_URL).trim();
    if (!webhookUrl) {
      return res.status(400).json({ success: false, message: "URL Webhook Google Sheets belum dikonfigurasi." });
    }

    const payload = req.body?.payload || req.body;
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        ...payload,
        action: payload.action || "SYNC_ALL",
        sentAt: new Date().toISOString()
      }),
      redirect: "follow"
    });

    broadcastUpdate("sheets_sync");
    const json: any = await response.json().catch(() => ({ status: "success", message: "Data terkirim ke Google Sheets" }));
    return res.json({ success: true, message: json.message || "Data berhasil disinkronkan ke Google Spreadsheet", data: json });
  } catch (err: any) {
    console.error("Error in /api/sheets/sync:", err);
    return res.status(500).json({ success: false, message: err.message || "Gagal mengirim data ke Google Apps Script." });
  }
});

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
  });
}

startServer();
