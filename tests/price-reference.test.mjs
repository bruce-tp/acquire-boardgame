import test from 'node:test';
import assert from 'node:assert/strict';
import {PRICE_REFERENCE_ROWS,HOTEL_PRICE_GROUPS,priceFor} from '../lib/game/engine.ts';
// Transcribed from the printed Classic stockholder card, independently of priceFor.
const printed=[
 [200,['2','—','—'],2000,1000],
 [300,['3','2','—'],3000,1500],
 [400,['4','3','2'],4000,2000],
 [500,['5','4','3'],5000,2500],
 [600,['6–10','5','4'],6000,3000],
 [700,['11–20','6–10','5'],7000,3500],
 [800,['21–30','11–20','6–10'],8000,4000],
 [900,['31–40','21–30','11–20'],9000,4500],
 [1000,['41+','31–40','21–30'],10000,5000],
 [1100,['—','41+','31–40'],11000,5500],
 [1200,['—','—','41+'],12000,6000],
];
test('digital reference matches every row of the official Classic card',()=>{
 assert.deepEqual(PRICE_REFERENCE_ROWS.map(r=>[r.price,r.sizes,r.majority,r.minority]),printed);
});
test('every possible active chain size maps to its printed card row',()=>{
 for(let t=0;t<HOTEL_PRICE_GROUPS.length;t++)for(const id of HOTEL_PRICE_GROUPS[t])for(let n=2;n<=108;n++){
  const row=PRICE_REFERENCE_ROWS.find(r=>r.price===priceFor(id,n));assert.ok(row);
  const band=row.sizes[t];assert.notEqual(band,'—');
  if(band.endsWith('+'))assert.ok(n>=Number(band.slice(0,-1)));
  else if(band.includes('–')){const [lo,hi]=band.split('–').map(Number);assert.ok(n>=lo&&n<=hi);}
  else assert.equal(n,Number(band));
 }
});
