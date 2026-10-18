import { calculate, quoteText, SCOPES, money, todayKorea } from './estimate.js';
const $ = selector => document.querySelector(selector);
const form = $('#estimate-form');
let result;
let toastTimer;
function read() {
  const f = new FormData(form);
  return { vehicle: f.get('vehicle'), tint: f.has('tint'), polish: f.has('polish'), coating: f.has('coating'), scope: f.get('scope'), film: f.get('film'), removal: f.has('removal'), sunroof: f.get('sunroof'), polishPackage: f.get('polishPackage'), coatingPackage: f.get('coatingPackage'), specialPaint: f.has('specialPaint'), date: f.get('date') };
}
function make(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function update() {
  const c = read();
  const invalidDate = !!c.date && c.date < todayKorea();
  $('#date').min = todayKorea();
  $('#date').setCustomValidity(invalidDate ? '지난 날짜는 선택할 수 없습니다.' : '');
  $('#date-error').hidden = !invalidDate;
  if (invalidDate) c.date = '';
  result = calculate(c);
  for (const key of ['tint', 'polish', 'coating']) {
    $(`#${key}-panel`).hidden = !c[key];
    $(`#${key}-panel`).disabled = !c[key];
  }
  // Retain hidden choices but keep every value available for the next calculation.
  $('#removal-cost').textContent = `+${money(SCOPES[c.scope].removal)} · ${SCOPES[c.scope].name} 기준`;
  $('#polish-description').textContent = c.polishPackage === 'detail' ? '도장면 상태에 따른 다단계 광택 작업' : '도장면의 가벼운 표면 정리와 광택 관리';
  $('#coating-description').textContent = c.coatingPackage === 'plus' ? '상위 외장 도장면 코팅 패키지' : '기본 외장 도장면 코팅';
  $('#quote-vehicle').textContent = result.vehicle;
  const lines = $('#quote-lines'); lines.replaceChildren();
  if (result.empty) lines.append(make('p', 'empty-message', '서비스를 1개 이상 선택해주세요.'));
  for (const s of result.services) {
    const section = make('section', 'quote-service');
    const heading = make('h4'); heading.append(make('span', '', s.title), make('span', '', s.total === null ? '별도 상담' : money(s.total)));
    section.append(heading, make('p', 'quote-package', s.package));
    if (s.total === null) section.append(make('p', 'consult-line', '차량 상태 확인 후 견적 안내'));
    for (const r of s.rows) { const row = make('div', 'quote-row'); row.append(make('span', '', r.label), make('span', '', money(r.amount))); section.append(row); }
    lines.append(section);
  }
  const discount = $('#quote-discount'); discount.replaceChildren();
  if (result.bundle) { const row = make('div', 'discount-row'); row.append(make('span', '', '광택·코팅 동시 시공 할인'), make('span', '', result.needsConsult ? '확인 후 안내' : '−30,000원')); discount.append(row); }
  const totalText = result.empty ? '서비스를 선택해주세요' : result.total === null ? '차량 확인 후 견적 안내' : money(result.total);
  for (const id of ['#quote-total','#mobile-amount']) { $(id).textContent = totalText; $(id).classList.toggle('consult-total', result.total === null); }
  $('#quote-date').textContent = `희망 입고일: ${invalidDate ? '올바른 날짜를 선택해주세요' : c.date || '미정 · 상담 후 조율'}`;
  $('#quote-notes').replaceChildren(...result.reasons.map(text => make('p', '', text)));
  $('#consult').disabled = result.empty || invalidDate;
  $('#copy').disabled = result.empty || invalidDate;
}
// Disabled fieldsets are excluded from FormData; read their controls directly.
function optionsFromControls() {
  for (const key of ['tint', 'polish', 'coating']) $(`#${key}-panel`).disabled = false;
  update();
}
form.addEventListener('input', optionsFromControls);
form.addEventListener('change', optionsFromControls);
form.addEventListener('submit', event => { event.preventDefault(); optionsFromControls(); if (!form.reportValidity()) return; $('#quote-result').scrollIntoView({ behavior: 'smooth', block: 'start' }); $('#quote-result').focus({ preventScroll: true }); });
$('#reset').addEventListener('click', () => { form.reset(); optionsFromControls(); showToast('견적 조건을 초기화했습니다.'); });
function showToast(text) { clearTimeout(toastTimer); $('#toast').textContent = text; $('#toast').classList.add('visible'); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3200); }
function openDemo() {
  optionsFromControls();
  if (!form.reportValidity()) { $('#estimate').scrollIntoView({ behavior: 'smooth' }); return; }
  if (result.empty) { $('#estimate').scrollIntoView({ behavior: 'smooth' }); showToast('서비스를 1개 이상 선택해주세요.'); return; }
  $('#demo-quote').textContent = quoteText(result);
  $('#demo-dialog').showModal();
}
$('#consult').addEventListener('click', openDemo);
$('#contact-demo').addEventListener('click', openDemo);
document.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => $('#demo-dialog').close()));
document.querySelectorAll('[data-copy-close]').forEach(button => button.addEventListener('click', () => $('#copy-dialog').close()));
for (const dialog of document.querySelectorAll('dialog')) dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
$('#copy').addEventListener('click', async () => {
  optionsFromControls();
  if (result.empty || !form.reportValidity()) return;
  const text = quoteText(result);
  try { await navigator.clipboard.writeText(text); showToast('견적 내용이 복사되었습니다.'); }
  catch { $('#manual-copy').value = text; $('#copy-dialog').showModal(); $('#manual-copy').focus(); $('#manual-copy').select(); }
});
document.querySelectorAll('[data-choose]').forEach(link => link.addEventListener('click', () => { $(`#${link.dataset.choose}`).checked = true; optionsFromControls(); }));
const menu = $('.menu-toggle');
menu.addEventListener('click', () => { const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); menu.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기'); $('#mobile-menu').hidden = !open; });
$('#mobile-menu').querySelectorAll('a').forEach(link => link.addEventListener('click', () => { $('#mobile-menu').hidden = true; menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','메뉴 열기'); }));
document.addEventListener('keydown', event => { if (event.key === 'Escape') { $('#mobile-menu').hidden = true; menu.setAttribute('aria-expanded','false'); menu.setAttribute('aria-label','메뉴 열기'); } });
document.addEventListener('visibilitychange', () => { if (!document.hidden) optionsFromControls(); });
optionsFromControls();
