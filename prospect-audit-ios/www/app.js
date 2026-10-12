// Syntrix Audit — field audit app. Plain JS, offline-first, Capacitor-aware.
const CHECKS = {
  google: [
    ['claimed', 'Google Business Profile claimed & verified', 3],
    ['cat', 'Primary + secondary categories set correctly', 2],
    ['hours', 'Hours accurate (incl. holidays)', 2],
    ['photos', '10+ recent photos (not just logo)', 2],
    ['reviews', '4.2+ rating and 25+ reviews', 3],
    ['reply', 'Owner replies to reviews', 2],
    ['posts', 'Posted in last 30 days', 1],
    ['nap', 'Name/address/phone consistent everywhere', 2],
    ['book', 'Booking / call / message buttons enabled', 2],
    ['missed', 'Calls answered live or missed-call text-back', 3],
  ],
  social: [
    ['fb', 'Facebook page active (post in last 14 days)', 2],
    ['ig', 'Instagram active & branded', 2],
    ['cadence', 'Posts 3+ times/week', 2],
    ['dm', 'DMs/comments answered within 1 day', 2],
    ['cta', 'Bio links to booking/website', 1],
  ],
  website: [
    ['ssl', 'HTTPS, loads under 3s on mobile', 2],
    ['mobile', 'Mobile friendly, click-to-call button', 2],
    ['form', 'Lead form / chat / booking on homepage', 3],
    ['after', 'After-hours capture (form, bot, text)', 2],
    ['seo', 'City + service in title/H1', 1],
    ['crm', 'Leads go into a CRM with auto follow-up', 3],
  ],
};
const RECS = {
  missed: 'Missed-call text-back + AI receptionist (GHL) — recover lost calls 24/7',
  reply: 'Automated review request + AI-drafted review replies',
  reviews: 'Review-generation automation (SMS after job)',
  posts: 'Social/GBP content automation (weekly auto-posts)',
  fb: 'Social content automation', ig: 'Social content automation',
  cadence: 'Social content automation (batch + schedule)',
  dm: 'Unified inbox + AI DM/comment responder',
  form: 'Lead capture form + instant follow-up sequence',
  after: 'After-hours AI chat/SMS agent',
  crm: 'GHL CRM pipeline + automated follow-up',
  book: 'Online booking + reminders (cut no-shows)',
  mobile: 'Click-to-call/mobile fixes on site',
};

const $ = s => document.querySelector(s);
const app = $('#app');
const uid = () => Math.random().toString(36).slice(2, 10);
const P = () => (window.Capacitor && Capacitor.Plugins) || {};

