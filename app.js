
const crops = {
  padi: { name: "Padi", yield: 6000, icon: "🌾" },
  jagung: { name: "Jagung", yield: 8000, icon: "🌽" },
  cabai: { name: "Cabai", yield: 10000, icon: "🌶️" },
  tomat: { name: "Tomat", yield: 15000, icon: "🍅" },
  kedelai: { name: "Kedelai", yield: 2500, icon: "🫘" },
  bawang: { name: "Bawang Merah", yield: 9000, icon: "🧅" }
};

const KEY = "harvest_predictor_data_v1";

let db = JSON.parse(localStorage.getItem(KEY) || '{"lands":[],"harvests":[]}');

function save() {
  localStorage.setItem(KEY, JSON.stringify(db));
}

function format(value) {
  return new Intl.NumberFormat("id-ID").format(value);
}

function predict(area, crop) {
  const base = crops[crop]?.yield || 5000;
  return Math.round(area * base);
}

function averagePrediction() {
  return db.lands.reduce((sum, land) =>
    sum + predict(land.area, land.crop), 0);
}

function render() {
  const root = document.getElementById("harvest-app");
  if (!root) return;

  const totalArea = db.lands.reduce((s, l) => s + l.area, 0);
  const totalPrediction = averagePrediction();
  const totalActual = db.harvests.reduce((s, h) => s + h.amount, 0);

  root.innerHTML = `
    <header class="topbar">
      <div class="brand">🌱 Harvest Predictor <span>AI</span></div>
      <div class="subtitle">Smart Agriculture Dashboard</div>
    </header>

    <main class="container">
      <section class="welcome">
        <div>
          <small>AGRICULTURE INTELLIGENCE</small>
          <h1>Dashboard Pertanian</h1>
          <p>Pantau lahan dan prediksi hasil panen Anda.</p>
        </div>
        <div class="date">${new Date().toLocaleDateString("id-ID")}</div>
      </section>

      <section class="stats">
        <div class="stat">
          <span>🌿 Total Lahan</span>
          <strong>${db.lands.length}</strong>
          <small>${totalArea.toLocaleString("id-ID")} hektare</small>
        </div>
        <div class="stat">
          <span>📊 Prediksi Panen</span>
          <strong>${format(totalPrediction)}</strong>
          <small>Estimasi kilogram</small>
        </div>
        <div class="stat">
          <span>🌾 Hasil Aktual</span>
          <strong>${format(totalActual)}</strong>
          <small>Kilogram tercatat</small>
        </div>
      </section>

      <section class="panel">
        <h2>➕ Tambahkan Lahan</h2>
        <form id="landForm">
          <label>Nama lahan</label>
          <input name="name" placeholder="Contoh: Sawah Utara" required>

          <label>Lokasi</label>
          <input name="location" placeholder="Nama desa / kecamatan" required>

          <label>Luas lahan (hektare)</label>
          <input name="area" type="number" min="0.01" step="0.01" placeholder="1.5" required>

          <label>Jenis tanaman</label>
          <select name="crop" required>
            ${Object.entries(crops).map(([key,c]) =>
              `<option value="${key}">${c.icon} ${c.name}</option>`
            ).join("")}
          </select>

          <button class="primary" type="submit">Simpan Data Lahan</button>
        </form>
      </section>

      <section class="panel">
        <h2>🌱 Data Lahan Saya</h2>
        <div id="landList">
          ${db.lands.length ? db.lands.map(land => `
            <div class="land-card">
              <div>
                <strong>${escapeHTML(land.name)}</strong>
                <p>${escapeHTML(land.location)} · ${crops[land.crop]?.name || land.crop}</p>
                <small>Luas: ${land.area} ha · Prediksi: ${format(predict(land.area,land.crop))} kg</small>
              </div>
              <div class="actions">
                <button onclick="editLand('${land.id}')">Edit</button>
                <button class="danger" onclick="deleteLand('${land.id}')">Hapus</button>
              </div>
            </div>
          `).join("") : "<p>Belum ada data lahan.</p>"}
        </div>
      </section>

      <section class="panel prediction">
        <h2>🤖 AI Harvest Prediction</h2>
        <p>Pilih lahan untuk melihat estimasi produksi.</p>
        <select id="predictionLand">
          <option value="">Pilih lahan</option>
          ${db.lands.map(l =>
            `<option value="${l.id}">${escapeHTML(l.name)}</option>`
          ).join("")}
        </select>
        <div id="predictionResult" class="result">
          Pilih lahan untuk memulai prediksi.
        </div>
      </section>

      <section class="panel">
        <h2>📝 Catat Hasil Panen Aktual</h2>
        <form id="harvestForm">
          <label>Pilih lahan</label>
          <select name="landId" required>
            <option value="">Pilih lahan</option>
            ${db.lands.map(l =>
              `<option value="${l.id}">${escapeHTML(l.name)}</option>`
            ).join("")}
          </select>
          <label>Hasil panen (kg)</label>
          <input name="amount" type="number" min="0.01" step="0.01" required placeholder="Masukkan hasil panen">
          <label>Tanggal panen</label>
          <input name="date" type="date" value="${new Date().toISOString().slice(0,10)}" required>
          <button class="primary" type="submit">Simpan Hasil Panen</button>
        </form>
      </section>

      <section class="panel">
        <h2>📈 Perbandingan Hasil Panen</h2>
        <div class="chart">
          <canvas id="harvestChart" height="220"></canvas>
        </div>
      </section>

      <section class="panel">
        <h2>📚 Riwayat Panen</h2>
        ${db.harvests.length ? [...db.harvests].reverse().map(h => {
          const land = db.lands.find(l => l.id === h.landId);
          return `
            <div class="history">
              <div>
                <strong>${escapeHTML(land?.name || "Lahan dihapus")}</strong>
                <p>${h.date}</p>
              </div>
              <strong>${format(h.amount)} kg</strong>
            </div>
          `;
        }).join("") : "<p>Belum ada riwayat panen.</p>"}
      </section>

      <footer>Harvest Predictor AI · Smart Farming Indonesia</footer>
    </main>
  `;

  document.getElementById("landForm").onsubmit = addLand;
  document.getElementById("harvestForm").onsubmit = addHarvest;

  document.getElementById("predictionLand").onchange = function() {
    const land = db.lands.find(l => l.id === this.value);
    const result = document.getElementById("predictionResult");

    if (!land) {
      result.textContent = "Pilih lahan untuk memulai prediksi.";
      return;
    }

    const estimate = predict(land.area, land.crop);

    result.innerHTML = `
      <small>ESTIMASI HASIL PANEN</small>
      <h1>${format(estimate)} kg</h1>
      <p>${escapeHTML(land.name)} · ${land.area} hektare</p>
      <p>Jenis tanaman: ${crops[land.crop].name}</p>
      <small>Estimasi berdasarkan produktivitas dasar. Hasil aktual dapat berbeda.</small>
    `;
  };

  drawChart();
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;",
    '"': "&quot;", "'": "&#39;"
  })[char]);
}

