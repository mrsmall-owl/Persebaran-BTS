// ============================================================
// script.js — WebGIS BTS Riau
// ============================================================


// #DATA — Dataset BTS Riau (Dari Database PorsgreSQL)
let BTS = [];

async function loadData(){

  try {

    const response = await fetch('https://persebaran-bts-production.up.railway.app/bts');

    BTS = await response.json();

    console.table(BTS);

    console.log('Data BTS berhasil dimuat:', BTS);

    initMap();

  } catch(err){

    console.log(err);

  }

}

// #CONFIG — Palet warna per operator dan per tipe jaringan
const OPC  = { 'Telkomsel':'#FF0000', 'Indosat':'#FFB300', 'XL Axiata':'#1565C0', 'Tri':'#7C4DFF' };
const NETC = { '2G':'#546E7A', '3G':'#00796B', '4G':'#0097A7', '5G':'#00C853' };


// ============================================================
// #AUTH — Manajemen autentikasi & sesi pengguna (localStorage)
// ============================================================

const getUsers   = () => { try { return JSON.parse(localStorage.getItem('wgis_u') || '[]') } catch { return [] } };
const saveUsers  = u  => localStorage.setItem('wgis_u', JSON.stringify(u));
const setSession = u  => localStorage.setItem('wgis_s', JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem('wgis_s') || 'null') } catch { return null } };
const clearSession = () => localStorage.removeItem('wgis_s');

// #AUTH — Tampilkan pesan error / sukses di form auth
function showErr(m) {
  const e = document.getElementById('aerr');
  e.textContent = m; e.style.display = 'block';
  document.getElementById('aok').style.display = 'none';
}
function showOk(m) {
  const e = document.getElementById('aok');
  e.textContent = m; e.style.display = 'block';
  document.getElementById('aerr').style.display = 'none';
}
function clearMsg() {
  document.getElementById('aerr').style.display = 'none';
  document.getElementById('aok').style.display  = 'none';
}

// #AUTH — Proses login pengguna terdaftar
function doLogin() {
  clearMsg();
  const em = document.getElementById('l-em').value.trim();
  const pw = document.getElementById('l-pw').value;
  if (!em || !pw) { showErr('Isi email dan password terlebih dahulu.'); return }
  const u = getUsers().find(x => x.email === em && x.password === pw);
  if (!u) { showErr('Email atau password salah.'); return }
  setSession(u); enterMap(u);
}

// #AUTH — Proses registrasi akun baru
function doRegister() {
  clearMsg();
  const fn   = document.getElementById('r-fn').value.trim();
  const ln   = document.getElementById('r-ln').value.trim();
  const em   = document.getElementById('r-em').value.trim();
  const inst = document.getElementById('r-in').value.trim();
  const pw   = document.getElementById('r-pw').value;
  const pw2  = document.getElementById('r-pw2').value;
  if (!fn || !em || !pw)      { showErr('Nama, email, dan password wajib diisi.'); return }
  if (pw.length < 6)          { showErr('Password minimal 6 karakter.'); return }
  if (pw !== pw2)             { showErr('Konfirmasi password tidak cocok.'); return }
  const users = getUsers();
  if (users.find(x => x.email === em)) { showErr('Email sudah terdaftar. Silakan masuk.'); return }
  const u = { id: Date.now(), name: fn + ' ' + ln, fname: fn, email: em, inst, password: pw, role: 'user' };
  users.push(u); saveUsers(users);
  showOk('✓ Akun berhasil dibuat! Silakan masuk.');
  setTimeout(() => switchAuthTab('login'), 1600);
}

// #AUTH — Login tanpa akun (mode demo / guest)
function guestLogin() {
  const u = { id: 0, name: 'Guest User', fname: 'Guest', email: 'guest@demo.com', role: 'guest' };
  setSession(u); enterMap(u);
}

// #AUTH — Logout dan kembali ke halaman beranda
function doLogout() {
  clearSession(); toggleMenu(); showPage('pg-home');
  showNtf('Berhasil keluar ✓');
}

