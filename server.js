const express = require("express");
const path = require("path");
const multer = require("multer");
const sqlite3 = require("sqlite3").verbose();
const XLSX = require("xlsx");


const app = express();
const PORT = process.env.PORT || 3000;


const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

// ===== SQLite =====
const path = require("path");

const dbPath = path.join(__dirname, "reimbursements.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB接続失敗", err);
  } else {
    console.log("SQLite接続成功");
  }
  if (err) {
    console.error("DB接続失敗", err);
  } else {
    console.log("SQLite接続成功");
  }
});

// テーブル作成（なければ）
db.run(`
  CREATE TABLE IF NOT EXISTS reimbursements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    dept TEXT,
    purpose TEXT,
    category TEXT,
    useDate TEXT,
    items TEXT,
    totalAmount INTEGER,
    receiptPath TEXT,
    inputDateTime TEXT
  )
`);

// ===== middleware =====
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static("uploads"));

// multer


// 保存先とファイル名を指定
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    console.log("originalname:", file.originalname);
    console.log("mimetype:", file.mimetype);
    // 元の拡張子を付ける
    const ext = path.extname(file.originalname); // 例: ".jpg"
    cb(null, file.fieldname + "-" + Date.now() + ext);
  }
});

const upload = multer({ storage: storage });

// ===== API =====
app.post("/api/reimbursements", upload.single("receipt"), (req, res) => {
  try {
    const {
      name,
      dept,
      purpose,
      category,
      useDate,
      items,
      totalAmount,
      inputDateTime
    } = req.body;

    const receiptPath = req.file ? req.file.path : null;

    db.run(
      `
      INSERT INTO reimbursements
      (name, dept, purpose, category, useDate, items, totalAmount, receiptPath, inputDateTime)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        name,
        dept,
        purpose,
        category,
        useDate,
        items,
        totalAmount,
        receiptPath,
        inputDateTime
      ],
      function (err) {
        if (err) {
          console.error("DB保存エラー:", err);
          return res.status(500).json({ error: "DB保存失敗" });
        }
        res.json({ ok: true, id: this.lastID });
      }
    );
  } catch (e) {
    console.error("API例外:", e);
    res.status(500).json({ error: "サーバーエラー" });
  }
});




// ===== 一覧取得API =====
app.get("/api/reimbursements", (req, res) => {
  db.all(
    "SELECT * FROM reimbursements ORDER BY id DESC",
    (err, rows) => {
      if (err) {
        console.error("取得エラー:", err);
        return res.status(500).json({ error: "取得失敗" });
      }
      res.json(rows);
    }
  );
});




// ===== 起動 =====
app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});

