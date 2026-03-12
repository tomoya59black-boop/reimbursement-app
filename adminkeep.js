const tableBody = document.querySelector("#dataTable tbody");

async function loadData() {
  const res = await fetch("/api/reimbursements");
  const data = await res.json();

  const tbody = document.querySelector("#dataTable tbody");
  tbody.innerHTML = "";

  data.forEach(row => {
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
      <td>${row.inputDateTime}</td>
      <td>${row.receipt}</td>
    `;

    tbody.appendChild(tr);
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