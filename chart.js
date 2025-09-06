// chart.js (thay thế hoàn toàn file cũ)
let chartInstance = null;

// helper: chuyển chuỗi số VN (ví dụ "724.190" hoặc "724,190") -> number
function toNumber(v) {
  if (v === null || v === undefined) return NaN;
  if (typeof v === 'number') return v;
  let s = String(v).trim();
  if (s === '') return NaN;
  // loại bỏ ký tự không phải số, dấu . , - hoặc ,
  s = s.replace(/[^\d\-,.]/g, '');
  // Nhận định: trong dữ liệu VN thường dùng dấu '.' là ngăn nghìn.
  // Cách đơn giản & an toàn với dữ liệu VN: bỏ tất cả '.' rồi thay ',' -> '.'
  s = s.replace(/\./g, '').replace(/,/g, '.');
  const n = parseFloat(s);
  return isNaN(n) ? NaN : n;
}

// helper: format số để hiển thị tooltip/tick
function formatNumberVN(x) {
  if (x === null || x === undefined || isNaN(x)) return '-';
  return x.toLocaleString('vi-VN');
}

// tìm key phù hợp trong header dựa trên các pattern
function findKey(keys, patterns) {
  patterns = patterns.map(p => p.toLowerCase());
  return keys.find(k => {
    const kk = String(k).toLowerCase();
    return patterns.some(p => kk.includes(p));
  });
}

