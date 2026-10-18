import test from 'node:test';
import assert from 'node:assert/strict';
import { calculate, quoteText } from '../estimate.js';
const base = { vehicle: 'small', tint: false, polish: false, coating: false };
test('예시 A: 중형 세단 전체 Comfort + 제거 = 542,000원', () => {
  const r=calculate({...base, vehicle:'sedan', tint:true, scope:'full', film:'comfort', removal:true, sunroof:'none'});
  assert.equal(r.total,542000);
  assert.deepEqual(r.services[0].rows.map(r=>r.amount),[442000,30000,70000]);
});
test('예시 B: SUV 디테일 광택 + Shield = 660,000원', () => {
  const r=calculate({...base, vehicle:'suv', polish:true, coating:true, polishPackage:'detail', coatingPackage:'shield'});
  assert.equal(r.services[0].total,420000);assert.equal(r.services[1].total,270000);assert.equal(r.discount,30000);assert.equal(r.total,660000);
});
test('예시 C: 경차 전면 Standard = 150,000원', () => assert.equal(calculate({...base,tint:true,scope:'front',film:'standard'}).total,150000));
for(const [scope,price,removal] of [['front',150000,30000],['sides',220000,50000],['full',340000,70000]]) {
  for(const [film,factor] of [['standard',1],['comfort',1.3],['signature',1.6]]) {
    test(`${scope}/${film}: 등급 배수는 기본 시공비에만 적용`,()=>{
      const r=calculate({...base,vehicle:'sedan',tint:true,scope,film,removal:true,sunroof:'panorama'});
      assert.equal(r.total,Math.round(price*factor)+30000+removal+100000);
    });
  }
}
for(const [vehicle,additional] of [['small',0],['sedan',100000],['large',180000],['suv',260000]]) {
  test(`${vehicle}: 선택 서비스마다 차량 추가비 적용`,()=>{
    const r=calculate({...base,vehicle,tint:true,scope:'front',film:'standard',polish:true,coating:true});
    assert.equal(r.total,150000+180000+200000+additional-30000);
  });
}
test('썬팅+코팅은 할인 없음',()=>{const r=calculate({...base,tint:true,scope:'front',film:'standard',coating:true});assert.equal(r.discount,0);assert.equal(r.total,350000);});
test('썬팅+광택은 할인 없음',()=>{const r=calculate({...base,tint:true,scope:'front',film:'standard',polish:true});assert.equal(r.discount,0);assert.equal(r.total,330000);});
test('선루프 없음/일반/파노라마는 하나만 적용',()=>{
  const vals=['none','normal','panorama'].map(sunroof=>calculate({...base,tint:true,scope:'front',film:'standard',sunroof}).total);
  assert.deepEqual(vals,[150000,210000,250000]);
});
test('서비스 미선택 시 0원이 아닌 선택 안내',()=>{const r=calculate(base);assert.equal(r.total,null);assert.equal(r.empty,true);assert.match(quoteText(r),/서비스를 선택해주세요/);});
test('승합·특수차량: 숫자 합계 및 각 서비스 금액 제외',()=>{
  const r=calculate({...base,vehicle:'special',tint:true,polish:true,coating:true});
  assert.equal(r.total,null);assert.equal(r.needsConsult,true);assert.equal(r.discount,0);
  assert.ok(r.services.every(s=>s.total===null&&s.rows.length===0));
  assert.match(quoteText(r),/차량 확인 후 견적 안내/);assert.doesNotMatch(quoteText(r),/0원/);
});
test('특수 도장 조건은 광택 자동 견적에서 제외',()=>{
  const r=calculate({...base,polish:true,coating:true,specialPaint:true});
  assert.equal(r.total,null);assert.equal(r.services[0].total,null);assert.equal(r.services[1].total,200000);assert.equal(r.discount,0);assert.equal(r.reasons.length,1);
});
test('광택 미선택 시 특수 도장 옵션 영향 없음',()=>assert.equal(calculate({...base,coating:true,specialPaint:true}).total,200000));
test('선택하지 않은 썬팅 옵션은 합계에 영향 없음',()=>assert.equal(calculate({...base,coating:true,removal:true,sunroof:'panorama',film:'signature'}).total,200000));
test('상위 패키지 조합',()=>assert.equal(calculate({...base,polish:true,coating:true,polishPackage:'detail',coatingPackage:'plus'}).total,610000));
test('희망일에 따른 할증 없음',()=>{
  const a=calculate({...base,coating:true,date:'2026-11-01'}),b=calculate({...base,coating:true,date:'2026-11-02'});assert.equal(a.total,b.total);assert.match(quoteText(a),/2026-11-01/);
});
test('복사 내용에 조건·세부 금액·할인·날짜·안내 포함',()=>{
  const r=calculate({...base,vehicle:'suv',polish:true,coating:true,polishPackage:'detail',date:'2026-12-10'});
  const text=quoteText(r);for(const term of ['중형·대형 SUV','디테일 광택','LAYER Shield','100,000원','−30,000원','660,000원','2026-12-10','예약이 확정되지 않습니다'])assert.ok(text.includes(term));
});
