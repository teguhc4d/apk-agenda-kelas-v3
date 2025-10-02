/* ===================================================
  script.js - Aplikasi Agenda Kelas (LocalStorage)
  Final (perbaikan: jadwal responsif & session guru)
   =================================================== */

/* ===================================================
   script.js - Aplikasi Agenda Kelas (LocalStorage)
   Final (perbaikan: login/logout UI guru)
   =================================================== */

/* ---------- KEY localStorage (per kelas) ---------- */
const LS_PREFIX = "agendaApp_";
function key(k) {
  const kelas = (document.getElementById('kelasSelect')?.value || 'XI-RPL');
  return `${LS_PREFIX}${kelas}_${k}`;
}

/* ---------- Utility: download file teks ---------- */
function downloadTextFile(filename, text) {
  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* ---------- TAB NAV ---------- */
function openTab(id, btn) {
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
  if (btn) btn.classList.add('active');
}

/* ---------- THEME (dark) ---------- */
const darkToggle = document.getElementById('darkModeToggle');
function loadTheme() {
  const t = localStorage.getItem('agendaTheme') || 'light';
  if (t === 'dark') document.body.classList.add('dark');
  else document.body.classList.remove('dark');
}
if (darkToggle) {
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('agendaTheme', document.body.classList.contains('dark') ? 'dark' : 'light');
  });
}

/* ---------- KELAS (multi-class) ---------- */
function gantiKelas(kelas) {
  localStorage.setItem('agendaApp_selectedKelas', kelas);
  muatSemuaData();
}

/* ---------- NOTIFIKASI BROWSER ---------- */
function requestNotifPermission() {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
}
requestNotifPermission();