// chính: khi user đổi lựa chọn vẽ biểu đồ
document.getElementById("filterChart").addEventListener("change", function() {
  const choice = this.value; // "", "all", "6", "12"

  // nếu chưa chọn => hiện bảng, ẩn chart
  if (choice === "") {
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("chartContainer").style.display = "none";
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
    return;
  }

  // cần dữ liệu
  if (!window.allData || !Array.isArray(window.allData) || window.allData.length === 0) {
    alert("Dữ liệu chưa tải xong hoặc data.csv rỗng. Vui lòng thử lại sau vài giây.");
    // reset to show table
    document.getElementById("filterChart").value = "";
    return;
  }

  // Ẩn bảng, hiện chart
  document.getElementById("tableContainer").style.display = "none";
  document.getElementById("chartContainer").style.display = "block";

  // loại bỏ các hàng rỗng (PapaParse có thể tạo row trống cuối file)
  const raw = window.allData.filter(r => Object.values(r).some(v => v !== null && v !== undefined && String(v).trim() !== ""));

  if (raw.length === 0) {
    alert("Không có hàng dữ liệu hợp lệ trong data.csv");
    return;
  }

  const sampleKeys = Object.keys(raw[0]);
  // phát hiện wide format: có cột 'Điện' và 'Nước' trực tiếp
  const hasWide = sampleKeys.some(k => k.toLowerCase().includes('điện') || k.toLowerCase().includes('dien')) &&
                  sampleKeys.some(k => k.toLowerCase().includes('nước') || k.toLowerCase().includes('nuoc'));

  // biến kết quả thành mảng các objects: {Tháng, Điện: number, Nước: number, _order}
  let monthsData = [];

  if (hasWide) {
    // wide format: mỗi row có 'Tháng','Điện','Nước'
    // tìm đúng key tên cột (để chịu được biến thể ký tự)
    const dienKey = sampleKeys.find(k => k.toLowerCase().includes('điện') || k.toLowerCase().includes('dien'));
    const nuocKey = sampleKeys.find(k => k.toLowerCase().includes('nước') || k.toLowerCase().includes('nuoc'));
    const monthKey = sampleKeys.find(k => k.toLowerCase().includes('tháng') || k.toLowerCase().includes('thang') || k.toLowerCase().includes('month')) || 'Tháng';

    raw.forEach(r => {
      const monthStr = r[monthKey];
      if (!monthStr) return;
      const dienVal = toNumber(r[dienKey]);
      const nuocVal = toNumber(r[nuocKey]);
      // only include rows that have at least one numeric value
      if (isNaN(dienVal) && isNaN(nuocVal)) return;
      const mm = parseInt(String(monthStr).substring(0,2), 10);
      const yy = parseInt(String(monthStr).substring(2), 10) + 2000;
      const order = yy * 100 + mm;
      monthsData.push({ Tháng: monthStr, Điện: isNaN(dienVal) ? 0 : dienVal, Nước: isNaN(nuocVal) ? 0 : nuocVal, _order: order });
    });
  } else {
    // long format: cần pivot
    // tìm cột 'Các khoản' / 'Khoản' và cột giá trị có thể là 'Giá' hoặc 'Tổng' hoặc tương tự
    const monthKey = sampleKeys.find(k => k.toLowerCase().includes('tháng') || k.toLowerCase().includes('thang') || k.toLowerCase().includes('month')) || 'Tháng';
    const khoanKey = findKey(sampleKeys, ['kho', 'loại', 'loai', 'không', 'cac khoản', 'các khoản', 'mục']); // tìm tên cột khoản
    // tìm cột chứa giá trị: ưu tiên 'Tổng' rồi 'Giá' rồi 'Giá cơ bản'...
    const valueKey = findKey(sampleKeys, ['tổng', 'tong', 'giá', 'gia', 'total', 'value', 'số tiền', 'sotien', 'giá cơ bản', 'gia co ban']);

    // pivot
    const monthMap = {}; // monthStr -> obj
    raw.forEach(r => {
      const monthStr = r[monthKey];
      if (!monthStr) return;
      const keyKhoan = khoanKey ? String(r[khoanKey] || '').trim().toLowerCase() : '';
      const rawVal = valueKey ? r[valueKey] : null;
      const val = toNumber(rawVal);
      if (!monthMap[monthStr]) monthMap[monthStr] = { Tháng: monthStr, Điện: NaN, Nước: NaN };
      if (keyKhoan) {
        if (keyKhoan.includes('điện') || keyKhoan.includes('dien')) {
          monthMap[monthStr].Điện = isNaN(val) ? monthMap[monthStr].Điện : val;
        } else if (keyKhoan.includes('nước') || keyKhoan.includes('nuoc')) {
          monthMap[monthStr].Nước = isNaN(val) ? monthMap[monthStr].Nước : val;
        } else {
          // đôi khi điện/nước nằm trong cột 'Các khoản' nhưng giá lại ở cột 'Tổng' chỉ trên dòng 'Tổng'
          // nếu dòng là 'Tổng' thì có thể chứa aggregated numbers (bỏ qua)
        }
      }
    });

    // convert to array & compute order
    Object.values(monthMap).forEach(item => {
      const monthStr = item.Tháng;
      // lấy month mm, yy
      const mm = parseInt(String(monthStr).substring(0,2), 10);
      const yy = parseInt(String(monthStr).substring(2), 10) + 2000;
      const order = yy * 100 + mm;
      // nếu cả 2 là NaN thì bỏ
      const dienVal = isNaN(item.Điện) ? 0 : item.Điện;
      const nuocVal = isNaN(item.Nước) ? 0 : item.Nước;
      if (isNaN(item.Điện) && isNaN(item.Nước)) return;
      monthsData.push({ Tháng: monthStr, Điện: dienVal, Nước: nuocVal, _order: order });
    });
  }

  // sắp xếp theo thời gian tăng dần
  monthsData.sort((a,b) => a._order - b._order);

  // nếu chọn 6 hoặc 12 thì lấy N phần tử cuối
  if (choice !== 'all') {
    const n = parseInt(choice, 10);
    if (monthsData.length > n) monthsData = monthsData.slice(-n);
  }

  // kiểm tra dữ liệu hợp lệ
  if (!monthsData || monthsData.length === 0) {
    alert("Không tìm thấy dữ liệu Điện/Nước hợp lệ trong file CSV của bạn. Vui lòng kiểm tra header và các cột (ví dụ 'Tháng','Các khoản','Giá' hoặc 'Tháng','Điện','Nước').");
    // hiển thị lại bảng
    document.getElementById("tableContainer").style.display = "block";
    document.getElementById("chartContainer").style.display = "none";
    document.getElementById("filterChart").value = "";
    return;
  }

  // labels & datasets
  const labels = monthsData.map(m => m.Tháng);
  const dataDien = monthsData.map(m => (isNaN(m.Điện) ? 0 : m.Điện));
  const dataNuoc = monthsData.map(m => (isNaN(m.Nước) ? 0 : m.Nước));

  // tính min/max động cho trục Y (padding 10%)
  const allVals = dataDien.concat(dataNuoc).filter(v => !isNaN(v));
  const minVal = Math.min(...allVals);
  const maxVal = Math.max(...allVals);
  const pad = (maxVal - minVal) * 0.12 || maxVal * 0.05 || 1;
  const yMin = Math.max(0, Math.floor(minVal - pad));
  const yMax = Math.ceil(maxVal + pad);

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
          borderColor: "rgb(255,140,0)", // cam
          backgroundColor: "rgba(255,140,0,0.15)",
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 6
        },
        {
          label: "Nước",
          data: dataNuoc,
          borderColor: "rgb(0,102,204)", // xanh dương
          backgroundColor: "rgba(0,102,204,0.15)",
          tension: 0.2,
          pointRadius: 4,
          pointHoverRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "top" },
        tooltip: {
          callbacks: {
            label: function(context) {
              const lab = context.dataset.label || '';
              const val = context.parsed.y;
              return lab + ': ' + formatNumberVN(val);
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: "Tháng" }
        },
        y: {
          title: { display: true, text: "Số tiền" },
          // dùng dynamic min/max tính phía trên
          min: yMin,
          max: yMax,
          ticks: {
            callback: function(value) {
              return formatNumberVN(value);
            }
          }
        }
      }
    }
  });
});