// #AUTH — Set tampilan header peta setelah login berhasil & buka halaman peta
function enterMap(u) {
  const init = (u.fname || u.name || 'G').substring(0, 2).toUpperCase();
  document.getElementById('u-av').textContent   = init;
  document.getElementById('u-nm').textContent   = u.fname || 'Guest';
  document.getElementById('um-name').textContent  = u.name || 'Guest User';
  document.getElementById('um-email').textContent = u.role === 'guest' ? 'Mode Demo' : u.email;
  showPage('pg-map');

  // Double RAF: frame pertama DOM visible, frame kedua layout sudah dihitung
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (map) {
        map.invalidateSize(true);
        // Tunggu 200ms lagi biar tile selesai reflow sebelum heatmap digambar
        setTimeout(() => {
          renderHeat(getFiltered());
        }, 200);
      }
    });
  });
}


// ============================================================
// #NAVIGATION — Navigasi antar halaman & tab auth
// ============================================================

// #NAVIGATION — Tampilkan halaman berdasarkan ID (sembunyikan sisanya)
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// #NAVIGATION — Buka halaman auth dengan tab tertentu (login/register)
function showAuth(tab) {
  clearMsg();
  document.getElementById('l-em').value = '';
  document.getElementById('l-pw').value = '';
  showPage('pg-auth');
  switchAuthTab(tab || 'login');
}

// #NAVIGATION — Toggle antara tab Login dan Daftar di halaman auth
function switchAuthTab(t) {
  document.getElementById('tab-login').classList.toggle('active', t === 'login');
  document.getElementById('tab-reg').classList.toggle('active',   t === 'register');
  document.getElementById('form-login').style.display = t === 'login'    ? 'block' : 'none';
  document.getElementById('form-reg').style.display   = t === 'register' ? 'block' : 'none';
  clearMsg();
}

// #NAVIGATION — Smooth scroll ke section di halaman landing
function smoothScroll(id) {
  document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
}

// #NAVIGATION — Tangani Enter key di halaman auth untuk submit form
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('pg-auth').classList.contains('active')) {
    document.getElementById('form-login').style.display !== 'none' ? doLogin() : doRegister();
  }
});


// ============================================================
// #MAP — Inisialisasi & rendering peta Leaflet
// ============================================================
let yearChart;
let map, cgr, pgr, mm = {};
let mapInited = false;
let aops  = new Set(['Telkomsel', 'Indosat', 'XL Axiata', 'Tri']);
let anets = new Set(['2G', '3G', '4G', '5G']);
let akabs = new Set([
  "Bengkalis",
  "Indragiri Hilir",
  "Indragiri Hulu",
  "Kampar",
  "Kuantan Singingi",
  "Pelalawan",
  "Rokan Hilir",
  "Rokan Hulu",
  "Siak",
  "Kota Dumai",
  "Kota Pekanbaru"
]);
let sq = '', clMode = true, selId = null;

