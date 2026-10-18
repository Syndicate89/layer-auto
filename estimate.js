export const VEHICLES = {
  small: { name: '경차·소형', tint: 0, polish: 0, coating: 0 },
  sedan: { name: '준중형·중형 세단', tint: 30000, polish: 40000, coating: 30000 },
  large: { name: '대형 세단·소형 SUV', tint: 60000, polish: 70000, coating: 50000 },
  suv: { name: '중형·대형 SUV', tint: 90000, polish: 100000, coating: 70000 },
  special: { name: '승합차·특수차량' }
};
export const SCOPES = {
  front: { name: '전면 유리', base: 150000, removal: 30000 },
  sides: { name: '측·후면 유리', base: 220000, removal: 50000 },
  full: { name: '전체 유리', base: 340000, removal: 70000 }
};
export const FILMS = {
  standard: { name: 'LAYER Standard', multiplier: 10 },
  comfort: { name: 'LAYER Comfort', multiplier: 13 },
  signature: { name: 'LAYER Signature', multiplier: 16 }
};
export const POLISH = { refresh: { name: '리프레시 광택', base: 180000 }, detail: { name: '디테일 광택', base: 320000 } };
export const COATING = { shield: { name: 'LAYER Shield', base: 200000 }, plus: { name: 'LAYER Shield Plus', base: 320000 } };
export const SUNROOFS = { none: { name: '없음', price: 0 }, normal: { name: '일반 선루프', price: 60000 }, panorama: { name: '파노라마 선루프', price: 100000 } };
export const money = value => `${value.toLocaleString('ko-KR')}원`;
export const DEFAULTS = { vehicle: 'sedan', tint: true, polish: false, coating: false, scope: 'full', film: 'comfort', removal: false, sunroof: 'none', polishPackage: 'refresh', coatingPackage: 'shield', specialPaint: false, date: '' };
export function todayKorea() { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()); }
export function calculate(input) {
  const c = { ...DEFAULTS, ...input };
  const vehicle = VEHICLES[c.vehicle];
  if (!vehicle || !SCOPES[c.scope] || !FILMS[c.film] || !POLISH[c.polishPackage] || !COATING[c.coatingPackage] || !SUNROOFS[c.sunroof]) throw new Error('잘못된 견적 조건입니다.');
  const services = [];
  const reasons = [];
  const specialVehicle = c.vehicle === 'special';
  if (specialVehicle) reasons.push('승합차·특수차량은 모델과 크기를 확인한 후 견적을 안내합니다.');
  if (c.tint) {
    const scope = SCOPES[c.scope], film = FILMS[c.film], sunroof = SUNROOFS[c.sunroof];
    const rows = [{ label: `${scope.name} · ${money(scope.base)} × ${film.multiplier / 10}`, amount: scope.base * film.multiplier / 10 }, { label: '차량 등급 추가비', amount: vehicle.tint }];
    if (c.removal) rows.push({ label: `기존 필름 제거 · ${scope.name}`, amount: scope.removal });
    if (c.sunroof !== 'none') rows.push({ label: sunroof.name, amount: sunroof.price });
    services.push({ key: 'tint', title: '썬팅', package: `${scope.name} / ${film.name}`, rows: specialVehicle ? [] : rows, total: specialVehicle ? null : rows.reduce((sum, row) => sum + row.amount, 0) });
  }
  if (c.polish) {
    const p = POLISH[c.polishPackage];
    const consult = specialVehicle || c.specialPaint;
    if (c.specialPaint) reasons.push('광택: 깊은 흠집·도장 손상·재도장 부위·랩핑·무광 여부를 확인한 후 별도 견적을 안내합니다.');
    const rows = [{ label: p.name, amount: p.base }, { label: '차량 등급 추가비', amount: vehicle.polish }];
    services.push({ key: 'polish', title: '광택', package: p.name, rows: consult ? [] : rows, total: consult ? null : p.base + vehicle.polish });
  }
  if (c.coating) {
    const p = COATING[c.coatingPackage];
    const rows = [{ label: p.name, amount: p.base }, { label: '차량 등급 추가비', amount: vehicle.coating }];
    services.push({ key: 'coating', title: '유리막코팅', package: p.name, rows: specialVehicle ? [] : rows, total: specialVehicle ? null : p.base + vehicle.coating });
  }
  const needsConsult = services.some(s => s.total === null);
  const bundle = c.polish && c.coating;
  const discount = bundle && !needsConsult ? 30000 : 0;
  const total = !services.length || needsConsult ? null : services.reduce((sum, s) => sum + s.total, 0) - discount;
  return { vehicle: vehicle.name, services, reasons, discount, bundle, needsConsult, total, date: c.date, empty: services.length === 0 };
}
export function quoteText(result) {
  const lines = ['레이어오토 · 내 차 예상 시공비', `차량 등급: ${result.vehicle}`];
  for (const s of result.services) {
    lines.push('', `${s.title} — ${s.package}`);
    if (s.total === null) lines.push('상태 확인 후 별도 견적');
    else { for (const r of s.rows) lines.push(`${r.label}: ${money(r.amount)}`); lines.push(`${s.title} 소계: ${money(s.total)}`); }
  }
  if (result.discount) lines.push('', `광택·코팅 동시 시공 할인: −${money(result.discount)}`);
  if (result.bundle && result.needsConsult) lines.push('광택·코팅 할인: 시공 범위 확인 후 안내');
  lines.push('', `예상 합계: ${result.empty ? '서비스를 선택해주세요' : result.total === null ? '차량 확인 후 견적 안내' : money(result.total)}`, '모든 금액 부가세 포함 · 희망일·요일 할증 없음', `희망 입고일: ${result.date || '미정 · 상담 후 조율'}`);
  if (result.reasons.length) lines.push('', ...result.reasons);
  lines.push('', '선택하신 조건을 기준으로 계산한 예상 금액입니다. 실제 차량 모델, 유리 구성, 도장면 및 기존 필름 상태를 확인한 후 최종 견적을 안내합니다. 희망일 선택만으로 예약이 확정되지 않습니다.', '가상 업체 포트폴리오 · 실제 상담·예약 및 결제 불가');
  return lines.join('\n');
}