/* ---------- SISWA CRUD ---------- */
function getSiswa() { return JSON.parse(localStorage.getItem(key('siswa')) || '[]'); }
function simpanSiswa(arr) { localStorage.setItem(key('siswa'), JSON.stringify(arr)); }
function tambahSiswa() {
  const elNama = document.getElementById('siswaNama');
  const elNIS = document.getElementById('siswaNIS');
  if (!elNama || !elNIS) return alert('Form siswa tidak tersedia');
  const nama = elNama.value.trim();
  const nis = elNIS.value.trim();
  const kelas = document.getElementById('siswaKelas')?.value || document.getElementById('kelasSelect')?.value;
  if (!nama || !nis) return alert('Isi NIS dan nama!');
  const arr = getSiswa();
  if (arr.find(s => s.nis === nis && s.kelas === kelas)) return alert('NIS sudah ada di kelas ini!');
  arr.push({ nis, nama, kelas });
  simpanSiswa(arr);
  elNama.value = '';
  elNIS.value = '';
  renderSiswaTable();
  populateSiswaSelect();
}
function renderSiswaTable() {
  const tbody = document.getElementById('siswaTable');
  if (!tbody) return;
  const arr = getSiswa();
  const search = (document.getElementById('searchSiswa')?.value || '').toLowerCase();
  tbody.innerHTML = '';
  arr.filter(s => !search || s.nama.toLowerCase().includes(search) || s.nis.includes(search))
    .forEach(s => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${s.nis}</td><td>${s.nama}</td><td>${s.kelas}</td>
        <td>
          <button onclick="editSiswa('${s.nis}')">Edit</button>
          <button onclick="hapusSiswa('${s.nis}')">Hapus</button>
        </td>`;
      tbody.appendChild(tr);
    });
}
function editSiswa(nis) {
  const arr = getSiswa();
  const s = arr.find(x => x.nis === nis);
  if (!s) return alert('Siswa tidak ditemukan');
  const nama = prompt('Ubah nama:', s.nama);
  if (nama === null) return;
  s.nama = nama;
  simpanSiswa(arr);
  renderSiswaTable();
  populateSiswaSelect();
}
function hapusSiswa(nis) {
  if (!confirm('Hapus siswa?')) return;
  let arr = getSiswa();
  arr = arr.filter(x => x.nis !== nis);
  simpanSiswa(arr);
  renderSiswaTable();
  populateSiswaSelect();
}
function populateSiswaSelect() {
  const sel = document.getElementById('siswaSelect');
  if (!sel) return;
  const arr = getSiswa();
  sel.innerHTML = '<option value="">-- Pilih Siswa --</option>';
  arr.forEach(s => {
    const opt = document.createElement('option');
    opt.value = s.nama;
    opt.textContent = `${s.nama} (${s.nis})`;
    sel.appendChild(opt);
  });
}

/* ---------- IMPORT SISWA EXCEL ---------- */
function importSiswaExcel() {
  const fileInput = document.getElementById('importSiswaFile');
  if (!fileInput || !fileInput.files.length) return alert("Pilih file Excel/CSV dulu!");
  const file = fileInput.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(sheet);
      const arr = getSiswa();
      let added = 0;
      rows.forEach(r => {
        const nis = r.NIS ?? r.nis ?? r['No'] ?? r['Nomor'] ?? r['Id'] ?? null;
        const nama = r.Nama ?? r.nama ?? r.Name ?? null;
        const kelas = r.Kelas ?? r.kelas ?? r.Class ?? null;
        if (nis && nama) {
          const nisStr = String(nis).trim();
          if (!arr.find(s => s.nis === nisStr)) {
            arr.push({
              nis: nisStr,
              nama: String(nama).trim(),
              kelas: kelas ? String(kelas).trim() : (document.getElementById("kelasSelect")?.value || 'XI-RPL')
            });
            added++;
          }
        }
      });
      simpanSiswa(arr);
      renderSiswaTable();
      populateSiswaSelect();
      alert(`Import selesai. ${added} siswa ditambahkan.`);
    } catch (err) {
      console.error(err);
      alert('Gagal membaca file. Pastikan format Excel benar.');
    }
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- DOWNLOAD TEMPLATE EXCEL ---------- */
function downloadTemplateSiswa() {
  const ws_data = [["NIS", "Nama", "Kelas"], ["12345", "Budi Santoso", "XI-RPL"], ["12346", "Siti Aminah", "XI-RPL"]];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "TemplateSiswa");
  XLSX.writeFile(wb, "template_siswa.xlsx");
}

/* ---------- AGENDA ---------- */
function getAgenda() { return JSON.parse(localStorage.getItem(key('agenda')) || '[]'); }
function simpanAgenda(arr) { localStorage.setItem(key('agenda'), JSON.stringify(arr)); }
async function fileToDataUrl(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = e => res(e.target.result);
    r.onerror = e => rej(e);
    r.readAsDataURL(file);
  });
}
async function tambahAgenda() {
  const teksEl = document.getElementById('agendaInput');
  const tglEl = document.getElementById('agendaDate');
  const jamEl = document.getElementById('agendaJam');
  if (!teksEl || !tglEl || !jamEl) return alert('Form agenda tidak lengkap');
  const teks = teksEl.value.trim();
  const tgl = tglEl.value;
  const jam = jamEl.value;
  if (!teks || !tgl || !jam) return alert('Isi teks, tanggal, dan jam!');
  let lampiran = null;
  const fileInput = document.getElementById('agendaFile');
  if (fileInput && fileInput.files && fileInput.files[0]) {
    lampiran = await fileToDataUrl(fileInput.files[0]);
  }
  const arr = getAgenda();
  arr.push({ teks, tgl, jam, lampiran, komentar: [] });
  simpanAgenda(arr);
  teksEl.value = '';
  renderAgendaList();
  refreshCalendarEvents();
  updateDashboard();
}
function renderAgendaList() {
  const list = document.getElementById('agendaList');
  if (!list) return;
  const arr = getAgenda();
  const search = (document.getElementById('searchAgenda')?.value || '').toLowerCase();
  const filterJam = (document.getElementById('filterAgendaJam')?.value || '');
  list.innerHTML = '';
  arr.filter(a => (!search || a.teks.toLowerCase().includes(search) || a.tgl.includes(search))
                 && (!filterJam || a.jam === filterJam))
    .forEach((a, idx) => {
      const li = document.createElement('li');
      const left = document.createElement('div');
      left.innerHTML = `<strong>${a.tgl} | Jam ${a.jam}</strong> — ${a.teks}`;
      const right = document.createElement('div');
      right.style.display='flex'; right.style.gap='8px';
      const btnK = document.createElement('button'); btnK.textContent='Komentar'; btnK.onclick = () => {
        const c = prompt('Komentar:'); if (c) { a.komentar.push(c); simpanAgenda(arr); renderAgendaList(); }
      };
      const btnView = document.createElement('button'); btnView.textContent='Lihat'; btnView.onclick = () => {
        let s = `${a.tgl} | Jam ${a.jam}\n${a.teks}\nKomentar:\n${a.komentar.join('\n')}`;
        if (a.lampiran) s += `\n[ada lampiran]`;
        alert(s);
      };
      const btnDel = document.createElement('button'); btnDel.textContent='Hapus'; btnDel.onclick = () => {
        if (!confirm('Hapus agenda?')) return;
        arr.splice(idx,1); simpanAgenda(arr); renderAgendaList(); refreshCalendarEvents(); updateDashboard();
      };
      right.appendChild(btnK); right.appendChild(btnView); right.appendChild(btnDel);
      li.appendChild(left); li.appendChild(right);
      list.appendChild(li);
    });
}
function exportAgendaCSV() {
  const arr = getAgenda();
  if (!arr.length) return alert('Tidak ada agenda');
  let csv = 'tanggal,jam,teks\n';
  arr.forEach(a => csv += `${a.tgl},${a.jam},"${a.teks.replace(/"/g,'""')}"\n`);
  downloadTextFile('agenda.csv', csv);
}
function exportAgendaPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Agenda', 10, 10);
  let y = 20;
  getAgenda().forEach(a => { doc.text(`${a.tgl} | Jam ${a.jam} : ${a.teks}`, 10, y); y+=8; });
  doc.save('agenda.pdf');
}