// #MAP — Inisialisasi peta Leaflet (hanya sekali), setup layer & event listener
function initMap() {
  if (mapInited) { renderMap(); return }
  mapInited = true;
  map = L.map('leafmap', { center: [0.8, 101.5], zoom: 8, zoomControl: true });
  map.zoomControl.setPosition('bottomright');

  // #MAP — Definisi basemap: OSM, Satelit, Dark Mode
  const bms = {
    osm: L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    sat: L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19 }),
    drk: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }),
  };
  bms.osm.addTo(map);

  //BatasRiau
  fetch("data/Batas.json")
  .then(response => response.json())
  .then(data => {

    L.geoJSON(data, {
      style: {
        color: "#414646",
        weight: 2,
        opacity: 1,
        fillOpacity: 0,
        dashArray: "2,5"
      }
    }).addTo(map);

  });
  // #MAP — Event listener radio button ganti basemap
  document.querySelectorAll('input[name=bm]').forEach(r => r.addEventListener('change', () => {
    Object.values(bms).forEach(b => map.removeLayer(b));
    if (r.id === 'bm-osm')  bms.osm.addTo(map);
    if (r.id === 'bm-sat')  bms.sat.addTo(map);
    if (r.id === 'bm-dark') bms.drk.addTo(map);
  }));

  // #MAP — Tampilkan koordinat kursor & zoom level di info bar bawah
  map.on('mousemove', e => {
    document.getElementById('c-lat').textContent = e.latlng.lat.toFixed(5);
    document.getElementById('c-lng').textContent = e.latlng.lng.toFixed(5);
  });
  map.on('zoomend', () => document.getElementById('c-zm').textContent = map.getZoom());
  // Gambar ulang heatmap setiap kali view berubah
  map.on('moveend zoomend resize', drawHeatCanvas);
  map.on('zoom', () => { if (heatCanvas) heatCanvas.style.opacity = '0.4'; });
  map.on('zoomend', () => {
    if (heatCanvas) heatCanvas.style.opacity = '1';
    drawHeatCanvas();
  });

  // #MAP — Inisialisasi layer group: cluster & non-cluster
  cgr = L.markerClusterGroup({ chunkedLoading: true });
  pgr = L.layerGroup();
  map.addLayer(cgr);

  map.getPane('markerPane').style.zIndex = 700;
  map.getPane('popupPane').style.zIndex  = 800;

  // Pastikan overlayPane sebagai containing block agar canvas bisa absolute di dalamnya
  const op = map.getPane('overlayPane');
  op.style.position = 'absolute';
  op.style.zIndex   = '200';      // di bawah marker (700) & popup (800), di atas tile (100)

  // #FILTER — Render chip filter Kab/Kota secara dinamis dari data BTS
  const kabs = [

  "Bengkalis",
  "Indragiri Hilir",
  "Indragiri Hulu",
  "Kampar",
  "Kuantan Singingi",
  "Pelalawan",
  "Rokan Hilir",
  "Rokan Hulu",
  "Siak",
  "Kota Dumai",
  "Kota Pekanbaru"

];
  document.getElementById('f-kab').innerHTML = kabs.map(k =>
    `<button class="chip" data-kab="${k}">${k}</button>`
  ).join('');

  // #FILTER — Event listener chip Kab/Kota
  document.querySelectorAll('#f-kab .chip').forEach(b => {

    if (akabs.has(b.dataset.kab)) {

      b.classList.add('active');

    }
  });

  document.querySelectorAll('#f-kab .chip').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.kab;
    if (akabs.has(k)) { akabs.delete(k); b.classList.remove('active'); }
    else              { akabs.add(k);    b.classList.add('active'); }
    renderMap();
  }));

  // #FILTER — Event listener tab sidebar (Filter / Daftar / Statistik)
  document.querySelectorAll('.stab').forEach(t => t.addEventListener('click', () => {
    const tab = t.dataset.tab;
    document.querySelectorAll('.stab').forEach(x => x.classList.toggle('active', x.dataset.tab === tab));
    document.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('active', p.id === 'tp-' + tab));
  
    if (tab === 'stats') {
      setTimeout(() => renderYearChart(getFiltered()), 50);
    }
  }));

  // #FILTER — Event listener chip Operator
  document.querySelectorAll('#f-op .chip').forEach(b => b.addEventListener('click', () => {
    const o = b.dataset.op;
    if (aops.has(o)) { aops.delete(o); b.classList.remove('active'); }
    else             { aops.add(o);    b.classList.add('active'); }
    renderMap();
  }));

  // #FILTER — Event listener chip Jaringan (2G/3G/4G/5G)
  document.querySelectorAll('#f-net .chip').forEach(b => b.addEventListener('click', () => {
    const n = b.dataset.net;
    if (anets.has(n)) { anets.delete(n); b.classList.remove('active'); }
    else              { anets.add(n);    b.classList.add('active'); }
    renderMap();
  }));

  // #FILTER — Reset semua filter ke default
  document.getElementById('btn-rst').addEventListener('click', () => {
    aops  = new Set(['Telkomsel', 'Indosat', 'XL Axiata', 'Tri']);
    anets = new Set(['2G', '3G', '4G', '5G']);
    akabs = new Set([
      "Bengkalis",
      "Indragiri Hilir",
      "Indragiri Hulu",
      "Kampar",
      "Kuantan Singingi",
      "Pelalawan",
      "Rokan Hilir",
      "Rokan Hulu",
      "Siak",
      "Kota Dumai",
      "Kota Pekanbaru"
    ]);
    document.getElementById('srch').value = '';
    document.querySelectorAll('#f-op .chip, #f-net .chip').forEach(c => c.classList.add('active'));
    document.querySelectorAll('#f-kab .chip').forEach(c => c.classList.remove('active'));
    renderMap(); showNtf('Filter direset ✓');
  });

  // #FILTER — Event listener input pencarian BTS / wilayah
  document.getElementById('srch').addEventListener('input', e => { sq = e.target.value; renderMap(); });

  // #MAP — Toggle mode clustering marker
  document.getElementById('lyr-cl').addEventListener('change', e => {
    clMode = e.target.checked;
    if (clMode) { map.removeLayer(pgr); map.addLayer(cgr); }
    else        { map.removeLayer(cgr); map.addLayer(pgr); }
    renderMap();
  });

  // #MAP — Toggle layer heatmap
  document.getElementById('lyr-hm').addEventListener('change', () => renderHeat(getFiltered()));

  renderMap();
  // Tunggu peta benar-benar selesai dirender sebelum draw heatmap pertama kali
  map.whenReady(() => {
    setTimeout(() => {
      map.invalidateSize(true);
      renderHeat(getFiltered());
    }, 300);
  });
}

