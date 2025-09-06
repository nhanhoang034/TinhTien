let chartInstance = null;

document.getElementById("filterChart").addEventListener("change", function() {
  const choice = this.value;

  if (choice === "") {
    // Hiện bảng, ẩn biểu đồ
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("chartContainer").style.display = "none";
    return;
  }

  // Ẩn bảng, hiện biểu đồ
  document.getElementById("tableContainer").style.display = "none";
  document.getElementById("chartContainer").style.display = "block";

  // Chuẩn bị dữ liệu từ CSV
  let dataSorted = allData.filter(r => r["Tháng"] && r["Điện"] && r["Nước"]);

  // Chuyển MMYY -> YYYYMM để sort
  dataSorted.forEach(r => {
    let mm = parseInt(r["Tháng"].substring(0, 2), 10);
    let yy = parseInt(r["Tháng"].substring(2), 10) + 2000; 
    r._order = yy * 100 + mm;
  });

  // Sắp xếp tăng dần theo thời gian
  dataSorted.sort((a, b) => a._order - b._order);

  // Nếu chọn 6 hoặc 12 thì cắt bớt
  if (choice !== "all") {
    let n = parseInt(choice, 10);
    dataSorted = dataSorted.slice(-n);
  }

  // Lấy label & dữ liệu
  const labels = dataSorted.map(r => r["Tháng"]);
  const dataDien = dataSorted.map(r => parseFloat(r["Điện"] || 0));
  const dataNuoc = dataSorted.map(r => parseFloat(r["Nước"] || 0));

  const ctx = document.getElementById("costChart").getContext("2d");

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
          data: dataDien,
          borderColor: "orange",
          backgroundColor: "rgba(255,165,0,0.2)",
          fill: false,
          tension: 0.2
        },
        {
          label: "Nước",
          data: dataNuoc,
          borderColor: "blue",
          backgroundColor: "rgba(0,0,255,0.2)",
          fill: false,
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" }
      },
      scales: {
        x: {
          title: { display: true, text: "Tháng" }
        },
        y: {
          title: { display: true, text: "Số tiền" },
          min: 400,
          max: 900
        }
      }
    }
  });
});