/* ---------- ABSENSI ---------- */
function getAbsensi() { return JSON.parse(localStorage.getItem(key('absensi')) || '[]'); }
function simpanAbsensi(arr) { localStorage.setItem(key('absensi'), JSON.stringify(arr)); }
function tandaiAbsen() {
  const nama = document.getElementById('siswaSelect')?.value;
  const status = document.getElementById('statusSelect')?.value;
  if (!nama || !status) return alert('Pilih siswa & status');
  const arr = getAbsensi();
  const hari = (new Date()).toISOString().slice(0,10);
  arr.push({ nama, status, hari });
  simpanAbsensi(arr);
  renderAbsensiTable(); updateDashboard();
}
function renderAbsensiTable() {
  const tbody = document.getElementById('absenList');
  if (!tbody) return;
  const arr = getAbsensi();
  const search = (document.getElementById('searchAbsen')?.value || '').toLowerCase();
  const filter = (document.getElementById('filterAbsen')?.value || '');
  tbody.innerHTML = '';
  arr.filter(a => (!search || a.nama.toLowerCase().includes(search)) && (!filter || a.status === filter))
    .forEach((a, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${a.nama}</td><td>${a.status}</td>
        <td><button onclick="hapusAbsensi(${idx})">Hapus</button></td>`;
      tbody.appendChild(tr);
    });
}
function hapusAbsensi(i) { const arr = getAbsensi(); arr.splice(i,1); simpanAbsensi(arr); renderAbsensiTable(); updateDashboard(); }
function exportAbsensiCSV() {
  const arr = getAbsensi();
  let csv = 'nama,status,tanggal\n';
  arr.forEach(a => csv += `${a.nama},${a.status},${a.hari}\n`);
  downloadTextFile('absensi.csv', csv);
}

/* ---------- CATATAN ---------- */
function simpanCatatan() {
  const teks = document.getElementById('catatanInput')?.value.trim() || '';
  localStorage.setItem(key('catatan'), teks);
  muatCatatan();
}
function muatCatatan() {
  const el = document.getElementById('catatanDisplay');
  if (!el) return;
  el.textContent = localStorage.getItem(key('catatan') ) || '-';
}
function exportCatatanPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.text('Catatan Guru', 10, 10);
  doc.text(localStorage.getItem(key('catatan')) || '-', 10, 20);
  doc.save('catatan.pdf');
}

/* ---------- JADWAL ---------- */
function simpanJadwal() {
  const rows = [];
  const trs = document.querySelectorAll('#jadwalTable tbody tr');
  trs.forEach(tr => {
    const hari = tr.cells[0].textContent;
    const mapel = [];
    for (let i=1;i<=10;i++) mapel.push((tr.cells[i]?.textContent || '-').trim() || '-');
    rows.push({ hari, mapel });
  });
  localStorage.setItem(key('jadwal'), JSON.stringify(rows));
  alert('Jadwal tersimpan');
}
function muatJadwal() {
  const data = JSON.parse(localStorage.getItem(key('jadwal') ) || '[]');
  const tbody = document.querySelector('#jadwalTable tbody');
  if (!tbody) return;
  // jika tidak ada data, biarkan tabel HTML default (sudah ada baris kosong)
  if (!data.length) return;
  tbody.innerHTML = '';
  data.forEach(d => {
    const tr = document.createElement('tr');
    const td = document.createElement('td'); td.textContent = d.hari; tr.appendChild(td);
    d.mapel.forEach(m => { const t = document.createElement('td'); t.contentEditable='true'; t.textContent = m; tr.appendChild(t); });
    tbody.appendChild(tr);
  });
}
function exportJadwalPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF(); doc.text('Jadwal',10,10); let y=20;
  (JSON.parse(localStorage.getItem(key('jadwal'))||'[]')).forEach(d => { doc.text(d.hari+': '+d.mapel.join(', '),10,y); y+=8; });
  doc.save('jadwal.pdf');
}

/* ---------- MODUL ---------- */
function uploadModul() {
  const input = document.getElementById('modulInput');
  if (!input || !input.files.length) return alert('Pilih file');
  const file = input.files[0];
  const r = new FileReader();
  r.onload = e => {
    const arr = JSON.parse(localStorage.getItem(key('modul')) || '[]');
    arr.push({ name: file.name, url: e.target.result });
    localStorage.setItem(key('modul'), JSON.stringify(arr));
    renderModulList();
  };
  r.readAsDataURL(file);
}
function renderModulList() {
  const list = document.getElementById('modulList');
  if (!list) return;
  list.innerHTML = '';
  (JSON.parse(localStorage.getItem(key('modul'))||'[]')).forEach((m,idx) => {
    const li = document.createElement('li');
    li.innerHTML = `${m.name} <a href="${m.url}" download="${m.name}">Download</a> <button onclick="hapusModul(${idx})">Hapus</button>`;
    list.appendChild(li);
  });
}
function hapusModul(i) { const arr = JSON.parse(localStorage.getItem(key('modul'))||'[]'); arr.splice(i,1); localStorage.setItem(key('modul'), JSON.stringify(arr)); renderModulList(); }

/* ---------- KALENDER (FullCalendar) ---------- */
let calendar = null;
function initCalendar() {
  const el = document.getElementById('calendar');
  if (!el) return;
  calendar = new FullCalendar.Calendar(el, {
    initialView: 'dayGridMonth',
    height: 550,
    selectable: true,
    events: getAgenda().map((a,idx) => ({ id: idx, title: `Jam ${a.jam}: ${a.teks}`, start: a.tgl })),
    dateClick(info) {
      const dateEl = document.getElementById('agendaDate');
      if (dateEl) dateEl.value = info.dateStr;
      openTab('agendaTab');
    },
    eventClick(info) {
      const id = parseInt(info.event.id);
      const a = getAgenda()[id];
      if (!a) return alert('Agenda tidak ditemukan');
      let s = `${a.tgl} | Jam ${a.jam}\n${a.teks}\nKomentar:\n${a.komentar.join('\n')}`;
      if (a.lampiran) s += '\n[Ada lampiran]';
      alert(s);
    }
  });
  calendar.render();
}
function refreshCalendarEvents() {
  if (!calendar) return;
  calendar.removeAllEvents();
  getAgenda().forEach((a, idx) => calendar.addEvent({ id: idx, title: `Jam ${a.jam}: ${a.teks}`, start: a.tgl }));
}

/* ---------- CHART (absensi) ---------- */
let absensiChart = null;
function initChart() {
  const canvas = document.getElementById('absensiChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  absensiChart = new Chart(ctx, {
    type: 'pie',
    data: { labels: ['Hadir','Izin','Alpha'], datasets: [{ data:[0,0,0], backgroundColor:['#28a745','#ffc107','#dc3545'] }] },
    options: { responsive:true }
  });
  updateChart();
}
function updateChart() {
  if (!absensiChart) return;
  const arr = getAbsensi();
  const today = (new Date()).toISOString().slice(0,10);
  const todayAbs = arr.filter(a => a.hari === today);
  const hadir = todayAbs.filter(a => a.status==='Hadir').length;
  const izin = todayAbs.filter(a => a.status==='Izin').length;
  const alpha = todayAbs.filter(a => a.status==='Alpha').length;
  absensiChart.data.datasets[0].data = [hadir, izin, alpha];
  absensiChart.update();
}

/* ---------- DASHBOARD UPDATE ---------- */
function updateDashboard() {
  const countAgendaEl = document.getElementById('countAgenda');
  if (countAgendaEl) countAgendaEl.textContent = getAgenda().length;
  const arr = getAbsensi();
  const today = (new Date()).toISOString().slice(0,10);
  const todayAbs = arr.filter(a => a.hari === today);
  const hadir = todayAbs.filter(a => a.status==='Hadir').length;
  const izin = todayAbs.filter(a => a.status==='Izin').length;
  const alpha = todayAbs.filter(a => a.status==='Alpha').length;
  const countAbsensiEl = document.getElementById('countAbsensi');
  if (countAbsensiEl) countAbsensiEl.textContent = `Hadir:${hadir} | Izin:${izin} | Alpha:${alpha}`;
  const lastCatEl = document.getElementById('lastCatatan');
  if (lastCatEl) lastCatEl.textContent = localStorage.getItem(key('catatan')) || '-';
  updateChart();
}

/* ---------- BACKUP / RESTORE ---------- */
function exportAllJSON() {
  const keys = ['siswa','agenda','absensi','catatan','jadwal','modul'];
  const out = {};
  keys.forEach(k => out[k] = JSON.parse(localStorage.getItem(key(k)) || '[]'));
  downloadTextFile(`${(document.getElementById('kelasSelect')?.value||'class')}_backup.json`, JSON.stringify(out, null, 2));
}
function importAllJSON() {
  const f = document.getElementById('importFile');
  if (!f || !f.files.length) return alert('Pilih file JSON');
  const r = new FileReader();
  r.onload = e => {
    try {
      const data = JSON.parse(e.target.result);
      Object.keys(data).forEach(k => localStorage.setItem(key(k), JSON.stringify(data[k])));
      muatSemuaData();
      alert('Restore berhasil');
    } catch(err) { alert('File JSON tidak valid'); }
  };
  r.readAsText(f.files[0]);
}


/* ---------- LOGIN (guru) ---------- */
function registerGuru() {
  const user = document.getElementById('guruUsername')?.value.trim();
  const pass = document.getElementById('guruPassword')?.value.trim();
  const mapel = document.getElementById('guruMapel')?.value;
  if (!user||!pass||!mapel) return alert('Isi semua field');
  const accounts = JSON.parse(localStorage.getItem('agendaApp_gurus')||'[]');
  if (accounts.find(a=>a.user===user)) return alert('Username sudah ada');
  accounts.push({ user, pass, mapel });
  localStorage.setItem('agendaApp_gurus', JSON.stringify(accounts));
  alert('Registrasi sukses');
}
function loginGuru() {
  const user = document.getElementById('guruUsername')?.value.trim();
  const pass = document.getElementById('guruPassword')?.value.trim();
  const accounts = JSON.parse(localStorage.getItem('agendaApp_gurus')||'[]');
  const a = accounts.find(x=>x.user===user&&x.pass===pass);
  if (!a) return alert('Login gagal');
  localStorage.setItem("agendaApp_loggedGuru", JSON.stringify(a));
  tampilkanGuru(a);
  updateLoginUI();  // 🔹 update tombol nav & tab
  alert("Login sukses!");
}
function tampilkanGuru(a) {
  const statusEl = document.getElementById('guruStatus');
  if (statusEl) statusEl.textContent = `Login sebagai: ${a.user} (${a.mapel})`;
  const prof = document.getElementById("guruProfile");
  if (prof) prof.innerHTML = `👩‍🏫 Halo, ${a.user} <small>(${a.mapel})</small>`;
}
function cekLoginGuru() {
  const g = localStorage.getItem("agendaApp_loggedGuru");
  if (g) {
    try {
      const a = JSON.parse(g);
      tampilkanGuru(a);
    } catch(e) { localStorage.removeItem("agendaApp_loggedGuru"); }
  }
}
function logoutGuru() {
  localStorage.removeItem("agendaApp_loggedGuru");
  const prof = document.getElementById("guruProfile");
  if (prof) prof.innerHTML = '';
  const statusEl = document.getElementById('guruStatus');
  if (statusEl) statusEl.textContent = 'Belum login.';
  updateLoginUI();  // 🔹 update tombol nav & tab
}

/* ---------- UPDATE UI LOGIN/LOGOUT ---------- */
function updateLoginUI() {
  const g = localStorage.getItem("agendaApp_loggedGuru");
  const loginBtn = document.querySelector("nav.tabs .tab-button[onclick*='loginTab']");
  const loginTab = document.getElementById("loginTab");

  if (g) {
    const a = JSON.parse(g);
    if (loginBtn) {
      loginBtn.textContent = "Logout";
      loginBtn.onclick = () => { logoutGuru(); };
    }
    if (loginTab) {
      loginTab.innerHTML = `
        <h2>👩‍🏫 Guru Aktif</h2>
        <div style="text-align:center; padding:20px;">
          <img src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
               alt="Guru" style="width:80px; height:80px; border-radius:50%; margin-bottom:10px;">
          <p><strong>${a.user}</strong><br><small>${a.mapel}</small></p>
          <button onclick="logoutGuru();">Logout</button>
        </div>
      `;
    }
  } else {
    if (loginBtn) {
      loginBtn.textContent = "Login";
      loginBtn.setAttribute("onclick", "openTab('loginTab', this)");
    }
    if (loginTab) {
      loginTab.innerHTML = `
        <h2>🔐 Login / Register</h2>
        <div class="form-row">
          <input id="guruUsername" placeholder="Username">
          <input id="guruPassword" placeholder="Password" type="password">
          <select id="guruMapel">
            <option value="">Pilih Mapel</option>
            <option>Matematika</option>
            <option>Pemrograman Web</option>
          </select>
          <button onclick="registerGuru()">Register (Guru)</button>
          <button onclick="loginGuru();">Login (Guru)</button>
        </div>
        <div class="form-row">
          <input id="siswaLoginNama" placeholder="Nama Siswa">
          <button onclick="loginSiswa()">Login Siswa (View)</button>
        </div>
        <p id="guruStatus">Belum login.</p>
      `;
    }
  }
}

/* ---------- INIT ---------- */
function muatSemuaData() {
  populateSiswaSelect();
  renderSiswaTable();
  renderAgendaList();
  renderAbsensiTable();
  muatCatatan();
  muatJadwal();
  renderModulList();
  refreshCalendarEvents();
  updateDashboard();
}

window.addEventListener('DOMContentLoaded', () => {
  const sel = document.getElementById('kelasSelect');
  const savedK = localStorage.getItem('agendaApp_selectedKelas');
  if (sel && savedK) sel.value = savedK;
  loadTheme();
  initCalendar();
  initChart();
  muatSemuaData();
  cekLoginGuru();
  updateLoginUI(); // 🔹 pastikan UI sesuai status

});


// Toggle hamburger nav
document.getElementById("hamburgerBtn").addEventListener("click", function() {
  document.getElementById("navTabs").classList.toggle("show");
});
