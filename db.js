const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const db = new sqlite3.Database(
  path.join(__dirname, "data.db"),
  (err) => {
    if (err) {
      console.error("DB接続エラー", err);
    } else {
      console.log("SQLite接続成功");
    }
  }
);

module.exports = db;
