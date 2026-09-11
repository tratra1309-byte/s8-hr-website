const http = require("http");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Load .env without needing any extra npm package.
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const i = trimmed.indexOf("=");
    if (i < 0) continue;
    const key = trimmed.slice(0, i).trim();
    let value = trimmed.slice(i + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    if (!process.env[key]) process.env[key] = value;
  }
}

const PORT = Number(process.env.PORT || 8088);
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const CHAT_ID = process.env.TELEGRAM_CHAT_ID || "";
const ROOT = __dirname;

const mime = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".svg": "image/svg+xml"
};

function sendTelegram(text) {
  return new Promise((resolve, reject) => {
    if (!BOT_TOKEN || !CHAT_ID) return reject(new Error("Thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID trong file .env"));
    const body = JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: "HTML", disable_web_page_preview: true });
    const req = https.request({ hostname: "api.telegram.org", path: `/bot${BOT_TOKEN}/sendMessage`, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, res => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => {
        try {
          const json = JSON.parse(data);
          if (!json.ok) return reject(new Error(json.description || "Telegram API error"));
          resolve(json);
        } catch { reject(new Error("Phản hồi Telegram không hợp lệ")); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function esc(value) {
  return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => { body += chunk; if (body.length > 100000) req.destroy(); });
    req.on("end", () => { try { resolve(JSON.parse(body || "{}")); } catch { reject(new Error("Dữ liệu form không hợp lệ")); } });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/apply") {
      const data = await readBody(req);
      if (data.website) return respond(res, 400, { ok: false, message: "Yêu cầu không hợp lệ." });
      if (!data.name || !data.phone || !data.position) return respond(res, 400, { ok: false, message: "Vui lòng điền Họ tên, Số điện thoại và Vị trí." });
      const now = new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", dateStyle: "short", timeStyle: "medium" }).format(new Date());
      const message = `🟡 <b>ỨNG VIÊN MỚI — TPJ | S8</b>\n\n` +
        `👤 <b>Họ tên:</b> ${esc(data.name)}\n` +
        `📞 <b>SĐT:</b> ${esc(data.phone)}\n` +
        `💬 <b>Telegram:</b> ${esc(data.telegram || "Không cung cấp")}\n` +
        `💼 <b>Vị trí:</b> ${esc(data.position)}\n` +
        `🧩 <b>Kinh nghiệm:</b> ${esc(data.experience || "Không cung cấp")}\n` +
        `📝 <b>Ghi chú:</b> ${esc(data.note || "Không có")}\n\n` +
        `🕒 <b>Thời gian:</b> ${esc(now)}`;
      await sendTelegram(message);
      return respond(res, 200, { ok: true });
    }

    if (req.method !== "GET" && req.method !== "HEAD") return respond(res, 405, { ok: false, message: "Method not allowed" });
    let urlPath = decodeURIComponent(req.url.split("?")[0]);
    if (urlPath === "/") urlPath = "/index.html";
    const filePath = path.normalize(path.join(ROOT, urlPath));
    if (!filePath.startsWith(ROOT)) return respond(res, 403, { ok: false, message: "Forbidden" });
    fs.stat(filePath, (err, stat) => {
      if (err || !stat.isFile()) return respond(res, 404, { ok: false, message: "Not found" });
      res.writeHead(200, { "Content-Type": mime[path.extname(filePath).toLowerCase()] || "application/octet-stream" });
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(filePath).pipe(res);
    });
  } catch (e) {
    console.error(e);
    respond(res, 500, { ok: false, message: e.message || "Lỗi máy chủ." });
  }
});

function respond(res, status, data) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify(data));
}

server.listen(PORT, () => console.log(`TPJ | S8 website running at http://localhost:${PORT}`));
