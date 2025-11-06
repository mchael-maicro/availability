// script.js - Now supports either a published Google Sheet CSV or an Excel file (OneDrive link).
//
// Edit below:
// If you have a Google Sheet CSV (publish to web -> CSV) set SHEET_CSV_URL to that link.
// If you have an Excel/OneDrive share link, set EXCEL_URL to that link (the file must be publicly accessible).

const SHEET_CSV_URL = ""; // e.g. "https://docs.google.com/....pub?output=csv"
const EXCEL_URL = "https://1drv.ms/x/c/8CBBAFAEAF84A094/EUFxu-FB475MkXthDCS904IBiqv5GYGgyELKoXtY2YN05w?e=RRkJiK&nav=MTVfezY5RTA4MkMwLTk0ODgtNEI4MS1BN0I3LTI4QjMwOERCOTExM30"; // inserted the OneDrive link you provided

const STATUS_COLORS = {
  "Available": "#4CAF50",
  "Sold": "#F44336",
  "Reserved": "#FFC107",
  "Unavailable": "#9E9E9E"
};

// On load: inject svg, then fetch statuses and areas
document.addEventListener('DOMContentLoaded', async () => {
  await loadSvg();
  if (SHEET_CSV_URL) { await fetchCsvAndApply(SHEET_CSV_URL); }
  if (EXCEL_URL) { await fetchExcelAndApply(EXCEL_URL); }
  // if neither provided, apply mock statuses for demo
  if (!SHEET_CSV_URL && !EXCEL_URL) { applyMockDemo(); }
  attachInteractivity();
});

async function loadSvg() {
  const container = document.getElementById('svg-container');
  const res = await fetch('floorplan.svg');
  const text = await res.text();
  container.innerHTML = text;
}

async function fetchCsvAndApply(url) {
  try { const r = await fetch(url); if(!r.ok) throw new Error('CSV fetch failed'); const csv = await r.text(); const items = csvToArray(csv); applyStatusesArray(items); } catch(e) { console.error(e); }
}

async function fetchExcelAndApply(url) {
  try {
    // fetch as arrayBuffer and parse with XLSX (SheetJS)
    const r = await fetch(url);
    if (!r.ok) throw new Error('Excel fetch failed: ' + r.status);
    const buf = await r.arrayBuffer();
    const data = new Uint8Array(buf);
    const wb = XLSX.read(data, { type: 'array' });
    // assume first sheet and column C contains areas starting at row 3 (C3..C44)
    const firstSheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[firstSheetName];
    const areas = {};
    for (let row = 3; row <= 44; row++) {
      const cellAddr = 'C' + row;
      const cell = sheet[cellAddr];
      const val = cell ? (cell.v+'').trim() : '';
      const shopIndex = row - 2; // row3 -> shop1
      const shopId = 'Shop-' + shopIndex;
      if (val) {
        areas[shopId] = val;
      }
    }
    // apply areas to SVG: create/replace text elements inside #areas group
    const svg = document.querySelector('#svg-container svg');
    const areasGroup = svg.querySelector('#areas');
    // clear existing
    areasGroup.innerHTML = '';
    Object.keys(areas).forEach(id => {
      const val = areas[id];
      const shop = svg.querySelector('#' + id);
      if (!shop) return;
      // compute a position for the area text: near the shop's rect center if available
      const rect = shop.querySelector('rect');
      let x = 0, y = 0;
      if (rect) {
        const rx = parseFloat(rect.getAttribute('x') || 0);
        const ry = parseFloat(rect.getAttribute('y') || 0);
        const rw = parseFloat(rect.getAttribute('width') || 0);
        const rh = parseFloat(rect.getAttribute('height') || 0);
        x = rx + rw - 6; // right inside corner
        y = ry + rh - 6;
      } else {
        // fallback: use bbox
        const bbox = shop.getBBox();
        x = bbox.x + bbox.width - 6;
        y = bbox.y + bbox.height - 6;
      }
      const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      textEl.setAttribute('x', x.toString());
      textEl.setAttribute('y', y.toString());
      textEl.setAttribute('text-anchor', 'end');
      textEl.setAttribute('class', 'area-text');
      textEl.textContent = val;
      areasGroup.appendChild(textEl);
    });
  } catch (err) {
    console.error('Error parsing Excel:', err);
  }
}

function csvToArray(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const items = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    if (cols.length >= 2) {
      const obj = {};
      for (let j = 0; j < headers.length; j++) {
        obj[headers[j]] = (cols[j] || '').trim();
      }
      items.push(obj);
    }
  }
  return items;
}

function applyStatusesArray(items) {
  items.forEach(entry => {
    const id = entry.unitId;
    const status = entry.status;
    if (!id) return;
    const el = document.getElementById(id);
    if (!el) {
      console.warn('No SVG element found for', id);
      return;
    }
    el.setAttribute('data-status', status);
    const shapes = el.querySelectorAll('rect, path, polygon, ellipse, circle');
    if (shapes.length > 0) {
      shapes.forEach(s => s.style.fill = STATUS_COLORS[status] || STATUS_COLORS['Unavailable']);
    } else {
      el.style.fill = STATUS_COLORS[status] || STATUS_COLORS['Unavailable'];
    }
    el.setAttribute('aria-label', `${id} — ${status}`);
  });
}

function applyMockDemo() {
  const mock = [
    { unitId: "Shop-10", status: "Sold" },
    { unitId: "Shop-11", status: "Available" },
    { unitId: "Shop-12", status: "Reserved" },
    { unitId: "Shop-1", status: "Available" },
    { unitId: "Shop-2", status: "Unavailable" }
  ];
  applyStatusesArray(mock);
}

function attachInteractivity() {
  const svg = document.querySelector('#svg-container svg');
  if (!svg) return;
  const tip = document.createElement('div');
  tip.style.position = 'absolute';
  tip.style.padding = '6px 8px';
  tip.style.background = 'rgba(0,0,0,0.75)';
  tip.style.color = 'white';
  tip.style.fontSize = '12px';
  tip.style.borderRadius = '4px';
  tip.style.pointerEvents = 'none';
  tip.style.display = 'none';
  document.body.appendChild(tip);

  svg.querySelectorAll('[id^="Shop-"], [id^="Unit-"], [data-unit]').forEach(el => {
    el.addEventListener('mousemove', (ev) => {
      const id = el.id || el.getAttribute('data-unit') || 'unit';
      const status = el.getAttribute('data-status') || 'Unknown';
      tip.textContent = `${id}: ${status}`;
      tip.style.left = (ev.pageX + 12) + 'px';
      tip.style.top = (ev.pageY + 12) + 'px';
      tip.style.display = 'block';
    });
    el.addEventListener('mouseleave', () => { tip.style.display = 'none'; });

    el.addEventListener('click', () => {
      const cycle = ['Available','Reserved','Sold','Unavailable'];
      const cur = el.getAttribute('data-status') || 'Unavailable';
      const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length] || 'Available';
      el.setAttribute('data-status', next);
      const shapes = el.querySelectorAll('rect, path, polygon, ellipse, circle');
      if (shapes.length > 0) {
        shapes.forEach(s => s.style.fill = STATUS_COLORS[next]);
      } else {
        el.style.fill = STATUS_COLORS[next];
      }
      el.setAttribute('aria-label', `${el.id} — ${next}`);
    });
  });
}
