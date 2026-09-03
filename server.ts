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

const DEFAULT_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbyc9XP8BPzTKcGNlcna12L31mYhotfGnJLFXhA8EhYtG2wG7lO9AQq9Aet3hu7WMjo/exec";

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
    return res.json({ success: true, config });
  } catch (err: any) {
    console.error("Error writing global config:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
});

// GET API: Retrieve full fast local database cache
app.get("/api/data", (req, res) => {
  if (cachedDb) {
    return res.json({ success: true, data: cachedDb });
  }
  return res.json({ success: true, data: null });
});

// POST API: Fast persistence of full local database cache
app.post("/api/data", (req, res) => {
  try {
    const data = req.body;
    cachedDb = data;
    fs.writeFileSync(DB_FILE, JSON.stringify(data), "utf-8");
    return res.json({ success: true });
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
      return res.json({
        success: true,
        message: json.message || "Data berhasil dimuat dari Google Spreadsheet",
        data: json.data
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
