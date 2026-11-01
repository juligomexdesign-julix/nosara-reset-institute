(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const D = JSON.parse($('#avail-data').textContent);
const ROOMS = { ocean: ['Ocean Suite', 'Terrace facing the Pacific'], jungle: ['Jungle Casita', 'The quietest, set in the garden'], tree: ['Treehouse Room', 'In the canopy, for one guest'] };
const S = { step: 1, program: null, date: null, room: null, guests: 1 };
const steps = $$('.bk-step'), marks = $$('.bk-steps li'), next = $('.bk-next'), back = $('.bk-back'), err = $('.bk-error');
const money = n => '$' + n.toLocaleString('en-US');
const fmt = (d, o = { weekday: 'short', day: 'numeric', month: 'short' }) => d.toLocaleDateString('en-GB', o);
const iso = d => d.toISOString().slice(0, 10);
const parse = s => new Date(s + 'T12:00:00');

/* ---------- step 1 ---------- */
$$('input[name=program]').forEach(r => r.addEventListener('change', () => { S.program = r.value; S.date = null; S.room = null; calMonth = null; summary(); hideErr(); }));
const pre = location.hash.slice(1);
if (D.programs[pre]) { const r = $(`input[value="${pre}"]`); r.checked = true; S.program = pre; }

/* ---------- step 2: calendar ---------- */
const grid = $('.cal-grid'), title = $('.cal-title'), prevB = $('.cal-prev'), nextB = $('.cal-next');
let calMonth = null;
const isFull = r => r && !r.remote && (r.ocean + r.jungle + r.tree) === 0;
function months() { const ds = Object.keys(D.dates[S.program] || {}).sort(); return [...new Set(ds.map(d => d.slice(0, 7)))]; }
function renderCal() {
  const ms = months(); if (!ms.length) return;
  if (!calMonth || !ms.includes(calMonth)) calMonth = (S.date && S.date.slice(0, 7)) || ms.find(m => Object.entries(D.dates[S.program]).some(([d, r]) => d.startsWith(m) && !isFull(r))) || ms[0];
  const [y, m] = calMonth.split('-').map(Number), first = new Date(y, m - 1, 1, 12), days = new Date(y, m, 0).getDate();
  title.textContent = fmt(first, { month: 'long', year: 'numeric' });
  prevB.disabled = ms.indexOf(calMonth) === 0; nextB.disabled = ms.indexOf(calMonth) === ms.length - 1;
  let h = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<span class="cal-dow" aria-hidden="true">${d}</span>`).join('');
  h += '<span></span>'.repeat((first.getDay() + 6) % 7);
  for (let d = 1; d <= days; d++) {
    const key = `${calMonth}-${String(d).padStart(2, '0')}`, r = (D.dates[S.program] || {})[key];
    const label = fmt(parse(key), { weekday: 'long', day: 'numeric', month: 'long' });
    if (!r) h += `<button type="button" class="cal-day" disabled aria-label="${label}, no start">${d}</button>`;
    else if (isFull(r)) h += `<button type="button" class="cal-day full" disabled aria-label="${label}, full">${d}</button>`;
    else h += `<button type="button" class="cal-day av${S.date === key ? ' sel' : ''}" data-d="${key}" aria-pressed="${S.date === key}" aria-label="${label}, available">${d}</button>`;
  }
  grid.innerHTML = h;
  $$('.cal-day.av', grid).forEach(b => b.addEventListener('click', () => { S.date = b.dataset.d; S.room = null; renderCal(); summary(); hideErr(); }));
}
prevB.addEventListener('click', () => { const ms = months(); calMonth = ms[Math.max(0, ms.indexOf(calMonth) - 1)]; renderCal(); });
nextB.addEventListener('click', () => { const ms = months(); calMonth = ms[Math.min(ms.length - 1, ms.indexOf(calMonth) + 1)]; renderCal(); });

/* ---------- step 3: rooms free on that date ---------- */
const ro = $('.rooms-opts'), gsel = $('select[name=guests]');
function renderRooms() {
  const p = D.programs[S.program], r = D.dates[S.program][S.date];
  ro.innerHTML = Object.entries(ROOMS).map(([k, [n, d]]) => {
    const left = r[k], sup = p.rooms[k], disabled = !left;
    const tag = disabled ? 'Full' : (left <= 2 ? `${left} left` : 'Available');
    return `<label class="opt"><input type="radio" name="room" value="${k}"${disabled ? ' disabled' : ''}${S.room === k ? ' checked' : ''}><span class="o-in"><span class="o-left"><span class="h-s">${n}</span></span><span class="small">${d}<br>${tag} · ${sup ? '+ ' + money(sup) : 'Included'}</span></span></label>`;
  }).join('');
  $$('input[name=room]', ro).forEach(x => x.addEventListener('change', () => { S.room = x.value; if (S.room === 'tree') { gsel.value = '1'; S.guests = 1; } gsel.querySelector('[value="2"]').disabled = S.room === 'tree'; summary(); hideErr(); }));
}
gsel.addEventListener('change', () => { S.guests = +gsel.value; summary(); });

/* ---------- summary ---------- */
function total() {
  if (!S.program) return null; const p = D.programs[S.program];
  let t = p.base; if (S.room) t += p.rooms[S.room] || 0; if (S.guests === 2) t += p.guest2; return t;
}
function dates() {
  if (!S.date) return null; const p = D.programs[S.program], a = parse(S.date);
  if (!p.nights) return 'Starts ' + fmt(a);
  const b = new Date(a); b.setDate(b.getDate() + p.nights); return `${fmt(a)} – ${fmt(b)}`;
}
function summary() {
  const p = S.program && D.programs[S.program];
  $('[data-s=program]').textContent = p ? p.name : '—';
  $('[data-s=dates]').textContent = dates() || '—';
  $('[data-s=room]').textContent = S.program === 'integration' ? 'Remote' : (S.room ? ROOMS[S.room][0] : '—');
  $('[data-s=guests]').textContent = S.guests;
  const t = total(); $('[data-s=total]').textContent = t ? money(t) : '—';
}

/* ---------- navigation ---------- */
function hideErr() { err.hidden = true; }
function showErr(m) { err.textContent = m; err.hidden = false; }
function stepList() { return S.program === 'integration' ? [1, 2, 4] : [1, 2, 3, 4]; }
function go(n, quiet) {
  S.step = n;
  steps.forEach(s => s.hidden = +s.dataset.step !== n);
  marks.forEach((m, i) => { m.classList.toggle('on', i + 1 === n); m.classList.toggle('done', i + 1 < n); if (i + 1 === n) m.setAttribute('aria-current', 'step'); else m.removeAttribute('aria-current'); });
  back.hidden = n === 1; next.textContent = n === 4 ? 'Send booking request' : 'Continue';
  if (n === 2) renderCal(); if (n === 3) renderRooms();
  hideErr();
  if (quiet) return;
  const lg = $(`.bk-step[data-step="${n}"] legend`); lg.setAttribute('tabindex', '-1'); lg.focus({ preventScroll: true });
  const top = $('.bk-steps').getBoundingClientRect().top + scrollY - 120; if (scrollY > top) scrollTo({ top, behavior: 'smooth' });
}
next.addEventListener('click', () => {
  const L = stepList(), i = L.indexOf(S.step);
  if (S.step === 1 && !S.program) return showErr('Choose a program to continue.');
  if (S.step === 2 && !S.date) return showErr('Choose an available arrival date.');
  if (S.step === 3 && !S.room) return showErr('Choose a room. Rooms marked “Full” are not available on this date.');
  if (S.step === 4) return submit();
  go(L[i + 1]);
});
back.addEventListener('click', () => { const L = stepList(); go(L[Math.max(0, L.indexOf(S.step) - 1)]); });

function submit() {
  const f = $('.bk-step[data-step="4"]'); let first = null;
  $$('[required]', f).forEach(inp => {
    const ok = inp.type === 'checkbox' ? inp.checked : inp.type === 'email' ? /^\S+@\S+\.\S+$/.test(inp.value) : inp.value.trim() !== '';
    inp.closest('.f2, .check2').classList.toggle('bad', !ok); inp.setAttribute('aria-invalid', !ok); if (!ok && !first) first = inp;
  });
  if (first) { first.focus(); return; }
  const p = D.programs[S.program];
  $('.done-facts').innerHTML = [['Program', p.name], ['Dates', dates()], ['Room', S.program === 'integration' ? 'Remote' : ROOMS[S.room][0]], ['Total', money(total())]].map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
  const a = parse(S.date), b = new Date(a); b.setDate(b.getDate() + (p.nights || 1));
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Nosara Reset Institute//EN', 'BEGIN:VEVENT', `UID:${Date.now()}@nosarareset.com`, `DTSTART;VALUE=DATE:${iso(a).replace(/-/g, '')}`, `DTEND;VALUE=DATE:${iso(b).replace(/-/g, '')}`, `SUMMARY:${p.name} · Nosara Reset Institute`, 'LOCATION:Playa Guiones, Nosara, Costa Rica', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  $('.ics').href = 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  $('.bk-steps').hidden = true; $('.bk-grid').hidden = true;
  const done = $('.bk-done'); done.hidden = false; done.focus();
  scrollTo({ top: done.getBoundingClientRect().top + scrollY - 140, behavior: 'smooth' });
}
$$('.bk-step[data-step="4"] input, .bk-step[data-step="4"] textarea').forEach(i => i.addEventListener('input', () => { const w = i.closest('.bad'); if (w) w.classList.remove('bad'); }));

summary(); go(1, true);
})();
