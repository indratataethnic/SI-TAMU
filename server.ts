import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

const CONFIG_DIR = path.join(process.cwd(), "data");
const CONFIG_FILE = path.join(CONFIG_DIR, "global-config.json");

// Ensure data folder exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

// GET API: Retrieve globally stored spreadsheet and webhook URL
app.get("/api/global-config", (req, res) => {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const data = fs.readFileSync(CONFIG_FILE, "utf-8");
      return res.json(JSON.parse(data));
    }
  } catch (err) {
    console.error("Error reading global config:", err);
  }
  return res.json({
    googleSheetsWebhook: "https://script.google.com/macros/s/AKfycbyGbfZdmd1fop8QjjBAlFAe3ZRbfCpa0Ql1wxBrDoKMtzkWig4-FQOw9pN56HVKujc/exec",
    googleSheetsUrl: ""
  });
});

// POST API: Store spreadsheet and webhook URL globally
app.post("/api/global-config", (req, res) => {
  try {
    const { googleSheetsWebhook, googleSheetsUrl } = req.body;
    const config = {
      googleSheetsWebhook: googleSheetsWebhook || "",
      googleSheetsUrl: googleSheetsUrl || ""
    };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), "utf-8");
    return res.json({ success: true, config });
  } catch (err: any) {
    console.error("Error writing global config:", err);
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