// #MAP — Ambil data BTS yang lolos semua filter aktif
function getFiltered() {

  const q = sq.toLowerCase();

  return BTS.filter(d => {

    const operator = (d.operator || '').trim();
    const jaringan = (d.jaringan || '').trim();
    const kabkota  = (d.kab_kota || '').trim();

    return (

      aops.has(operator) &&
      anets.has(jaringan) &&
      akabs.has(kabkota) &&

      (

        q === '' ||

        (d.nama_bts || '').toLowerCase().includes(q) ||
        kabkota.toLowerCase().includes(q) ||
        operator.toLowerCase().includes(q)

      )

    );

  });

}

// #MAP — Buat custom icon marker berbentuk pin dengan warna operator
function mkIcon(op) {
  const c = OPC[op] || '#aaa';
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="26" height="34" viewBox="0 0 26 34">
    <ellipse cx="13" cy="31" rx="5" ry="2" fill="rgba(0,0,0,.2)"/>
    <path d="M13 2C7 2 2 7 2 13C2 21 13 32 13 32C13 32 24 21 24 13C24 7 19 2 13 2Z" fill="${c}" stroke="white" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="4.5" fill="white" opacity=".9"/>
  </svg>`;
  return L.divIcon({ html: s, className: '', iconSize: [26, 34], iconAnchor: [13, 32], popupAnchor: [0, -32] });
}

// #MAP — Buat konten HTML popup marker BTS
function mkPopup(d) {
  return `<div class="pu">
    <div class="pu-hd">
      <div class="pu-ic">📡</div>

      <div>
        <div class="pu-name">${d.nama_bts}</div>
        <div class="pu-op"
             style="color:${OPC[d.operator]}">
             ${d.operator}
        </div>
      </div>
    </div>

    <div class="pu-grid">

      <div class="pu-f">
        <div class="pu-fl">Jaringan</div>
        <div class="pu-fv"
             style="color:${NETC[d.jaringan]}">
             ${d.jaringan}
        </div>
      </div>

      <div class="pu-f">
        <div class="pu-fl">Tahun</div>
        <div class="pu-fv">${d.tahun}</div>
      </div>

      <div class="pu-f" style="grid-column:span 2">
        <div class="pu-fl">Kabupaten</div>
        <div class="pu-fv">${d.kab_kota}</div>
      </div>

      <div class="pu-f" style="grid-column:span 2">
        <div class="pu-fl">Alamat</div>
        <div class="pu-fv">${d.alamat}</div>
      </div>

    </div>

  </div>`;
}

// #EXPORT — Update informasi export berdasarkan filter aktif
function updateExportInfo(){

  const data = getFiltered();

  document.getElementById('ex-total')
    .textContent =
      `${data.length} BTS`;

  document.getElementById('ex-op')
    .textContent =
      [...aops].join(', ') || 'Semua';

  document.getElementById('ex-net')
    .textContent =
      [...anets].join(', ') || 'Semua';

  document.getElementById('ex-kab')
    .textContent =
      [...akabs].join(', ') || 'Semua';

}

// #MAP — Render ulang semua marker sesuai filter aktif
function renderMap() {
  cgr.clearLayers(); pgr.clearLayers(); mm = {};
  const f = getFiltered();
  f.forEach(d => {
    const m = L.marker([d.latitude, d.longitude], {
      icon: mkIcon(d.operator),
    }).bindPopup(mkPopup(d), { maxWidth: 270 });
    m.on('click', () => selBTS(d.id_bts));
    mm[d.id_bts] = m;
    if (clMode) cgr.addLayer(m); else pgr.addLayer(m);
  });
  if (!clMode && !map.hasLayer(pgr)) map.addLayer(pgr);
  document.getElementById('hs-sh').textContent  = f.length;
  document.getElementById('lcount').textContent = f.length;
  document.getElementById('stot').textContent   = f.length;
  renderList(f);
  renderStats(f);
  // RAF: tunggu marker selesai dirender ke DOM baru gambar heatmap
  requestAnimationFrame(() => {
    if (map) {
      map.invalidateSize();
      renderHeat(f);
    }
    const chartEl = document.getElementById('yearChart');
    if (chartEl) renderYearChart(f);
  });
  updateExportInfo();
}

// #MAP — Render daftar BTS di panel sidebar kiri
function renderList(f) {
  document.getElementById('blist').innerHTML = f.map(d =>
    `<div class="bitem${selId === d.id_bts ? ' sel' : ''}" data-id="${d.id_bts}">
      <div class="bdot" style="background:${OPC[d.operator]}"></div>
      <div class="binfo">
        <div class="bname">${d.nama_bts}</div>
        <div class="bmeta">${d.kab_kota}</div>
      </div>
      <div class="bbdg" style="background:${NETC[d.jaringan]}">${d.jaringan}</div>
    </div>`
  ).join('');
  document.querySelectorAll('.bitem').forEach(el =>
    el.addEventListener('click', () => selBTS(+el.dataset.id))
  );
}

// #STATISTIK — Grafik BTS per tahun
function renderYearChart(data){

  const tahunMap = {};

  data.forEach(d => {

    const th = d.tahun || "Tidak Ada";

    tahunMap[th] = (tahunMap[th] || 0) + 1;

  });

  const labels = Object.keys(tahunMap).sort();

  const values = labels.map(l => tahunMap[l]);

  const ctx = document
    .getElementById('yearChart')
    .getContext('2d');

  if(yearChart){
    yearChart.destroy();
  }

  yearChart = new Chart(ctx, {

    type: 'line',

    data: {

      labels: labels,

      datasets: [{

        data: values,

        borderColor: '#00ffff',

        borderWidth: 3,

        pointRadius: 5,

        pointHoverRadius: 7,

        pointBackgroundColor: '#ff2b2b',

        pointBorderColor: '#ffffff',

        pointBorderWidth: 2,

        backgroundColor: 'rgba(0,255,255,0.12)',

        tension: 0.3,

        fill: true

      }]

    },

    options: {

      responsive: true,

      maintainAspectRatio: false,

      interaction: {

        mode: 'index',

        intersect: false

      },

      plugins: {

        legend: {

          display: false

        },

        tooltip: {

          enabled: true,

          displayColors: false,

          backgroundColor: 'rgba(5,10,20,.92)',

          titleColor: '#00ffff',

          bodyColor: '#ffffff',

          borderColor: '#00ffff',

          borderWidth: 1,

          padding: 8,

          titleFont: {

            size: 11

          },

          bodyFont: {

            size: 10

          },

          callbacks: {

            label: function(ctx){

              const jumlahTahunIni = ctx.parsed.y;

              let totalKumulatif = 0;

              for(let i = 0; i <= ctx.dataIndex; i++){

                totalKumulatif += values[i];

              }

              return [

                `Jumlah BTS : ${jumlahTahunIni}`,

                `Total BTS : ${totalKumulatif}`

              ];

            }

          }

        }

      },

      scales: {

        x: {

          grid: {

            color: 'rgba(0,255,255,0.08)'

          },

          ticks: {

            color: '#9fb3c8',

            font: {

              size: 10,

              weight: '600'

            }

          }

        },

        y: {

          grid: {

            color: 'rgba(0,255,255,0.08)'

          },

          ticks: {

            color: '#9fb3c8',

            font: {

              size: 10,

              weight: '600'

            }

          }

        }

      }

    }

  });

}

// #STATS — Render statistik distribusi BTS (per operator, jaringan, kab/kota)
function renderStats(f) {
  const cnt  = (a, k) => a.reduce((acc, d) => { acc[d[k]] = (acc[d[k]] || 0) + 1; return acc }, {});
  const bars = (o, c)  => {
    const mx = Math.max(...Object.values(o), 1);
    return Object.entries(o).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
      `<div class="srow">
        <div class="srl">${k}</div>
        <div class="sbw"><div class="sb" style="width:${(v / mx * 100).toFixed(0)}%;background:${c?.[k] || 'var(--cyan)'}"></div></div>
        <div class="srv">${v}</div>
      </div>`
    ).join('');
  };
  document.getElementById('st-op').innerHTML  = bars(cnt(f, 'operator'), OPC);
  document.getElementById('st-net').innerHTML = bars(cnt(f, 'jaringan'), NETC);
  document.getElementById('st-kab').innerHTML = bars(cnt(f, 'kab_kota'), null);
}

// ============================================================
// HEATMAP — Kernel Density Estimation (KDE) — 3 Kelas Ringan
//
// Landasan Teori:
// 1. BANDWIDTH — Silverman's Rule of Thumb (1986):
//    h = 1.06 * σ * n^(-1/5)
//    Sumber: Silverman, B.W. (1986). Density Estimation for
//    Statistics and Data Analysis. Chapman & Hall, London.
//
// 2. KERNEL FUNCTION — Epanechnikov Kernel:
//    K(u) = 0.75 * (1 - u²),  u ≤ 1
//    Dipilih karena secara matematis paling optimal (minimum
//    mean integrated squared error / MISE).
//    Sumber: Epanechnikov, V.A. (1969). Non-parametric estimation
//    of a multivariate probability density. Theory of Probability
//    and Its Applications, 14(1), 153–158.
//
// 3. KLASIFIKASI 3 KELAS — Quantile-based Thresholding:
//    Rendah  : density ≤ Q67  → Hijau  (#00C853)
//    Sedang  : Q67 < density ≤ Q90 → Biru   (#2979FF)
//    Tinggi  : density > Q90  → Merah  (#D50000)
//    Sumber: Chainey, S., Tompson, L., & Uhlig, S. (2008).
//    The utility of hotspot mapping for predicting spatial
//    patterns of crime. Security Journal, 21(1–2), 4–28.
// ============================================================

let heatCanvas = null;
let heatCtx    = null;
let _heatPts   = [];

// #HEATMAP — Silverman's Rule of Thumb: h = 1.06 * σ * n^(-1/5)
function kdeBandwidth(pts) {
  const n = pts.length;
  if (n < 2) return 60;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  const vx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) / n;
  const vy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0) / n;
  const sigma = Math.sqrt((vx + vy) / 2);
  return Math.max(20, Math.min(130, 1.06 * sigma * Math.pow(n, -0.2)));
}

// #HEATMAP — Epanechnikov Kernel: K(u) = 0.75*(1−u²), u≤1
function epanechnikov(d, h) {
  const u = d / h;
  return u <= 1 ? 0.75 * (1 - u * u) : 0;
}

// #HEATMAP — Perbarui canvas heatmap (dipanggil saat data / view berubah)
function renderHeat(data) {
  if (!map) return;

  const hmOn = document.getElementById('lyr-hm');
  if (hmOn && !hmOn.checked) {
    // Sembunyikan canvas jika toggle heatmap off
    if (heatCanvas) heatCanvas.style.display = 'none';
    return;
  }

  _heatPts = data
    .map(d => ({ lat: parseFloat(d.latitude), lng: parseFloat(d.longitude) }))
    .filter(p => !isNaN(p.lat) && !isNaN(p.lng));

  if (!heatCanvas) {
    heatCanvas = document.createElement('canvas');
    heatCtx    = heatCanvas.getContext('2d');
    Object.assign(heatCanvas.style, {
      position:      'relative',
      top:           '0',
      left:          '0',
      pointerEvents: 'none',
      zIndex:        '400'
    });
    // Taruh di map container langsung — tidak ikut transform pan/zoom Leaflet
    map.getContainer().appendChild(heatCanvas);
  }

  heatCanvas.style.display = '';

  // Cek apakah container sudah punya ukuran — kalau belum retry sampai 5x
  const container = map.getContainer();
  if (container.offsetWidth === 0 || container.offsetHeight === 0) {
    let retries = 0;
    const retryDraw = () => {
      if (retries++ > 10) return; // maks 10 retry (~1 detik)
      if (container.offsetWidth > 0 && container.offsetHeight > 0) {
        map.invalidateSize(true);
        drawHeatCanvas();
      } else {
        setTimeout(retryDraw, 100);
      }
    };
    setTimeout(retryDraw, 100);
    return;
  }

  drawHeatCanvas();
}

// #HEATMAP — Gambar ulang heatmap ke canvas sesuai viewport peta saat ini
function drawHeatCanvas() {
  if (!heatCanvas || !heatCtx || !map) return;

  const container = map.getContainer();
  const W = container.offsetWidth;
  const H = container.offsetHeight;
  if (W === 0 || H === 0) return;

  // Resize canvas hanya kalau ukuran berubah (hemat redraw)
  if (heatCanvas.width !== W || heatCanvas.height !== H) {
    heatCanvas.width  = W;
    heatCanvas.height = H;
    heatCanvas.style.width  = W + 'px';
    heatCanvas.style.height = H + 'px';
  }
  heatCtx.clearRect(0, 0, W, H);

  if (_heatPts.length === 0) return;

  // Proyeksikan titik geografis → pixel layar
  const screen = _heatPts.map(p => {
    const pt = map.latLngToContainerPoint([p.lat, p.lng]);
    return { x: pt.x, y: pt.y };
  });

  // Bandwidth Silverman (dalam satuan pixel)
  const h = kdeBandwidth(screen);

  // Grid sampling 6 px — cukup halus, tetap ringan
  const CELL = 6;
  const cols = Math.ceil(W / CELL);
  const rows = Math.ceil(H / CELL);
  const density = new Float32Array(cols * rows);
  let maxD = 0;

  for (let r = 0; r < rows; r++) {
    const cy = r * CELL + CELL / 2;
    for (let c = 0; c < cols; c++) {
      const cx = c * CELL + CELL / 2;
      let d = 0;
      for (let i = 0; i < screen.length; i++) {
        const dx = cx - screen[i].x;
        const dy = cy - screen[i].y;
        d += epanechnikov(Math.sqrt(dx * dx + dy * dy), h);
      }
      density[r * cols + c] = d;
      if (d > maxD) maxD = d;
    }
  }

  if (maxD === 0) return;

  // ── Quantile thresholding (Chainey et al., 2008) ──────────
  const nonzero = Array.from(density).filter(v => v > 0).sort((a, b) => a - b);
  const q67 = nonzero[Math.floor(nonzero.length * 0.67)] || maxD * 0.45;
  const q90 = nonzero[Math.floor(nonzero.length * 0.90)] || maxD * 0.75;

  // ── Render ke offscreen canvas dulu baru blur ─────────────
  const offscreen = document.createElement('canvas');
  offscreen.width  = W;
  offscreen.height = H;
  const offCtx = offscreen.getContext('2d');

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const d = density[r * cols + c];
      if (d <= 0) continue;

      let R, G, B, A;

      if (d <= q67) {
        // RENDAH — kuning
        const t = d / q67;
        R = 255; G = 220; B = 0;
        A = 0.18 + t * 0.28;
      } else if (d <= q90) {
        // SEDANG — orange
        const t = (d - q67) / (q90 - q67);
        R = 255; G = 100; B = 0;
        A = 0.48 + t * 0.16;
      } else {
        // TINGGI — merah
        const t = Math.min(1, (d - q90) / ((maxD - q90) || 1));
        R = 220; G = 0; B = 0;
        A = 0.65 + t * 0.28;
      }

      offCtx.fillStyle = `rgba(${R},${G},${B},${A.toFixed(2)})`;
      offCtx.fillRect(c * CELL, r * CELL, CELL + 1, CELL + 1); // +1 biar gap antar sel tidak kelihatan
    }
  }

  // Gaussian blur untuk menghaluskan tepian
  heatCtx.clearRect(0, 0, W, H);
  heatCtx.filter = 'blur(10px)';
  heatCtx.drawImage(offscreen, 0, 0);
  heatCtx.filter = 'none';
}

window.addEventListener('resize', () => {
  if (map) { map.invalidateSize(); drawHeatCanvas(); }
});

// #MAP — Pilih BTS: fly to marker, buka popup, highlight item daftar
function selBTS(id) {
  selId = id;
  const d = BTS.find(x => x.id_bts === id);
  if (!d) return;
  document.querySelectorAll('.stab').forEach(x => x.classList.toggle('active', x.dataset.tab === 'list'));
  document.querySelectorAll('.tpanel').forEach(p => p.classList.toggle('active', p.id === 'tp-list'));
  map.flyTo(
    [d.latitude, d.longitude],
    map.getZoom()
  );

  map.once('moveend', drawHeatCanvas);
  
  setTimeout(() => {
    const m = mm[id];
    if (m) { if (clMode) cgr.zoomToShowLayer(m, () => m.openPopup()); else m.openPopup(); }
  }, 1300);
  renderList(getFiltered());
  
}

// #MAP — Toggle user menu dropdown (pojok kanan atas header peta)
function toggleMenu() {
  const m = document.getElementById('umenu');
  m.style.display = m.style.display === 'block' ? 'none' : 'block';
}

// #MAP — Tutup user menu jika klik di luar area menu
document.addEventListener('click', e => {
  if (!e.target.closest('#usr-btn') && !e.target.closest('#umenu'))
    document.getElementById('umenu').style.display = 'none';
});

// #MAP — Tampilkan notifikasi toast sementara di atas peta
function showNtf(msg) {
  const e = document.getElementById('notif');
  e.textContent = msg; e.style.display = 'block';
  setTimeout(() => e.style.display = 'none', 2200);
}


// ============================================================
// #INIT — Inisialisasi awal saat halaman selesai dimuat
// ============================================================

window.addEventListener('load', async () => {

  await loadData();
  const s = getSession();
  // Tampilkan loading screen 1.8 detik, lalu arahkan ke peta (jika ada sesi) atau beranda
  setTimeout(() => {
    document.getElementById('pg-loading').classList.remove('active');
    if (s) enterMap(s); else showPage('pg-home');
  }, 1800);
});

// #EXPORT — Buka sidebar export
function openExportTab(){

  // reset active tab
  document.querySelectorAll('.stab')
    .forEach(el => el.classList.remove('active'));

  // aktifkan tombol export
  document.querySelector('.stab[data-tab="export"]')
    .classList.add('active');

  // reset panel
  document.querySelectorAll('.tpanel')
    .forEach(el => el.classList.remove('active'));

  // tampilkan panel export
  document.getElementById('tp-export')
    .classList.add('active');

}

// #EXPORT — Download CSV
function downloadCSV(){

  const data = getFiltered();

  let csv =
`id_bts,nama_bts,operator,jaringan,kab_kota,latitude,longitude\n`;

  data.forEach(d => {

    csv +=
`${d.id_bts},${d.nama_bts},${d.operator},${d.jaringan},${d.kab_kota},${d.latitude},${d.longitude}\n`;

  });

  const blob = new Blob([csv], {
    type:'text/csv'
  });

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = 'data_bts_riau.csv';

  a.click();

}


// #EXPORT — Download JSON
function downloadJSON(){

  const data = getFiltered();

  const blob = new Blob(

    [JSON.stringify(data, null, 2)],

    {
      type:'application/json'
    }

  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');

  a.href = url;
  a.download = 'data_bts_riau.json';

  a.click();

}