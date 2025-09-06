// Hàm load CSV
async function loadCSVData() {
  const response = await fetch("data.csv");
  const data = await response.text();
  return Papa.parse(data, { header: true }).data;
}

document.addEventListener("DOMContentLoaded", async () => {
  let globalData = [];
  try {
    globalData = await loadCSVData();
  } catch (e) {
    console.error("Không thể tải dữ liệu CSV:", e);
  }

  // Render bảng lần đầu
  renderTable(globalData);

  // Gán sự kiện cho dropdown
  document.getElementById("filterMonth").addEventListener("change", () => {
    renderTable(globalData);
  });

  document.getElementById("filterFee").addEventListener("change", () => {
    renderTable(globalData);
  });

  // Nút reset
  document.getElementById("resetButton").addEventListener("click", () => {
    document.getElementById("filterMonth").value = "all";
    document.getElementById("filterFee").value = "all";
    renderTable(globalData);
  });
});

// Hàm render bảng
function renderTable(data) {
  const filterMonth = document.getElementById("filterMonth").value;
  const filterFee = document.getElementById("filterFee").value;

  // Lọc dữ liệu
  let filteredData = data;
  if (filterMonth !== "all") {
    filteredData = filteredData.filter(row => row["Tháng"] === filterMonth);
  }

  // Xây bảng
  const table = document.getElementById("dataTable");
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");
  thead.innerHTML = "";
  tbody.innerHTML = "";

  if (filteredData.length === 0) {
    tbody.innerHTML = "<tr><td colspan='7'>Không có dữ liệu</td></tr>";
    return;
  }

  // Render tiêu đề cột
  const columns = Object.keys(filteredData[0]);
  const headerRow = document.createElement("tr");
  columns.forEach(col => {
    const th = document.createElement("th");
    th.textContent = col;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);

  // Render dữ liệu
  filteredData.forEach(row => {
    const tr = document.createElement("tr");
    columns.forEach(col => {
      if (filterFee === "all" || col === "Tháng" || col === filterFee) {
        const td = document.createElement("td");
        td.textContent = row[col] || "";
        tr.appendChild(td);
      }
    });
    tbody.appendChild(tr);
  });
}
