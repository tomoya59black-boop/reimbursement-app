const tableBody = document.querySelector("#dataTable tbody");

async function loadData() {
  const res = await fetch("/api/reimbursements");
  const data = await res.json();

  // ==========================
  // 月ごとにグループ化
  // ==========================
  const groupedByMonth = {};

  data.forEach(row => {
    const month = row.useDate.slice(0, 7);

    if (!groupedByMonth[month]) {
      groupedByMonth[month] = [];
    }

    groupedByMonth[month].push(row);
  });

  const tabs = document.getElementById("monthTabs");
  const container = document.getElementById("sheetContainer");

  tabs.innerHTML = "";
  container.innerHTML = "";

  Object.keys(groupedByMonth)
    .sort().reverse()
    .forEach((month, index) => {

    // ▼ タブ作成
    const btn = document.createElement("button");
    btn.textContent = month;
    btn.style.marginRight = "5px";

    btn.onclick = () => {
      document.querySelectorAll(".sheet").forEach(s => s.style.display = "none");
      document.getElementById(`sheet-${month}`).style.display = "block";
    };

    tabs.appendChild(btn);

    // ▼ シート作成
    const sheet = document.createElement("div");
    sheet.id = `sheet-${month}`;
    sheet.className = "sheet";
    sheet.style.display = index === 0 ? "block" : "none";

    // ==========================
    // 🔥 個人別合計を計算（←ここに移動）
    // ==========================
    const personalTotals = {};

    groupedByMonth[month].forEach(row => {
      if (!personalTotals[row.name]) {
        personalTotals[row.name] = 0;
      }
      personalTotals[row.name] += Number(row.totalAmount);
    });

    // ==========================
    // 🔥 個人別合計テーブル作成
    // ==========================
    const summaryTable = document.createElement("table");
    summaryTable.border = "1";
    summaryTable.style.marginBottom = "15px";

    summaryTable.innerHTML = `
    <thead>
      <tr>
        <th>名前</th>
        <th>合計金額</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

    const summaryBody = summaryTable.querySelector("tbody");

    Object.keys(personalTotals).forEach(name => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${name}</td>
      <td>¥${personalTotals[name].toLocaleString()}</td>
    `;
      summaryBody.appendChild(tr);
    });

    // ==========================
    // 🔥 明細テーブル作成（今までのやつ）
    // ==========================
    const table = document.createElement("table");
    table.border = "1";

    table.innerHTML = `
    <thead>
      <tr>
        <th>ID</th>
        <th>名前</th>
        <th>部署</th>
        <th>事業項目</th>
        <th>利用種別</th>
        <th>発生日</th>
        <th>内訳</th>
        <th>金額</th>
        <th>領収書</th>
        <th>入力日時</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;

    const tbody = table.querySelector("tbody");

    groupedByMonth[month].forEach(row => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td>${row.id}</td>
      <td>${row.name}</td>
      <td>${row.dept}</td>
      <td>${row.purpose}</td>
      <td>${row.category}</td>
      <td>${row.useDate}</td>
      <td>
        ${
          JSON.parse(row.items)
            .map(item => `${item.name} ${item.amount.toLocaleString()}円`)
            .join("<br>")
        }
      </td>
      <td>¥${Number(row.totalAmount).toLocaleString()}</td>
      <td>${row.receipt}</td>
      <td>${row.inputDateTime}</td>
    `;
      tbody.appendChild(tr);
    });

    // 🔥 追加順が重要
    sheet.appendChild(summaryTable);  // 上
    sheet.appendChild(table);         // 下

    container.appendChild(sheet);
  });
}


/* =========================
   Excelダウンロード（仮）
========================= */
function downloadExcel() {
  alert("Excel機能はサーバー実装後に有効になります");
}

/* =========================
   初期表示
========================= */
document.addEventListener("DOMContentLoaded", () => {
  loadData();
});