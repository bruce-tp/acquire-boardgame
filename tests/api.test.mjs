import assert from 'node:assert/strict';
import {Miniflare} from 'miniflare';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
const workerEntry=process.env.ACQUIRE_API_WORKER;
const root=workerEntry?path.dirname(path.resolve(workerEntry)):path.resolve('dist/server');
const files=workerEntry?[path.basename(workerEntry)]:await readdir(root,{recursive:true});
const modules=files.filter(f=>/\.m?js$/.test(f)).sort((a,b)=>a==='index.js'?-1:b==='index.js'?1:0).map(f=>({type:'ESModule',path:path.resolve(root,f)}));
const mf=new Miniflare({modules,modulesRoot:root,compatibilityDate:'2026-05-15',compatibilityFlags:['nodejs_compat'],d1Databases:['DB']});
const db=await mf.getD1Database('DB');
if(workerEntry) assert.equal((await mf.dispatchFetch('http://acquire.test/api/health')).status,503);
await db.prepare(await readFile('drizzle/0000_nifty_bill_hollister.sql','utf8')).run();
if(workerEntry) {const r=await mf.dispatchFetch('http://acquire.test/api/health');assert.equal(r.status,200);assert.deepEqual(await r.json(),{ok:true,storage:'D1'});assert.equal((await mf.dispatchFetch('http://acquire.test/api/room',{method:'DELETE'})).status,405);}
const base='http://acquire.test';
const request=(url,init)=>mf.dispatchFetch(url,init);
async function post(body,token){const r=await request(base+'/api/room',{method:'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:JSON.stringify(body)});return {status:r.status,data:await r.json()};}
async function state(code,token){const r=await request(base+'/api/room?code='+code,{headers:token?{Authorization:'Bearer '+token}:{}});return {status:r.status,data:await r.json()};}
const host=await post({type:'create',name:'Integration host'});assert.equal(host.status,201,JSON.stringify(host.data));const code=host.data.state.code;
const guest=await post({type:'join',name:'Integration guest',code});assert.equal(guest.status,200);
const third=await post({type:'join',name:'Integration third',code});assert.equal(third.status,200);for(const response of [guest,third]){assert.ok(!('cash' in response.data.state.players[0]));assert.deepEqual(response.data.state.players[0].shares,[]);}
assert.equal((await state(code)).status,403);
let s=(await state(code,host.data.token)).data;
const forbidden=await post({type:'action',code,version:s.version,action:{type:'start'}},guest.data.token);assert.equal(forbidden.status,400);
const started=await post({type:'action',code,version:s.version,action:{type:'start'}},host.data.token);assert.equal(started.status,200);s=started.data.state;
for(const who of [host,guest,third]){const v=(await state(code,who.data.token)).data;assert.equal(v.players[v.me].hand.length,6);assert.equal(v.players.filter((_,i)=>i!==v.me).flatMap(p=>p.hand).length,0);assert.deepEqual(v.deck,[]);assert.ok(v.players.every(p=>p.id===undefined));assert.equal(v.phase,'place');for(let i=0;i<v.players.length;i++){const p=v.players[i];if(i===v.me){assert.equal(p.cash,6000);assert.equal(p.shares.length,7);}else{assert.ok(!('cash' in p));assert.deepEqual(p.shares,[]);}}}
assert.equal((await post({type:'join',name:'Late arrival',code})).status,409);
const credentials=[host.data.token,guest.data.token,third.data.token];
let active=(await state(code,credentials[s.turn])).data;
const t=active.players[active.me].hand[0];
const stale=await post({type:'action',code,version:active.version-1,action:{type:'place',tile:t}},credentials[s.turn]);assert.equal(stale.status,409);
const results=await Promise.all([1,2].map(()=>post({type:'action',code,version:active.version,action:{type:'place',tile:t}},credentials[s.turn])));
assert.equal(results.filter(r=>r.status===200).length,1);assert.equal(results.filter(r=>r.status===409).length,1);
const after=(await state(code,host.data.token)).data;assert.equal(after.players[s.turn].handCount,5);assert.ok(after.board[t]>=0);
const resumed=await post({type:'join',name:'Ignored new name',code},guest.data.token);assert.equal(resumed.status,200);assert.equal(resumed.data.state.players.length,3);
// A purchase and turn completion must be persisted in one versioned write.
const row=await db.prepare('SELECT state,version FROM rooms WHERE code=?').bind(code).first();
const seeded=JSON.parse(row.state);seeded.phase='buy';seeded.turn=0;seeded.bought=0;seeded.merger=null;
seeded.board=Array(108).fill(-1);seeded.board[0]=0;seeded.board[1]=0;
seeded.bank=Array(7).fill(25);seeded.players.forEach((p,i)=>{p.shares=Array(7).fill(0);p.cash=6000;p.hand=[90+i];});
seeded.deck=Array.from({length:108},(_,i)=>i).filter(i=>![0,1,90,91,92].includes(i));
await db.prepare('UPDATE rooms SET state=? WHERE code=?').bind(JSON.stringify(seeded),code).run();
const purchase={type:'action',code,version:row.version,action:{type:'buyAndFinish',quantities:[1,0,0,0,0,0,0]}};
const confirmations=await Promise.all([1,2].map(()=>post(purchase,host.data.token)));
assert.equal(confirmations.filter(r=>r.status===200).length,1);
assert.equal(confirmations.filter(r=>r.status===409).length,1);
const finished=(await state(code,host.data.token)).data;
assert.equal(finished.version,row.version+1);assert.equal(finished.turn,1);assert.equal(finished.phase,'place');
assert.equal(finished.players[0].cash,5800);assert.equal(finished.players[0].shares[0],1);assert.equal(finished.players[0].hand.length,6);
assert.equal((await post(purchase,host.data.token)).status,409);
assert.equal((await state(code,host.data.token)).data.players[0].cash,5800);
assert.equal(finished.purchaseAnnouncements.length,1);
const noticeId=finished.purchaseAnnouncements[0].id;
assert.equal(finished.purchaseAnnouncements[0].total,200);
assert.deepEqual(finished.purchaseAnnouncements[0].items,[{chain:0,quantity:1,unitPrice:200}]);
assert.ok(!('purchaseNotices' in finished));
const mainVersion=finished.version;
const observers=await Promise.all([1,2].map(()=>state(code,guest.data.token)));
for(const response of observers){
  assert.equal(response.data.version,mainVersion);
  assert.equal(response.data.purchaseAnnouncements[0].id,noticeId);
  assert.ok(response.data.purchaseAnnouncements[0].remainingMs>14_000);
  assert.equal(response.data.players[0].cash,undefined);assert.deepEqual(response.data.players[0].shares,[]);
}
assert.equal((await db.prepare('SELECT version FROM rooms WHERE code=?').bind(code).first()).version,mainVersion);
// Expire only one viewer's delivery window: refresh cannot replay it for that viewer.
const receiptKey=`!purchase-receipts:${code}:0`;
await db.prepare('UPDATE rooms SET state=? WHERE code=?').bind(JSON.stringify({[noticeId]:Date.now()-16_000}),receiptKey).run();
assert.deepEqual((await state(code,host.data.token)).data.purchaseAnnouncements,[]);
assert.equal((await state(code,guest.data.token)).data.purchaseAnnouncements[0].id,noticeId);
// Two fast subsequent turns must survive until the first viewer's next poll.
async function skipPurchase(playerToken){
  let current=(await state(code,playerToken)).data;
  let response=await post({type:'action',code,version:current.version,action:{type:'place',tile:current.players[current.me].hand[0]}},playerToken);
  assert.equal(response.status,200);current=response.data.state;
  if(current.phase==='found'){
    const chain=Array.from({length:7},(_,i)=>i).find(c=>!current.board.includes(c));
    response=await post({type:'action',code,version:current.version,action:{type:'found',chain}},playerToken);
    assert.equal(response.status,200);current=response.data.state;
  }
  assert.equal(current.phase,'buy');
  response=await post({type:'action',code,version:current.version,action:{type:'finish'}},playerToken);
  assert.equal(response.status,200);return response.data.state;
}
await skipPurchase(guest.data.token);await skipPurchase(third.data.token);
const caughtUp=(await state(code,host.data.token)).data;
assert.deepEqual(caughtUp.purchaseAnnouncements.map(n=>n.playerName),['Integration guest','Integration third']);
assert.ok(caughtUp.purchaseAnnouncements.every(n=>n.total===0&&n.items.length===0&&n.remainingMs>14_000));
assert.ok(caughtUp.log.every(line=>!line.includes('bought 1')&&!line.includes('@ $')));
const lagRow=await db.prepare('SELECT state,version FROM rooms WHERE code=?').bind(code).first();
const lagState=JSON.parse(lagRow.state);
lagState.purchaseNotices.push({id:'delayed-poll',playerName:'Delayed purchase',items:[{chain:0,quantity:1,unitPrice:200}],total:200,createdAt:Date.now()-45_000});
lagState.purchaseNotices.push({id:'expired-buffer',playerName:'Expired purchase',items:[{chain:0,quantity:1,unitPrice:200}],total:200,createdAt:Date.now()-360_000});
await db.prepare('UPDATE rooms SET state=? WHERE code=?').bind(JSON.stringify(lagState),code).run();
const delayed=(await state(code,guest.data.token)).data;
assert.ok(delayed.purchaseAnnouncements.some(n=>n.id==='delayed-poll'&&n.remainingMs>14_000));
assert.ok(!delayed.purchaseAnnouncements.some(n=>n.id==='expired-buffer'));
assert.ok(!JSON.stringify(delayed).includes('Expired purchase'));
assert.equal(delayed.version,lagRow.version);
// Room settings are validated at creation, persisted, and shared without allowing joiners to overwrite them.
assert.deepEqual(host.data.state.settings,{edition:'classic',bonusMode:'standard',majorityMultiplier:10});
for(const multiplier of [5,7,10]){
 const settings={edition:'classic',bonusMode:'custom',majorityMultiplier:multiplier};
 const custom=await post({type:'create',name:'Custom host',settings});assert.equal(custom.status,201);
 const cc=custom.data.state.code;assert.deepEqual(custom.data.state.settings,settings);
 const joined=await post({type:'join',name:'Custom guest',code:cc,settings:{...settings,majorityMultiplier:99}});
 assert.equal(joined.status,200);assert.deepEqual(joined.data.state.settings,settings);
 const loaded=(await state(cc,custom.data.token)).data;assert.deepEqual(loaded.settings,settings);
 const began=await post({type:'action',code:cc,version:loaded.version,action:{type:'start',settings:{...settings,majorityMultiplier:99}}},custom.data.token);
 assert.equal(began.status,200);assert.deepEqual(began.data.state.settings,settings);
 assert.deepEqual((await state(cc,joined.data.token)).data.settings,settings);
}
for(const settings of [null,{edition:'tycoon',bonusMode:'standard',majorityMultiplier:10},{edition:'classic',bonusMode:'standard',majorityMultiplier:5},{edition:'classic',bonusMode:'custom',majorityMultiplier:99}])assert.equal((await post({type:'create',name:'Invalid settings',settings})).status,400);
// A stored pre-feature room is still readable and advertises Standard.
const old=JSON.parse((await db.prepare('SELECT state FROM rooms WHERE code=?').bind(code).first()).state);delete old.settings;
await db.prepare('UPDATE rooms SET state=? WHERE code=?').bind(JSON.stringify(old),code).run();
assert.deepEqual((await state(code,host.data.token)).data.settings,{edition:'classic',bonusMode:'standard',majorityMultiplier:10});
await mf.dispose();
console.log('PASS: 3-player persistence, private cash and shares in GET/POST, private hands, hidden deck, host permissions, late-join lock, stale-action rejection, concurrent-action CAS, and rejoin.');
