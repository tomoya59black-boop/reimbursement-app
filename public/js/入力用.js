// ================================
// DOM取得
// ================================
const nameInput = document.getElementById("name");
const deptInput = document.getElementById("dept");
const purposeSelect = document.getElementById("purpose");
const categorySelect = document.getElementById("category");
const useDateInput = document.getElementById("useDate");
const receiptInput = document.getElementById("receiptInput");


const table = document.getElementById("detailTable");
const rowBtn = document.getElementById("rowBtn");
const addBtn = document.getElementById("addBtn");
const registerBtn = document.getElementById("registerBtn");

const list = document.getElementById("list");
const totalSpan = document.getElementById("total");


// ================================
// データ
// ================================
const tempRecords = [];        // 仮登録


// ================================
// イベント登録
// ================================
rowBtn.addEventListener("click", addRow);
addBtn.addEventListener("click", onAdd);
registerBtn.addEventListener("click", onRegister);
table.addEventListener("input", updateTableTotal);


// ================================
// 行追加
// ================================
function addRow() {
  const newRow = table.insertRow(-1);
  newRow.innerHTML = `
    <td><input type="text"></td>
    <td><input type="number" min="0"></td>
    <td><input type="number" min="0"></td>
    <td class="amount" min="0"></td>
  `;
}


// ================================
// テーブル → 配列
// ================================
function getTableData() {
  const rows = table.rows;
  const items = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const inputs = row.querySelectorAll("input");

    const name = inputs[0].value.trim();
    const price = Number(inputs[1].value) || 0;
    const qty = Number(inputs[2].value) || 0;
    const amount = price * qty;

    if (name === "" && qty === 0 && price === 0) continue;

    items.push({ name, price, qty, amount });
  }

  return items;
}


// ================================
// 金額計算
// ================================
function calcItemsTotal(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

function updateTableTotal() {
  const rows = table.rows;

  let total = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const inputs = row.querySelectorAll("input");

    const qty = Number(inputs[1].value) || 0;
    const price = Number(inputs[2].value) || 0;
    const amount = qty * price;

    // 🔥 各行の金額表示
    const amountCell = row.querySelector(".amount");
    if (amountCell) {
      amountCell.textContent = amount === 0 ? "" : amount.toLocaleString();
    }

    total += amount;
  }

  // 🔥 合計表示
  totalSpan.textContent = total.toLocaleString();
}


// ================================
// 入力データまとめ
// ================================
function getInputData() {
  const name = nameInput.value.trim();
  const dept = deptInput.value.trim();
  const purpose = purposeSelect.value;
  const category = categorySelect.value;
  const useDate = useDateInput.value;
  const receipt = receiptInput.files[0] || null;

  const items = getTableData();

  if (!name || !dept || !purpose || !category || !useDate || items.length === 0) {
    alert("未入力の欄があります");
    return null;
  }

  return {
    name,
    dept,
    purpose,
    category,
    useDate,
    items,
    totalAmount: calcItemsTotal(items),
    receipt,
    inputDateTime: getNowString()
  };
}


// ================================
// 仮登録
// ================================
function onAdd() {
  const record = getInputData();
  if (!record) return;

  tempRecords.push(record);
  renderTempList();
  clearInputs();

}

// ================================
// API送信
// ================================
async function sendToAPI(record) {
  
  console.log("record.receipt:", record.receipt);
  console.log("instanceof File:", record.receipt instanceof File);
  const formData = new FormData();
  formData.append("name", record.name);
  formData.append("dept", record.dept);
  formData.append("purpose", record.purpose);
  formData.append("category", record.category);
  formData.append("useDate", record.useDate);
  formData.append("items", JSON.stringify(record.items));
  formData.append("totalAmount", record.totalAmount);
  formData.append("inputDateTime", record.inputDateTime);

  if (record.receipt) {
    formData.append("receipt", record.receipt);
  }

  try {
    const res = await fetch("/api/reimbursements", {
      method: "POST",
      body: formData
    });

    const text = await res.text(); // ←重要
    console.log("API status:", res.status);
    console.log("API response:", text);

    return res.ok;
  } catch (err) {
    console.error("fetch error:", err);
    return false;
  }
}


// ================================
// 本登録（API送信 + 仮登録削除）
// ================================
async function onRegister() {
  if (tempRecords.length === 0) {
    alert("登録するデータがありません");
    return;
  }

  registerBtn.disabled = true;
  let successCount = 0;

  // 後ろから送信すると splice してもindexがズレない
  for (let i = tempRecords.length - 1; i >= 0; i--) {
    const record = tempRecords[i];
    const success = await sendToAPI(record);
    if (success) {
      tempRecords.splice(i, 1); // 送信成功したら削除
      successCount++;
    } else {
      alert(`送信失敗: ${record.name}`);
    }
  }

  renderTempList();
  registerBtn.disabled = false;

  if (successCount > 0) {
    alert(`${successCount}件の申請を送信しました`);

  }
}




// ================================
// 表示
// ================================
function renderTempList() {
  list.innerHTML = "";

  tempRecords.forEach((record, index) => {
    const li = document.createElement("li");
    const info = document.createElement("div");
    info.textContent =
      `${record.name}｜${record.dept}｜${record.useDate}｜` +
      `${record.purpose}｜${record.category}｜合計 ${record.totalAmount}円`;
    li.appendChild(info);

    // ===== 明細（テーブル内容）=====
    const detailUl = document.createElement("ul");
    record.items.forEach(item => {
      const dli = document.createElement("li");
      dli.textContent =
        `${item.name}：${item.price} × ${item.qty} = ${item.amount}円`;
      detailUl.appendChild(dli);

    });
    li.appendChild(detailUl);

    // ===== 領収書画像 =====
    if (record.receipt) {
      const img = document.createElement("img");
      img.style.maxWidth = "200px";
      img.style.display = "block";
      img.style.marginTop = "8px";

      const reader = new FileReader();
      reader.onload = e => {
        img.src = e.target.result;
      };
      reader.readAsDataURL(record.receipt);

      li.appendChild(img);
    }

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "削除";
    deleteBtn.onclick = () => {
      tempRecords.splice(index, 1);
      renderTempList();
    };

    li.appendChild(deleteBtn);
    list.appendChild(li);
  });
}


// ================================
// 入力クリア
// ================================
function clearInputs() {
  nameInput.value = "";
  deptInput.value = "";
  purposeSelect.value = "";
  categorySelect.value = "";
  useDateInput.value = "";
  receiptInput.value = "";

  while (table.rows.length > 3) {
    table.deleteRow(3);
  }

  for (let i = 1; i < table.rows.length; i++) {
    table.rows[i].querySelectorAll("input")
      .forEach(input => input.value = "");
  }

  for (let i = 1; i <= 2; i++) {
    const row = table.rows[i];
    if (!row) continue;

    row.querySelectorAll("input")
      .forEach(input => input.value = "");

    const amountCell = row.querySelector(".amount");
    if (amountCell) amountCell.textContent = "";
  }

  totalSpan.textContent = "0";
}


// ================================
// 日時
// ================================
function getNowString() {
  const now = new Date();
  return (
    `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()} ` +
    `${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}`
  );
}
