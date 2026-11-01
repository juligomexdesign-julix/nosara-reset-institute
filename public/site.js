(() => {
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => 1 - Math.pow(1 - t, 3);
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth <= 760;
document.documentElement.classList.add('js');

function prog(el) { const r = el.getBoundingClientRect(); const t = r.height - innerHeight; return t > 0 ? clamp(-r.top / t) : (r.top < 0 ? 1 : 0); }

/* ---------- 1 · hero: the window grows until it is the whole screen ----------
   Only transforms and opacity change while scrolling (GPU-composited): the window
   shape is drawn once per resize, then the layer is scaled and the video counter-scaled. */
const hero = $('.hero'), stage = hero && $('.stage', hero), win = hero && $('.win', hero), winIn = hero && $('.win-in', hero);
const echoWrap = $('.echo-wrap'), echoes = $('.echoes'), tf = $('.echoes .tf'), logo = $('.hero-logo');
const SHAPE = win ? win.dataset.shape : '';
let W = innerWidth, H = innerHeight, CX = 0, CY = 0, SEND = 1;
function resize() {
  W = innerWidth; if (!hero) return; H = stage.clientHeight || innerHeight;
  const m = mobile();
  CX = m ? W * 0.5 : W * 0.7; CY = m ? H * 0.64 : H * 0.5;
  const R = (m ? W * 0.33 : Math.min(W * 0.19, H * 0.32)) / 100;
  let n = 0;
  const d = SHAPE.replace(/-?\d*\.?\d+/g, v => { const o = (n++ % 2 === 0) ? CX + v * R : CY + v * R; return o.toFixed(1); });
  win.style.clipPath = `path('${d}')`;
  win.style.transformOrigin = winIn.style.transformOrigin = echoWrap.style.transformOrigin = `${CX}px ${CY}px`;
  echoes.setAttribute('viewBox', `0 0 ${W} ${H}`);
  tf.setAttribute('transform', `translate(${CX.toFixed(1)} ${CY.toFixed(1)}) scale(${R.toFixed(4)})`);
  const far = Math.hypot(Math.max(CX, W - CX), Math.max(CY, H - CY));
  SEND = far / (0.7 * R * 100);
}
let lastHP = -1;
function heroFrame(p) {
  if (Math.abs(p - lastHP) < 0.0005) return; lastHP = p;
  const e = Math.pow(p, 1.8), s = 1 + (SEND - 1) * e;
  win.style.transform = `scale(${s.toFixed(4)})`;
  winIn.style.transform = `scale(${(1 / s).toFixed(5)})`;
  echoWrap.style.transform = `scale(${(1 + e * 1.6).toFixed(4)})`;
  echoWrap.style.opacity = (1 - clamp(p * 2.2)).toFixed(3);
  logo.style.opacity = (1 - clamp(p * 2.6)).toFixed(3);
}

/* ---------- 3 · words light up as you read ---------- */
const fillWords = $$('.fill .w'), stmt = $('.statement');
function statement() {
  if (!stmt) return;
  const r = stmt.getBoundingClientRect();
  const p = clamp((innerHeight * 0.8 - r.top) / (r.height * 0.9));
  const k = Math.round(p * fillWords.length);
  fillWords.forEach((w, i) => w.classList.toggle('on', RM || i < k));
}

/* ---------- 5 · programs: colour cards slide in, one over the other ---------- */
const progSec = $('.programs'), cards = $$('.panel'), bar = $('.p-bar i'), cur = $('.p-cur'), deck = $('.p-cards');
function programs() {
  if (!progSec || mobile() || RM) return;
  const t = clamp((prog(progSec) - 0.03) / 0.94);
  const k = Math.min(2, Math.floor(t * 3)), l = t * 3 - k;
  const pos = k + (l < 0.35 ? 0 : ease((l - 0.35) / 0.65));   // rest on each card, then glide
  cards.forEach((c, i) => {
    const inn = clamp(pos - (i - 1));            // 0 → 1 while this card arrives
    const under = clamp(pos - i);                // 0 → 1 while the next one covers it
    const x = i === 0 ? 0 : (1 - inn) * 110;
    const sc = 1 - 0.06 * under;
    c.style.transform = `translate3d(${x.toFixed(2)}%,0,0) scale(${sc.toFixed(4)})`;
  });
  bar.style.setProperty('--p', (pos / 3).toFixed(3));
  cur.textContent = '0' + (Math.round(pos) + 1);
}
deck && deck.addEventListener('scroll', () => { if (!mobile()) return; const i = Math.round(deck.scrollLeft / (cards[0].offsetWidth + 12)); cur.textContent = '0' + (i + 1); bar.style.setProperty('--p', (i / 3).toFixed(3)); }, { passive: true });

/* ---------- 9 · gallery: continuous sideways drift ---------- */
const gal = $('.gallery'), gtrack = $('.g-track'), gbar = $('.g-bar i');
function gallery() {
  if (!gal || mobile() || RM) return;
  const p = prog(gal), max = gtrack.scrollWidth - innerWidth;
  gtrack.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`;
  gbar.style.setProperty('--p', p.toFixed(3));
}
gtrack && gtrack.addEventListener('scroll', () => { if (mobile()) gbar.style.setProperty('--p', (gtrack.scrollLeft / (gtrack.scrollWidth - gtrack.clientWidth)).toFixed(3)); }, { passive: true });

/* ---------- programs page: each image settles from a slow zoom as its card scrolls through ---------- */
const pzs = $$('.pz');
function zooms() {
  if (RM) return;
  pzs.forEach(f => { const r = f.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight) return;
    const p = clamp((innerHeight - r.top) / (innerHeight + r.height)); f.style.setProperty('--z', (1.22 - 0.22 * p).toFixed(4)); });
}

/* ---------- header ---------- */
const top = $('.top'); let lastY = 0;
function header() {
  const y = scrollY;
  const inHero = !!hero && hero.getBoundingClientRect().bottom > 60 && prog(hero) < 0.9;
  let dark;
  if (inHero) dark = true;
  else {
    const el = document.elementFromPoint(W / 2, top.offsetHeight + 4);
    const sec = el && el.closest('[data-header]');
    dark = !!sec && sec.dataset.header === 'dark';
  }
  top.classList.toggle('in-hero', inHero && prog(hero) < 0.35);
  top.classList.toggle('dark', dark);
  top.classList.toggle('solid', !inHero && !dark);
  if (y > lastY + 4 && y > innerHeight * 2.4) top.classList.add('hide');
  if (y < lastY - 4) top.classList.remove('hide');
  lastY = y;
}

/* ---------- reveals ---------- */
const rvs = $$('.rv, .wipe');
function reveal() { rvs.forEach(el => { if (!el.classList.contains('in') && el.getBoundingClientRect().top < innerHeight * 0.88) el.classList.add('in'); }); }
setTimeout(() => rvs.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('in'); }), 2500);

/* ---------- floating button + cookies appear after the hero ---------- */
const avBtn = $('.avail-btn'), foot = $('.foot'), ck = $('.cookies');
function floating() {
  const early = !!hero && scrollY < innerHeight * 0.9;
  avBtn.classList.toggle('pre', early); ck.classList.toggle('pre', early);
  avBtn.classList.toggle('away', foot.getBoundingClientRect().top < innerHeight - 40);
}

let ticking = false;
function tick() {
  ticking = false;
  if (hero && !RM && hero.getBoundingClientRect().bottom > 0) heroFrame(prog(hero));
  programs(); gallery(); zooms(); statement(); header(); reveal(); floating();
}
addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(tick); } }, { passive: true });
addEventListener('resize', () => { resize(); lastHP = -1; tick(); });

/* ---------- 6 · rooms: a rectangular image follows the cursor ---------- */
const peek = $('.peek'), peekImg = peek && $('img', peek);
let mx = 0, my = 0, px = 0, py = 0;
$$('.room').forEach(r => {
  r.addEventListener('mouseenter', () => { peekImg.src = r.dataset.img; peek.classList.add('on'); });
  r.addEventListener('mouseleave', () => peek.classList.remove('on'));
});
addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
peek && (function follow() { px += (mx + 40 - px) * 0.14; py += (my - 170 - py) * 0.14; peek.style.transform = `translate(${px.toFixed(1)}px, ${py.toFixed(1)}px)`; requestAnimationFrame(follow); })();

/* ---------- 8 · testimonials ---------- */
const slides = $$('.v-slide'), vcur = $('.v-cur'); let vi = 0;
if (slides.length) {
function show(i) {
  vi = (i + slides.length) % slides.length;
  slides.forEach((s, k) => { s.classList.toggle('on', k === vi); s.setAttribute('aria-hidden', k !== vi); });
  vcur.textContent = '0' + (vi + 1);
}
$('.arw.prev').addEventListener('click', () => show(vi - 1));
$('.arw.next').addEventListener('click', () => show(vi + 1));
let sx = null; const vs = $('.v-slides');
vs.addEventListener('touchstart', e => { sx = e.touches[0].clientX; }, { passive: true });
vs.addEventListener('touchend', e => { if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(vi + (dx < 0 ? 1 : -1)); sx = null; });
}

/* ---------- availability request: drops from the top, straight edge ---------- */
const av = $('#avail'), form = $('.avail-form', av), done = $('.avail-done', av);
let lastFocus = null;
function openAvail() {
  lastFocus = document.activeElement; av.hidden = false;
  document.documentElement.style.overflow = 'hidden';
  requestAnimationFrame(() => requestAnimationFrame(() => av.classList.add('open')));
  setTimeout(() => $('select', av).focus({ preventScroll: true }), RM ? 0 : 800);
}
function closeAvail() {
  av.classList.remove('open');
  setTimeout(() => { av.hidden = true; document.documentElement.style.overflow = ''; lastFocus && lastFocus.focus({ preventScroll: true }); }, RM ? 0 : 800);
}
avBtn.addEventListener('click', openAvail);
$('.avail-x').addEventListener('click', closeAvail);
addEventListener('keydown', e => {
  if (av.hidden) return;
  if (e.key === 'Escape') closeAvail();
  if (e.key === 'Tab') { const f = $$('button, a, input, select, textarea', av).filter(x => x.offsetParent); const a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
form.addEventListener('submit', e => {
  e.preventDefault(); let first = null;
  $$('[required]', form).forEach(inp => {
    const ok = inp.type === 'checkbox' ? inp.checked : inp.type === 'email' ? /^\S+@\S+\.\S+$/.test(inp.value) : inp.value.trim() !== '';
    inp.closest('.f, .check').classList.toggle('bad', !ok); inp.setAttribute('aria-invalid', !ok);
    if (!ok && !first) first = inp;
  });
  if (first) { first.focus(); return; }
  form.hidden = true; done.hidden = false; done.setAttribute('tabindex', '-1'); done.focus();
});
form.addEventListener('input', e => { const w = e.target.closest('.bad'); if (w) w.classList.remove('bad'); });

/* ---------- menu, cookies, chat ---------- */
const mb = $('.menu-btn'), mn = $('#mnav');
mb.addEventListener('click', () => { const o = mb.getAttribute('aria-expanded') !== 'true'; mb.setAttribute('aria-expanded', o); mn.hidden = !o; top.classList.toggle('menu-open', o); });
$$('#mnav a').forEach(a => a.addEventListener('click', () => { mb.setAttribute('aria-expanded', false); mn.hidden = true; top.classList.remove('menu-open'); }));
$$('.cookies button').forEach(b => b.addEventListener('click', () => ck.classList.add('gone')));

/* ---------- contact form ---------- */
const cf = $('.c-form');
if (cf) cf.addEventListener('submit', e => {
  e.preventDefault(); let first = null;
  $$('[required]', cf).forEach(inp => {
    const ok = inp.type === 'email' ? /^\S+@\S+\.\S+$/.test(inp.value) : inp.value.trim() !== '';
    inp.closest('.f2').classList.toggle('bad', !ok); inp.setAttribute('aria-invalid', !ok); if (!ok && !first) first = inp;
  });
  if (first) { first.focus(); return; }
  $$('label, .btn', cf).forEach(x => x.hidden = true); const d = $('.c-done', cf); d.hidden = false; d.focus();
});
if (cf) cf.addEventListener('input', e => { const w = e.target.closest('.bad'); if (w) w.classList.remove('bad'); });

/* ---------- chat: instant answers from the site, then a person ----------
   On the live site this panel is replaced by Tawk.to (live agents). */
const chatBtn = $('.chat-btn'), chat = $('#chat'), log = $('.chat-log', chat), quick = $('.chat-quick', chat), cform = $('.chat-form', chat), cin = $('#chat-in');
const KB = [
  { k: /price|cost|how much|invest|\$|fee|pay/i, a: 'The Signature Reset (7 days) starts at $9,500, the Executive Pause (4 days) at $5,800 and the 90-Day Integration at $2,400. Room upgrades and a second guest are extra. <a href="programs.html">Compare programs</a>.' },
  { k: /date|when|availab|calendar|book|reserv/i, a: 'Programs start on fixed dates. You can see open dates and rooms and book online in four steps: <a href="book.html">Check dates</a>.' },
  { k: /call|talk|speak|discovery|phone/i, a: 'A 20-minute discovery call with Dr. Rojas or Dra. Ferrer is the best first step. <a href="contact.html#call">Choose a time</a>.' },
  { k: /room|suite|casita|treehouse|stay|sleep/i, a: 'We have 6 Ocean Suites, 4 Jungle Casitas and 2 Treehouse Rooms, for twelve guests at most. <a href="stay.html">See the stay</a>.' },
  { k: /where|location|get there|airport|fly|travel|transfer/i, a: 'We are in Playa Guiones, Nosara, Costa Rica. Fly into Liberia (LIR); we pick you up, about 2 hours by road. <a href="stay.html#getting-here">How to get here</a>.' },
  { k: /doctor|medical|physician|psycholog|founder|safe|health/i, a: 'Every program is led by Dr. Mateo Rojas (physician) and Dra. Lucía Ferrer (clinical psychologist). <a href="founders.html">Meet the founders</a>.' },
  { k: /team|company|corporate|group/i, a: 'We host private retreats for leadership teams of 6 to 12. <a href="programs.html#corporate">Corporate retreats</a>.' },
  { k: /method|how.*work|program|what.*do/i, a: 'Three movements: Arrive (medical and psychological baseline), Reset (sleep, movement, one-to-one work) and Return (a plan and 90 days of follow-up). <a href="method.html">The method</a>.' },
];
const QUICK = ['Prices', 'Available dates', 'Book a call', 'Rooms', 'Getting here'];
function say(html, who) { const p = document.createElement('p'); p.className = 'msg ' + who; p.innerHTML = html; log.appendChild(p); log.scrollTop = log.scrollHeight; }
function answer(q) {
  const hit = KB.find(x => x.k.test(q));
  setTimeout(() => say(hit ? hit.a : 'Thank you. The team answers live from 7am to 7pm Costa Rica time. For a quicker reply, write to us on <a href="https://wa.me/50600000000">WhatsApp +506 0000 0000</a> or at hello@nosarareset.com.', 'bot'), 450);
}
function openChat() {
  chat.hidden = false; chatBtn.setAttribute('aria-expanded', true); chatBtn.classList.add('on');
  if (!log.children.length) {
    say('Hello. I can answer the most common questions right away, and connect you with Lucía, Mateo or the team.', 'bot');
    QUICK.forEach(t => { const b = document.createElement('button'); b.type = 'button'; b.textContent = t; b.addEventListener('click', () => { say(t, 'me'); answer(t); }); quick.appendChild(b); });
  }
  requestAnimationFrame(() => chat.classList.add('open')); setTimeout(() => cin.focus({ preventScroll: true }), 300);
}
function closeChat() { chat.classList.remove('open'); chatBtn.setAttribute('aria-expanded', false); chatBtn.classList.remove('on'); setTimeout(() => chat.hidden = true, 300); chatBtn.focus(); }
chatBtn.addEventListener('click', () => chat.hidden ? openChat() : closeChat());
$('.chat-x', chat).addEventListener('click', closeChat);
chat.addEventListener('keydown', e => { if (e.key === 'Escape') closeChat(); });
cform.addEventListener('submit', e => { e.preventDefault(); const q = cin.value.trim(); if (!q) return; say(q.replace(/</g, '&lt;'), 'me'); cin.value = ''; answer(q); });

/* ---------- FAQ: one open at a time ---------- */
$$('.acc details').forEach(d => d.addEventListener('toggle', () => { if (d.open) $$('.acc details').forEach(o => { if (o !== d && o.parentNode === d.parentNode) o.open = false; }); }));

/* ---------- open the availability panel from links ---------- */
$$('a[href="#availability"]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); openAvail(); }));

resize(); tick();
})();
