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

  // Chuẩn bị dữ liệu
  let dataSorted = allData.filter(r => r["Tháng"] && r["Điện"] && r["Nước"]);

  // Chuyển MMYY thành YYYYMM để sort
  dataSorted.forEach(r => {
    let mm = parseInt(r["Tháng"].substring(0, 2), 10);
    let yy = parseInt(r["Tháng"].substring(2), 10) + 2000; // YY -> YYYY
    r._order = yy * 100 + mm;
  });

  dataSorted.sort((a, b) => a._order - b._order);

  if (choice !== "all") {
    let n = parseInt(choice, 10);
    dataSorted = dataSorted.slice(-n);
  }

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
        x: { title: { display: true, text: "Tháng (MMYY)" } },
        y: { title: { display: true, text: "Chi phí (VND)" } }
      }
    }
  });
});