function addLand(event) {
  event.preventDefault();
  const form = new FormData(event.target);

  db.lands.push({
    id: crypto.randomUUID(),
    name: form.get("name").trim(),
    location: form.get("location").trim(),
    area: Number(form.get("area")),
    crop: form.get("crop")
  });

  save();
  render();
}

function editLand(id) {
  const land = db.lands.find(l => l.id === id);
  if (!land) return;

  const name = prompt("Nama lahan:", land.name);
  if (name === null) return;

  const area = prompt("Luas lahan (hektare):", land.area);
  if (area === null) return;

  if (!name.trim() || !Number.isFinite(Number(area)) || Number(area) <= 0) {
    alert("Data tidak valid.");
    return;
  }

  land.name = name.trim();
  land.area = Number(area);
  save();
  render();
}

function deleteLand(id) {
  if (!confirm("Hapus data lahan ini?")) return;

  db.lands = db.lands.filter(l => l.id !== id);
  save();
  render();
}

function addHarvest(event) {
  event.preventDefault();
  const form = new FormData(event.target);
  const amount = Number(form.get("amount"));

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Masukkan hasil panen yang valid.");
    return;
  }

  db.harvests.push({
    id: crypto.randomUUID(),
    landId: form.get("landId"),
    amount,
    date: form.get("date")
  });

  save();
  render();
}

function drawChart() {
  const canvas = document.getElementById("harvestChart");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = 220;

  canvas.width = width * devicePixelRatio;
  canvas.height = height * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);

  const actual = db.lands.map(l =>
    db.harvests
      .filter(h => h.landId === l.id)
      .reduce((s,h) => s + h.amount, 0)
  );

  const predicted = db.lands.map(l => predict(l.area, l.crop));
  const max = Math.max(1, ...actual, ...predicted);

  ctx.clearRect(0, 0, width, height);

  const barWidth = Math.min(24, width / Math.max(1, db.lands.length * 3));
  const group = width / Math.max(1, db.lands.length);

  db.lands.forEach((land, i) => {
    const x = group * i + group / 2;
    const actualHeight = actual[i] / max * 145;
    const predictedHeight = predicted[i] / max * 145;

    ctx.fillStyle = "#16865c";
    ctx.fillRect(x - barWidth - 2, 175 - predictedHeight, barWidth, predictedHeight);

    ctx.fillStyle = "#e7ad42";
    ctx.fillRect(x + 2, 175 - actualHeight, barWidth, actualHeight);

    ctx.fillStyle = "#263d31";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(land.name.slice(0, 10), x, 195);
  });

  ctx.fillStyle = "#16865c";
  ctx.fillRect(10, 207, 10, 8);
  ctx.fillStyle = "#263d31";
  ctx.fillText("Prediksi", 48, 215);

  ctx.fillStyle = "#e7ad42";
  ctx.fillRect(95, 207, 10, 8);
  ctx.fillStyle = "#263d31";
  ctx.fillText("Aktual", 130, 215);
}

// Buat tampilan aplikasi secara otomatis.
document.addEventListener("DOMContentLoaded", () => {
  if (!document.getElementById("harvest-app")) {
    document.body.innerHTML = '<div id="harvest-app"></div>';
  }
  render();
});
  