// ---- storage (Preferences on device, localStorage on web) ----
const store = {
  async get(k) { try { const v = P().Preferences ? (await P().Preferences.get({ key: k })).value : localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  async set(k, v) { const s = JSON.stringify(v); try { P().Preferences ? await P().Preferences.set({ key: k, value: s }) : localStorage.setItem(k, s); } catch {} },
};
let audits = [], settings = { backend: '' }, cur = null, tab = 'google';
const save = () => store.set('audits', audits);

function score(a, group) {
  const list = group ? CHECKS[group] : Object.values(CHECKS).flat();
  const max = list.reduce((s, c) => s + c[2], 0);
  const got = list.reduce((s, c) => s + (a.checks[c[0]] ? c[2] : 0), 0);
  return Math.round((got / max) * 100);
}
const gaps = a => Object.values(CHECKS).flat().filter(c => !a.checks[c[0]]).sort((x, y) => y[2] - x[2]);

function summaryText(a) {
  const g = gaps(a);
  const recs = [...new Set(g.map(c => RECS[c[0]]).filter(Boolean))].slice(0, 6);
  return `AUDIT: ${a.name}${a.city ? ' — ' + a.city : ''}
Date: ${new Date(a.updated).toLocaleDateString()}
Overall: ${score(a)}/100  (Google ${score(a,'google')} · Social ${score(a,'social')} · Website ${score(a,'website')})

TOP GAPS
${g.slice(0, 6).map(c => '• ' + c[1]).join('\n') || '• None — strong presence'}

RECOMMENDED SYSTEMS
${recs.map(r => '• ' + r).join('\n') || '• Maintenance only'}

NOTES
${a.notes || '—'}`;
}

// ---- views ----
function esc(s) { return String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function chrome(title, inAudit) {
  $('#title').textContent = title;
  $('#backBtn').hidden = !inAudit; $('#newBtn').hidden = inAudit; $('#tabs').hidden = !inAudit;
}

function renderList() {
  cur = null; chrome('Audits', false);
  app.innerHTML = `<div class="card"><b>Settings</b>
    <input id="be" placeholder="Backend URL for Google lookup (optional)" value="${esc(settings.backend)}" autocapitalize="off">
    <span class="mut">Lookup returns name, phone, rating, reviews, hours. Leave blank to enter manually.</span></div>` +
    (audits.length ? audits.map(a => `<div class="card row" data-id="${a.id}"><div><b>${esc(a.name)}</b><div class="mut">${esc(a.city)} · ${new Date(a.updated).toLocaleDateString()}</div></div><div class="score ${score(a) >= 70 ? 'good' : 'poor'}">${score(a)}</div></div>`).join('')
      : '<p class="mut">No audits yet. Tap + New to start one on-site.</p>');
  $('#be').onchange = e => { settings.backend = e.target.value.trim(); store.set('settings', settings); };
  app.querySelectorAll('[data-id]').forEach(el => el.onclick = () => open(el.dataset.id));
}

async function newAudit() {
  const name = prompt('Business name?'); if (!name) return;
  const a = { id: uid(), name, city: '', notes: '', checks: {}, photos: [], updated: Date.now() };
  if (settings.backend) {
    try {
      const r = await fetch(`${settings.backend.replace(/\/$/, '')}/lookup?q=${encodeURIComponent(name)}`);
      const d = await r.json(); Object.assign(a, { name: d.name || name, city: d.city || '', notes: d.summary || '' });
      if (d.rating >= 4.2) a.checks.reviews = true;
      if (d.hours) a.checks.hours = true;
    } catch { /* offline: continue manually */ }
  }
  audits.unshift(a); save(); open(a.id);
}

function open(id) { cur = audits.find(a => a.id === id); tab = 'google'; renderTab(); }

function renderTab() {
  chrome(cur.name, true);
  document.querySelectorAll('#tabs button').forEach(b => b.classList.toggle('on', b.dataset.t === tab));
  if (tab === 'summary') return renderSummary();
  app.innerHTML = `<div class="card row"><span>${tab[0].toUpperCase() + tab.slice(1)} score</span><span class="score ${score(cur, tab) >= 70 ? 'good' : 'poor'}">${score(cur, tab)}</span></div>
    <div class="card">${CHECKS[tab].map(c => `<label class="chk"><input type="checkbox" data-k="${c[0]}" ${cur.checks[c[0]] ? 'checked' : ''}><span>${c[1]}</span></label>`).join('')}</div>`;
  app.querySelectorAll('input[data-k]').forEach(i => i.onchange = () => { cur.checks[i.dataset.k] = i.checked; touch(); renderTab(); });
}

function renderSummary() {
  app.innerHTML = `<div class="card row"><span>Overall</span><span class="score ${score(cur) >= 70 ? 'good' : 'poor'}">${score(cur)}</span></div>
    <div class="card"><input id="city" placeholder="City" value="${esc(cur.city)}"><textarea id="notes" placeholder="Notes from the visit…">${esc(cur.notes)}</textarea>
    <button class="ghost" id="photo">📷 Add photo</button><div>${cur.photos.map(p => `<img class="ph" src="${p}">`).join('')}</div></div>
    <div class="card"><pre>${esc(summaryText(cur))}</pre></div>
    <div class="row"><button id="share" style="flex:1">Share summary</button><button class="ghost" id="del">Delete</button></div>`;
  $('#city').onchange = e => { cur.city = e.target.value; touch(); };
  $('#notes').onchange = e => { cur.notes = e.target.value; touch(); renderSummary(); };
  $('#photo').onclick = addPhoto;
  $('#share').onclick = shareIt;
  $('#del').onclick = () => { if (confirm('Delete this audit?')) { audits = audits.filter(a => a !== cur); save(); renderList(); } };
}

const touch = () => { cur.updated = Date.now(); save(); };

async function addPhoto() {
  try {
    if (P().Camera) {
      const r = await P().Camera.getPhoto({ quality: 60, width: 1000, resultType: 'dataUrl', source: 'PROMPT' });
      cur.photos.push(r.dataUrl);
    } else {
      const f = await new Promise(res => { const i = document.createElement('input'); i.type = 'file'; i.accept = 'image/*'; i.capture = 'environment'; i.onchange = () => res(i.files[0]); i.click(); });
      if (!f) return;
      cur.photos.push(await new Promise(res => { const fr = new FileReader(); fr.onload = () => res(fr.result); fr.readAsDataURL(f); }));
    }
    touch(); renderSummary();
  } catch { /* cancelled */ }
}

async function shareIt() {
  const text = summaryText(cur);
  try {
    if (P().Share) await P().Share.share({ title: 'Audit: ' + cur.name, text, dialogTitle: 'Send audit' });
    else if (navigator.share) await navigator.share({ title: 'Audit: ' + cur.name, text });
    else { await navigator.clipboard.writeText(text); alert('Copied to clipboard'); }
  } catch { /* cancelled */ }
}

// ---- wiring ----
$('#newBtn').onclick = newAudit;
$('#backBtn').onclick = renderList;
document.querySelectorAll('#tabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; renderTab(); });
(async () => {
  audits = (await store.get('audits')) || [];
  settings = (await store.get('settings')) || settings;
  renderList();
})();
