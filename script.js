// ============================================================
// script.js — WebGIS BTS Riau
// ============================================================


// #DATA — Dataset BTS Riau (Dari Database)
let BTS = [];
async function loadBTSData() {

  try {

    const response = await fetch('https://persebaran-bts-production.up.railway.app/bts');

    BTS = await response.json();

    console.log('Data BTS berhasil dimuat:', BTS);

    initMap();
    
  } catch(error) {

    console.error('Gagal mengambil data BTS:', error);

    alert('Backend PostgreSQL gagal terhubung');

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

  setTimeout(() => {

    if (map) {
      map.invalidateSize();
    }

  }, 200);
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

let map, cgr, pgr, hlr, mm = {};
let mapInited = false;
let aops  = new Set(['Telkomsel', 'Indosat', 'XL Axiata', 'Tri']);
let anets = new Set(['2G', '3G', '4G', '5G']);
let akabs = new Set();
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

  // #MAP — Inisialisasi layer group: cluster & non-cluster
  cgr = L.markerClusterGroup({ chunkedLoading: true });
  pgr = L.layerGroup();
  map.addLayer(cgr);

  // #FILTER — Render chip filter Kab/Kota secara dinamis dari data BTS
  const kabs = [...new Set(BTS.map(d => d.kab_kota))].sort();
  document.getElementById('f-kab').innerHTML = kabs.map(k =>
    `<button class="chip" data-kab="${k}">${k}</button>`
  ).join('');

  // #FILTER — Event listener chip Kab/Kota
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
    akabs.clear(); sq = '';
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
}

// #MAP — Ambil data BTS yang lolos semua filter aktif
function getFiltered() {
  const q = sq.toLowerCase();
  return BTS.filter(d =>
    aops.has(d.operator) &&
    anets.has(d.jaringan) &&
    (akabs.size === 0 || akabs.has(d.kab_kota)) &&
    (
      q === '' || 
      d.nama_bts.toLowerCase().includes(q) || 
      d.kab_kota.toLowerCase().includes(q) ||
      d.operator.toLowerCase().includes(q)
    )
  );
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

// #MAP — Render ulang semua marker sesuai filter aktif
function renderMap() {
  cgr.clearLayers(); pgr.clearLayers(); mm = {};
  const f = getFiltered();
  f.forEach(d => {
    const m = L.marker([d.latitude, d.longitude], { icon: mkIcon(d.operator) })
      .bindPopup(mkPopup(d), { maxWidth: 270 });
    m.on('click', () => selBTS(d.id_bts));
    mm[d.id_bts] = m;
    if (clMode) cgr.addLayer(m); else pgr.addLayer(m);
  });
  if (!clMode && !map.hasLayer(pgr)) map.addLayer(pgr);
  document.getElementById('hs-sh').textContent  = f.length;
  document.getElementById('lcount').textContent = f.length;
  document.getElementById('stot').textContent   = f.length;
  renderList(f); renderStats(f); renderHeat(f);
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

// #MAP — Render layer heatmap berupa lingkaran transparan per BTS
function renderHeat(f) {
  if (hlr) { map.removeLayer(hlr); hlr = null; }
  if (!document.getElementById('lyr-hm').checked) return;
  hlr = L.layerGroup(f.map(d =>
    L.circle([d.latitude, d.longitude], {
      radius: 15000,
      color: 'transparent',
      fillColor: OPC[d.operator] || '#0097A7',
      fillOpacity: .12
    })
  ));
  map.addLayer(hlr);
}

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
// #PREPROCESSING — Panel preprocessing data (Minggu 3)
// ============================================================

// #PREPROCESSING — Navigasi antar sub-section panel preprocessing
function showPPSection(id) {
  document.querySelectorAll('.pp-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.pp-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  event.currentTarget.classList.add('active');
}

// #PREPROCESSING — Konversi derajat desimal ke format DMS (Derajat Menit Detik)
function decToDMS(deg) {
  const d = Math.floor(Math.abs(deg));
  const m = Math.floor((Math.abs(deg) - d) * 60);
  const s = ((Math.abs(deg) - d - m / 60) * 3600).toFixed(1);
  return `${d}°${m}'${s}" ${deg >= 0 ? 'N/E' : 'S/W'}`;
}

// #PREPROCESSING — Validasi apakah koordinat berada di dalam bounding box Riau
function isValidRiau(lat, lng) {
  return lat >= -0.9982 && lat <= 2.9167 && lng >= 100.2167 && lng <= 102.7833;
}

let ppInited = false;

// #PREPROCESSING — Inisialisasi seluruh tabel dan konten panel preprocessing (hanya sekali)
function initPP() {
  if (ppInited) return;
  ppInited = true;

  // #PREPROCESSING — Render tabel sampel hasil cleaning data (10 record pertama)
  const ctb = document.getElementById('cleaning-table');
  ctb.innerHTML = BTS.slice(0, 10).map(d => `<tr>
    <td style="color:var(--accent);font-family:'Space Mono',monospace">${d.id_bts}</td>
    <td>${d.nama}</td>
    <td>${d.operator}</td>
    <td><span style="background:${NETC[d.jaringan]}22;color:${NETC[d.jaringan]};padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">${d.jaringan}</span></td>
    <td>${d.kab_kota}</td>
    <td><span class="pp-badge ok" style="font-size:10px">✓ ${d.status}</span></td>
    <td style="font-family:'Space Mono',monospace">${d.tahun}</td>
  </tr>`).join('');

  // #PREPROCESSING — Render tabel validasi koordinat & hitung statistik
  const vtb = document.getElementById('validasi-table');
  let validOk = 0, validErr = 0;
  vtb.innerHTML = BTS.map(d => {
    const ok = isValidRiau(d.latitude, d.longitude);
    if (ok) validOk++; else validErr++;
    return `<tr>
      <td style="color:var(--accent);font-family:'Space Mono',monospace">${d.id_bts}</td>
      <td>${d.nama}</td>
      <td class="coord-val">${d.latitude.toFixed(4)}</td>
      <td class="coord-val">${d.longitude.toFixed(4)}</td>
      <td>${d.kab_kota}</td>
      <td>${ok ? '<span class="pp-badge ok">✓ Valid</span>' : '<span class="pp-badge err">✗ Outlier</span>'}</td>
    </tr>`;
  }).join('');
  document.getElementById('val-total').textContent = BTS.length;
  document.getElementById('val-ok').textContent    = validOk;
  document.getElementById('val-err').textContent   = validErr;
  document.getElementById('val-pct').textContent   = ((validOk / BTS.length) * 100).toFixed(1) + '%';

  // #PREPROCESSING — Render preview GeoJSON (2 feature pertama sebagai sampel)
  const gjSample = {
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features: BTS.slice(0, 2).map(d => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [d.longitude, d.latitude] },
      properties: { id: d.id_bts, nama: d.nama_bts, operator: d.operator, jaringan: d.jaringan, kab_kota: d.kab_kota, tahun: d.tahun }
    }))
  };
  document.getElementById('geojson-preview').textContent =
    JSON.stringify(gjSample, null, 2).substring(0, 900) + '...\n// (+ ' + (BTS.length - 2) + ' features lainnya)';
  document.getElementById('gj-count').textContent = BTS.length + ' features';

  // #PREPROCESSING — Render tabel sampel koordinat WGS84 + format DMS (8 record)
  const wtb = document.getElementById('wgs84-table');
  wtb.innerHTML = BTS.slice(0, 8).map(d => `<tr>
    <td>${d.nama_bts}</td>
    <td>${d.kab_kota}</td>
    <td class="coord-val">${d.latitude.toFixed(5)}°</td>
    <td class="coord-val">${d.longitude.toFixed(5)}°</td>
    <td style="font-size:10px;color:rgba(255,255,255,.45)">${decToDMS(d.latitude)}, ${decToDMS(d.longitude)}</td>
  </tr>`).join('');

  // #PREPROCESSING — Render daftar area blank spot (kab/kota dengan BTS < 2)
  const kabCount = BTS.reduce((a, d) => { a[d.kab_kota] = (a[d.kab_kota] || 0) + 1; return a }, {});
  const allKabs  = ['Pekanbaru','Dumai','Kampar','Rokan Hulu','Rokan Hilir','Bengkalis','Siak','Pelalawan','Indragiri Hulu','Indragiri Hilir','Kuantan Singingi','Kepulauan Meranti'];
  const bsl      = document.getElementById('blankspot-list');
  const lowKabs  = allKabs.filter(k => (kabCount[k] || 0) < 2);
  bsl.innerHTML  = lowKabs.map(k => `<div class="blank-spot-item">
    <div class="blank-dot"></div>
    <div class="blank-area">${k}</div>
    <div class="blank-meta">${kabCount[k] || 0} BTS tercatat</div>
    <span class="pp-badge ${(kabCount[k] || 0) === 0 ? 'err' : 'warn'}">${(kabCount[k] || 0) === 0 ? 'Tidak ada data' : 'Coverage rendah'}</span>
  </div>`).join('') || '<div style="color:var(--green);font-size:13px">✓ Semua kabupaten memiliki coverage BTS</div>';

  // #PREPROCESSING — Render bar chart distribusi BTS per kab/kota
  const dl     = document.getElementById('density-list');
  const sorted = Object.entries(kabCount).sort((a, b) => b[1] - a[1]);
  const max    = sorted[0][1];
  dl.innerHTML = sorted.map(([k, v]) => `<div style="margin-bottom:10px">
    <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px">
      <span style="color:rgba(255,255,255,.7)">${k}</span>
      <span style="font-weight:700;color:var(--accent)">${v} BTS</span>
    </div>
    <div class="pp-progress">
      <div class="pp-progress-fill" style="width:${(v / max * 100).toFixed(0)}%;background:${v >= 5 ? 'var(--green)' : v >= 3 ? 'var(--cyan)' : '#FFB300'}"></div>
    </div>
  </div>`).join('');

  document.getElementById('sum-total').textContent = BTS.length;
}

// #PREPROCESSING — Export seluruh data BTS ke file bts_riau.geojson
function downloadGeoJSON() {
  const gj = {
    type: "FeatureCollection",
    crs: { type: "name", properties: { name: "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    features: BTS.map(d => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [d.longitude, d.latitude] },
      properties: { id: d.id_bts, nama: d.nama_bts, operator: d.operator, jaringan: d.jaringan, kab_kota: d.kab_kota, tahun: d.tahun }
    }))
  };
  const blob = new Blob([JSON.stringify(gj, null, 2)], { type: 'application/geo+json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'bts_riau.geojson';
  a.click();
  showNtf('✓ bts_riau.geojson berhasil didownload');
}


// ============================================================
// #INIT — Inisialisasi awal saat halaman selesai dimuat
// ============================================================

window.addEventListener('load', async () => {

  await loadBTSData();
  const s = getSession();
  // Tampilkan loading screen 1.8 detik, lalu arahkan ke peta (jika ada sesi) atau beranda
  setTimeout(() => {
    document.getElementById('pg-loading').classList.remove('active');
    if (s) enterMap(s); else showPage('pg-home');
  }, 1800);
});
