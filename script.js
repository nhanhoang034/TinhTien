let allData = [];

// Đọc file CSV
Papa.parse("data.csv", {
  download: true,
  header: true,
  complete: function(results) {
    allData = results.data;
    renderFilters(allData);
    renderTable(allData);
  }
});

// Sinh bảng
function renderTable(data) {
  const table = document.getElementById("data-table");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  if (data.length === 0) {
    thead.innerHTML = "";
    tbody.innerHTML = "<tr><td colspan='10'>Không có dữ liệu</td></tr>";
    return;
  }

  // Header
  const headers = Object.keys(data[0]);
  thead.innerHTML = "<tr>" + headers.map(h => `<th>${h}</th>`).join("") + "</tr>";

  // Body
  tbody.innerHTML = "";
  data.forEach(row => {
    let tr = "<tr>";
    headers.forEach(h => {
      tr += `<td>${row[h] || ""}</td>`;
    });
    tr += "</tr>";
    tbody.innerHTML += tr;
  });
}

// Sinh bộ lọc
function renderFilters(data) {
  const monthSelect = document.getElementById("filterMonth");
  const khoanSelect = document.getElementById("filterKhoan");

  const months = [...new Set(data.map(r => r["Tháng"]).filter(Boolean))];
  const khoans = [...new Set(data.map(r => r["Các khoản"]).filter(Boolean))];

  months.forEach(m => {
    monthSelect.innerHTML += `<option value="${m}">${m}</option>`;
  });
  khoans.forEach(k => {
    khoanSelect.innerHTML += `<option value="${k}">${k}</option>`;
  });

  // Gắn sự kiện
  monthSelect.addEventListener("change", applyFilters);
  khoanSelect.addEventListener("change", applyFilters);
}

// Lọc dữ liệu
function applyFilters() {
  const month = document.getElementById("filterMonth").value;
  const khoan = document.getElementById("filterKhoan").value;

  let filtered = allData;
  if (month) filtered = filtered.filter(r => r["Tháng"] === month);
  if (khoan) filtered = filtered.filter(r => r["Các khoản"] === khoan);

  renderTable(filtered);
}
