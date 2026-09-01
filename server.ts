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

// Ensure data folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// In-memory caches for sub-millisecond response
let cachedConfig: any = null;
let cachedDb: any = null;

try {
  if (fs.existsSync(CONFIG_FILE)) {
    cachedConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
  }
} catch (e) {
  cachedConfig = null;
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
    googleSheetsWebhook: "",
    googleSheetsUrl: "",
    settings: null
  });
});

// POST API: Store spreadsheet, webhook URL and settings globally
app.post("/api/global-config", (req, res) => {
  try {
    const { googleSheetsWebhook, googleSheetsUrl, settings } = req.body;
    const config = {
      googleSheetsWebhook: googleSheetsWebhook || "",
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
