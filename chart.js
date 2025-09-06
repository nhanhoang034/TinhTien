let chartInstance = null;
let globalData = null; // lưu lại dữ liệu toàn cục

// hàm load CSV
async function loadCSVData() {
  const response = await fetch("data.csv");
  const data = await response.text();
  return Papa.parse(data, { header: true }).data;
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    globalData = await loadCSVData();
  } catch (e) {
    console.error("Không thể tải dữ liệu CSV:", e);
  }

  const chartFilter = document.getElementById("filterChart");
  chartFilter.addEventListener("change", () => {
    const choice = chartFilter.value;
    if (!choice) return;

    if (!globalData) {
      alert("Dữ liệu chưa tải xong hoặc data.csv rỗng. Vui lòng thử lại sau vài giây.");
      chartFilter.value = "";
      return;
    }

    // ẩn bảng, hiện chart
    document.getElementById("tableContainer").style.display = "none";
    document.getElementById("chartContainer").style.display = "block";

    renderChart(globalData, choice);
  });

  // nút reset
  document.getElementById("resetButton").addEventListener("click", () => {
    document.getElementById("filterMonth").value = "all";
    document.getElementById("filterFee").value = "all";
    document.getElementById("filterChart").value = "";
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("chartContainer").style.display = "none";
    renderTable(globalData); // gọi lại hàm renderTable trong script.js
  });
});

function renderChart(data, choice) {
  // chuẩn bị dữ liệu
  let monthsData = data
    .map(row => {
      const month = row["Tháng"];
      if (!month) return null;

      const mm = parseInt(month.substring(0, 2));
      const yy = parseInt(month.substring(2, 4));

      return {
        month,
        mm,
        yy,
        _order: yy * 12 + mm, // dùng để sắp xếp
        dien: parseFloat(row["điện"]) || null,
        nuoc: parseFloat(row["nước"]) || null
      };
    })
    .filter(row => row !== null);

  if (!monthsData.length) {
    alert("Không tìm thấy dữ liệu Điện/Nước hợp lệ trong file CSV.");
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("chartContainer").style.display = "none";
    document.getElementById("filterChart").value = "";
    return;
  }

  // sắp xếp theo thời gian tăng dần
  monthsData.sort((a, b) => a._order - b._order);

  // nếu chọn 6 hoặc 12 thì lấy N phần tử cuối
  if (choice !== "all") {
    const n = parseInt(choice, 10);
    if (monthsData.length > n) {
      monthsData = monthsData.slice(-n);
    }
    // nếu ít hơn n thì cứ lấy tất cả, không báo lỗi
  }

  const labels = monthsData.map(row => row.month);
  const dienData = monthsData.map(row => row.dien);
  const nuocData = monthsData.map(row => row.nuoc);

  const ctx = document.getElementById("chartCanvas").getContext("2d");

  if (chartInstance) {
    chartInstance.destroy();
  }

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [
        {
          label: "Điện",
          data: dienData,
          borderColor: "red",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: false,
          tension: 0.1
        },
        {
          label: "Nước",
          data: nuocData,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
          fill: false,
          tension: 0.1
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top"
        },
        title: {
          display: true,
          text: "Biểu đồ Điện và Nước"
        }
      },
      scales: {
        y: {
          title: {
            display: true,
            text: "Số tiền"
          },
          min: 400,
          max: 900
        },
        x: {
          title: {
            display: true,
            text: "Tháng"
          }
        }
      }
    }
  });
}
