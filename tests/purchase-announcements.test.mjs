import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,makePlayer,applyAction,publicState} from '../lib/game/engine.ts';
import {createPurchaseNoticeQueue,acceptRoomView} from '../lib/purchase-notice-queue.ts';
import {PURCHASE_DISPLAY_MS} from '../lib/game/purchase-announcements.ts';

function buyingGame(){
  const g=createGame('NEWS','a','Alice');g.players.push(makePlayer('b','Bob'),makePlayer('c','Carol'));
  g.phase='buy';g.board[0]=0;g.board[1]=0;g.board[12]=1;g.board[13]=1;g.board[14]=1;
  g.deck=Array.from({length:108},(_,i)=>i).filter(i=>![0,1,12,13,14].includes(i));
  return g;
}
test('one purchase announcement contains every hotel, quantities, prices and total',()=>{
  const g=buyingGame();applyAction(g,0,{type:'buyAndFinish',quantities:[2,1,0,0,0,0,0]});
  const v=publicState(g,1);assert.equal(v.purchaseAnnouncements.length,1);
  const notice=v.purchaseAnnouncements[0];
  assert.equal(notice.playerName,'Alice');assert.equal(notice.total,1200);
  assert.deepEqual(notice.items,[{chain:0,quantity:2,unitPrice:400},{chain:1,quantity:1,unitPrice:400}]);
  assert.equal(g.turn,1);assert.equal(v.players[0].cash,undefined);assert.deepEqual(v.players[0].shares,[]);
  assert.ok(!('purchaseNotices' in v));
  assert.ok(!v.log.some(line=>/bought \d|@ \$|700/.test(line)));
  assert.ok(!v.announcement.includes('700'));
});
test('zero-share completion is announced and later turns cannot overwrite previous notices',()=>{
  const g=buyingGame();applyAction(g,0,{type:'buyAndFinish',quantities:[1,0,0,0,0,0,0]});
  g.phase='buy';applyAction(g,1,{type:'finish'});
  g.phase='buy';applyAction(g,2,{type:'finish'});
  const notices=publicState(g,0).purchaseAnnouncements;
  assert.deepEqual(notices.map(n=>n.playerName),['Alice','Bob','Carol']);
  assert.deepEqual(notices.map(n=>n.total),[400,0,0]);assert.deepEqual(notices[1].items,[]);
});
test('invalid purchases produce no announcement or state mutation',()=>{
  const g=buyingGame();g.players[0].cash=100;
  const snapshot=JSON.stringify(g);
  assert.throws(()=>applyAction(g,0,{type:'buyAndFinish',quantities:[1,0,0,0,0,0,0]}));
  assert.equal(JSON.stringify(g),snapshot);assert.equal(g.purchaseNotices,undefined);
});
test('expired details are absent from default public state, including after final settlement',()=>{
  const g=buyingGame();applyAction(g,0,{type:'buyAndFinish',quantities:[1,0,0,0,0,0,0]});
  g.purchaseNotices[0].createdAt-=PURCHASE_DISPLAY_MS+1;
  assert.deepEqual(publicState(g,1).purchaseAnnouncements,[]);
  g.phase='end';const v=publicState(g,1);
  assert.deepEqual(v.purchaseAnnouncements,[]);assert.ok(!('purchaseNotices' in v));
  assert.ok(!v.log.some(line=>/bought \d|@ \$/.test(line)));
});

const incoming=(id,remainingMs=15_000)=>({id,playerName:id,items:[],total:0,createdAt:0,remainingMs});
test('delivery retry is accepted at the same game version; expired notices are removed',()=>{
  const first={code:'NEWS',version:4,purchaseAnnouncements:[],phase:'place'};
  const delivered=acceptRoomView(first,{...first,purchaseAnnouncements:[incoming('A')]});
  assert.equal(delivered.version,4);assert.equal(delivered.phase,'place');assert.equal(delivered.purchaseAnnouncements[0].id,'A');
  assert.strictEqual(acceptRoomView(delivered,{...delivered,purchaseAnnouncements:[incoming('A',1000)]}),delivered);
  assert.deepEqual(acceptRoomView(delivered,first).purchaseAnnouncements,[]);
  assert.strictEqual(acceptRoomView(delivered,{...first,version:3}),delivered);
});
test('consecutive notices overlap, expire individually, and polling never extends them',t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});
  let visible=[];const queue=createPurchaseNoticeQueue(v=>visible=v);t.after(queue.stop);
  queue.receive([incoming('A')]);t.mock.timers.tick(2000);
  queue.receive([incoming('A'),incoming('B')]);assert.deepEqual(visible.map(n=>n.id),['A','B']);
  t.mock.timers.tick(12_999);assert.equal(visible.length,2);
  t.mock.timers.tick(1);assert.deepEqual(visible.map(n=>n.id),['B']);
  queue.receive([incoming('A'),incoming('B')]);assert.deepEqual(visible.map(n=>n.id),['B']);
  t.mock.timers.tick(2000);assert.deepEqual(visible,[]);
});
test('a reloaded viewer gets only the remaining time, and an unmounted queue stops',t=>{
  t.mock.timers.enable({apis:['setTimeout','Date'],now:1000});
  let visible=[];const queue=createPurchaseNoticeQueue(v=>visible=v);t.after(queue.stop);
  queue.receive([incoming('A',3000)]);t.mock.timers.tick(2999);assert.equal(visible.length,1);
  t.mock.timers.tick(1);assert.deepEqual(visible,[]);
  queue.receive([incoming('B')]);queue.stop();t.mock.timers.tick(30_000);
  assert.deepEqual(visible.map(n=>n.id),['B']);
});
