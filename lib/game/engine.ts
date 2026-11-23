import {parseSettings,gameSettings,bonusAmounts,type GameSettings} from './settings.ts';
import {recentPurchases, PURCHASE_DISPLAY_MS, type PurchaseAnnouncement, type DeliveredPurchaseAnnouncement} from './purchase-announcements.ts';
// Acquire: Classic rules, Renegade 2023. Original interface and illustration.
export const HOTELS = [
  {id:0,name:'Mandarin Oriental',zh:'香港文華東方',short:'文華',colour:'#edb94b',tier:2,mark:'MO',original:'Tower',logo:'/hotels/mandarin.svg',region:'香港 · HK'},
  {id:1,name:'The Peninsula',zh:'香港半島酒店',short:'半島',colour:'#ec786d',tier:1,mark:'P',original:'Luxor',logo:'/hotels/peninsula.svg',region:'香港 · HK'},
  {id:2,name:'The Okura',zh:'ホテルオークラ',short:'オークラ',colour:'#65a9e5',tier:1,mark:'O',original:'American',logo:'/hotels/okura.svg',region:'日本 · JP'},
  {id:3,name:'Rosewood',zh:'香港瑰麗酒店',short:'瑰麗',colour:'#a991d4',tier:2,mark:'R',original:'Worldwide',logo:'/hotels/rosewood.svg',region:'香港 · HK'},
  {id:4,name:'APA Hotel',zh:'アパホテル',short:'APA',colour:'#83bd85',tier:0,mark:'APA',original:'Festival',logo:'/hotels/apa.png',region:'日本 · JP'},
  {id:5,name:'Imperial Hotel',zh:'帝国ホテル',short:'帝国',colour:'#e0a077',tier:1,mark:'IH',original:'Imperial',logo:'/hotels/imperial.svg',region:'日本 · JP'},
  {id:6,name:'Sheraton Hong Kong',zh:'香港喜來登酒店',short:'喜來登',colour:'#64c3bb',tier:0,mark:'SH',original:'Continental',logo:'/hotels/sheraton.png',region:'香港 · HK'},
];
export type Player = {id:string;name:string;cash:number;shares:number[];hand:number[]};
export type Merger = {tile:number;survivor:number;chains:number[];sizes:number[];remaining:number[];loser:number;order:number[];cursor:number;revealed?:number[]};
export type FinalScore = {
  cashBeforeSettlement: number;
  hotels: {id:number; shares:number; sharePrice:number; sale:number; bonus:number}[];
};
export type Game = {finalScores?:FinalScore[];settings?:GameSettings;purchaseNotices?:PurchaseAnnouncement[];code:string;version:number;players:Player[];board:number[];deck:number[];discard:number[];turn:number;round:number;phase:string;bank:number[];bought:number;log:string[];pending:number[];merger:Merger|null;endDeclared:boolean;stalls:number;lastTileEvent?:'found'|'merge'|null;lastTile:number|null};
export type Action = {type:string;tile?:number;chain?:number;quantities?:number[];sell?:number;trade?:number;name?:string};
export function label(t:number) {return `${t%12+1}${String.fromCharCode(65+Math.floor(t/12))}`;}
export function size(g:Game,c:number) {return g.board.filter(x=>x===c).length;}
export function priceFor(c:number,n:number) {if(n<2)return 0; const base=n<=5?n:n<=10?6:n<=20?7:n<=30?8:n<=40?9:10;return (base+HOTELS[c].tier)*100;}
export function price(g:Game,c:number) {return priceFor(c,size(g,c));}
export function shuffle<T>(a:T[]) {for(let i=a.length-1;i>0;i--){const r=new Uint32Array(1);crypto.getRandomValues(r);const j=r[0]%(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makePlayer(id:string,name:string):Player {return {id,name,cash:6000,shares:Array(7).fill(0),hand:[]};}
export function createGame(code:string,id:string,name:string,settings?:GameSettings):Game {return {settings:parseSettings(settings),code,version:0,players:[makePlayer(id,name)],board:Array(108).fill(-1),deck:[],discard:[],turn:0,round:1,phase:'lobby',bank:Array(7).fill(25),bought:0,log:['Welcome to the Hotel Exchange · 歡迎來到酒店交易所'],pending:[],merger:null,endDeclared:false,stalls:0,lastTile:null};}
function note(g:Game,text:string){g.log.push(text);if(g.log.length>120)g.log.shift();}
export function neighbours(t:number) {const a=[];if(t%12>0)a.push(t-1);if(t%12<11)a.push(t+1);if(t>=12)a.push(t-12);if(t<96)a.push(t+12);return a;}
function independentGroup(g:Game,t:number){const seen=new Set<number>([t]);const queue=[t];while(queue.length){for(const n of neighbours(queue.pop()!))if(g.board[n]===7&&!seen.has(n)){seen.add(n);queue.push(n);}}return [...seen];}
export function placement(g:Game,t:number) {const group=independentGroup(g,t);const chains=[...new Set(group.flatMap(x=>neighbours(x)).map(x=>g.board[x]).filter(x=>x>=0&&x<7))];if(chains.filter(c=>size(g,c)>=11).length>1)return {legal:false,reason:'Safe chains cannot merge · 安全酒店不能合併',group,chains};if(!chains.length&&group.length>1&&HOTELS.every(h=>size(g,h.id)>0))return {legal:false,reason:'All seven chains are active · 七間酒店均已成立',group,chains};return {legal:true,reason:'',group,chains};}
export function startGame(g:Game){if(g.players.length<2||g.players.length>6)throw Error('Need 2–6 players · 需要 2–6 位玩家');g.deck=shuffle(Array.from({length:108},(_,i)=>i));let first=Infinity;for(let i=0;i<g.players.length;i++){const t=g.deck.pop()!;g.board[t]=7;note(g,`${g.players[i].name}: opening tile ${label(t)} · 起始地塊`);if(t<first){first=t;g.turn=i;}}for(const p of g.players)p.hand=g.deck.splice(-6);g.phase='place';note(g,`${g.players[g.turn].name} starts · 首先行動`);}
export function canEnd(g:Game){const sizes=HOTELS.map(h=>size(g,h.id)).filter(Boolean);return sizes.length>0&&(sizes.some(n=>n>=41)||sizes.every(n=>n>=11));}
function bonus(g:Game,c:number,n:number,bankOpponent:boolean){
  const before=g.players.map(player=>player.cash);
  payShareholderBonuses(g,c,n,bankOpponent);
  const payouts=g.players.flatMap((player,index)=>{
    const amount=player.cash-before[index];
    return amount>0?[{playerName:player.name,amount}]:[];
  });
  if(payouts.length) enqueueAnnouncement(g,{
    playerName:HOTELS[c].zh,items:[],total:0,bonus:{chain:c,payouts},
  });
}
function payShareholderBonuses(g:Game,c:number,n:number,bankOpponent:boolean){const {majority,minority}=bonusAmounts(priceFor(c,n),g.settings);const owners=g.players.map((p,i)=>({i,n:p.shares[c]})).filter(p=>p.n>0);if(bankOpponent&&g.players.length===2&&g.deck.length){const t=g.deck.pop()!;owners.push({i:-1,n:t%12+1});g.deck.push(t);shuffle(g.deck);note(g,`Market holds ${t%12+1} ${HOTELS[c].name} · 市場虛擬持股`);}owners.sort((a,b)=>b.n-a.n);if(!owners.length)return;const pay=(i:number,x:number)=>{if(i<0)return;g.players[i].cash+=x;note(g,`${g.players[i].name}: +$${x.toLocaleString()} ${HOTELS[c].name} bonus · 股東獎金`);};const top=owners.filter(p=>p.n===owners[0].n);if(top.length>1){for(const o of top)pay(o.i,Math.ceil((majority+minority)/top.length/100)*100);return;}pay(top[0].i,majority);if(owners.length===1){pay(top[0].i,minority);return;}const second=owners.filter(p=>p.n===owners[1].n);for(const o of second)pay(o.i,second.length===1?minority:Math.ceil(minority/second.length/100)*100);}
function settle(g:Game){
  const scores:FinalScore[]=g.players.map(player=>({cashBeforeSettlement:player.cash,hotels:[]}));
  for(const hotel of HOTELS){
    const tiles=size(g,hotel.id);
    const sharePrice=priceFor(hotel.id,tiles);
    const cashBeforeBonus=g.players.map(player=>player.cash);
    if(tiles) bonus(g,hotel.id,tiles,true);
    for(const [index,player] of g.players.entries()){
      const shares=player.shares[hotel.id];
      const sale=shares*sharePrice;
      scores[index].hotels.push({
        id:hotel.id, shares, sharePrice, sale, bonus:player.cash-cashBeforeBonus[index],
      });
      if(tiles){
        player.cash+=sale;
        g.bank[hotel.id]+=shares;
        player.shares[hotel.id]=0;
      }
    }
  }
  g.finalScores=scores;
  g.phase='end';
  const max=Math.max(...g.players.map(player=>player.cash));
  note(g,`${g.players.filter(player=>player.cash===max).map(player=>player.name).join(' & ')} win · 勝出 ($${max.toLocaleString()})`);
}
function completeMerger(g:Game){const m=g.merger!;for(let i=0;i<108;i++)if(m.chains.includes(g.board[i]))g.board[i]=m.survivor;for(const t of independentGroup(g,m.tile))g.board[t]=m.survivor;note(g,`${HOTELS[m.survivor].name} survives · 合併完成`);g.merger=null;g.phase='buy';}
function nextLoser(g:Game){const m=g.merger!;if(!m.remaining.length){completeMerger(g);return;}const max=Math.max(...m.remaining.map(c=>m.sizes[c]));g.pending=m.remaining.filter(c=>m.sizes[c]===max);if(g.pending.length>1){g.phase='order';return;}beginDisposal(g,g.pending[0]);}
function beginDisposal(g:Game,c:number){const m=g.merger!;m.loser=c;m.revealed=g.players.map(p=>p.shares[c]);m.remaining=m.remaining.filter(x=>x!==c);bonus(g,c,m.sizes[c],true);m.order=Array.from({length:g.players.length},(_,i)=>(g.turn+i)%g.players.length).filter(i=>g.players[i].shares[c]>0);m.cursor=0;if(!m.order.length){nextLoser(g);return;}g.phase='dispose';}
function chooseSurvivor(g:Game,c:number){const m=g.merger!;m.survivor=c;m.remaining=m.chains.filter(x=>x!==c);nextLoser(g);}
function announcePurchase(g:Game,p:Player,items:PurchaseAnnouncement['items'],total:number){
  enqueueAnnouncement(g,{playerName:p.name,items,total});
}
function enqueueAnnouncement(g:Game,notice:Omit<PurchaseAnnouncement,'id'|'createdAt'>){
  g.purchaseNotices=[...recentPurchases(g.purchaseNotices),{...notice,id:crypto.randomUUID(),createdAt:Date.now()}].slice(-256);
}
function finishTurn(g:Game){const p=g.players[g.turn];if(g.bought===0){announcePurchase(g,p,[],0);note(g,`${p.name}: no shares bought · 本回合冇買股`);}while(p.hand.length<6&&g.deck.length)p.hand.push(g.deck.pop()!);const dead=p.hand.filter(t=>placement(g,t).chains.filter(c=>size(g,c)>=11).length>1);p.hand=p.hand.filter(t=>!dead.includes(t));g.discard.push(...dead);for(const _ of dead)if(g.deck.length)p.hand.push(g.deck.pop()!);if(dead.length)note(g,`${p.name}: replaced ${dead.length} blocked tile(s) · 更換永久不可用地塊`);if(g.endDeclared){settle(g);return;}if(g.stalls>=g.players.length){note(g,'No playable tiles remain: automatic settlement · 無人能落地塊，自動結算（防停局規則）');settle(g);return;}g.turn=(g.turn+1)%g.players.length;if(g.turn===0)g.round++;g.bought=0;g.phase='place';}
export function actor(g:Game){return g.phase==='dispose'?g.merger!.order[g.merger!.cursor]:g.turn;}
export function applyAction(g:Game,index:number,a:Action){if(g.phase==='end')throw Error('Game finished · 遊戲已結束');if(g.phase==='lobby'){if(a.type==='start'&&index===0){startGame(g);return;}throw Error('Only the host can start · 只有房主可開始');}if(actor(g)!==index)throw Error('Please wait for your turn · 請等待你的回合');const p=g.players[index];if(a.type==='declare'){if(!['place','buy'].includes(g.phase)||!canEnd(g))throw Error('End condition not met · 未達結束條件');g.endDeclared=true;note(g,`${p.name} announces the final turn · 宣告本回合後結束`);return;}
if(a.type==='place'&&g.phase==='place'){const t=a.tile!;if(!Number.isInteger(t)||!p.hand.includes(t))throw Error('Tile is not in your hand · 你未持有此地塊');const plan=placement(g,t);if(!plan.legal)throw Error(plan.reason);p.hand=p.hand.filter(x=>x!==t);g.board[t]=7;g.lastTile=t;g.lastTileEvent=plan.chains.length>1?'merge':!plan.chains.length&&plan.group.length>1?'found':null;g.stalls=0;note(g,`${p.name}: ${label(t)} · 放置地塊`);if(!plan.chains.length){if(plan.group.length>1){g.pending=plan.group;g.phase='found';}else g.phase='buy';}else if(plan.chains.length===1){for(const x of plan.group)g.board[x]=plan.chains[0];g.phase='buy';}else {const sizes=HOTELS.map(h=>size(g,h.id));g.merger={tile:t,survivor:-1,chains:plan.chains,sizes,remaining:[],loser:-1,order:[],cursor:0};const max=Math.max(...plan.chains.map(c=>sizes[c]));g.pending=plan.chains.filter(c=>sizes[c]===max);if(g.pending.length===1)chooseSurvivor(g,g.pending[0]);else g.phase='survivor';}return;}
if(a.type==='found'&&g.phase==='found'){const c=a.chain!;if(!Number.isInteger(c)||c<0||c>6||size(g,c))throw Error('Choose an inactive hotel · 請選尚未成立的酒店');for(const t of g.pending)g.board[t]=c;if(g.bank[c]){g.bank[c]--;p.shares[c]++;}else p.cash+=price(g,c);note(g,`${p.name} founded ${HOTELS[c].name} · 成立酒店，獲創辦獎勵`);g.pending=[];g.phase='buy';return;}
if(a.type==='survivor'&&g.phase==='survivor'){if(!g.pending.includes(a.chain!))throw Error('Choose a tied largest chain · 請選同規模最大酒店');chooseSurvivor(g,a.chain!);return;}
if(a.type==='order'&&g.phase==='order'){if(!g.pending.includes(a.chain!))throw Error('Choose an eligible chain · 請選可處理酒店');beginDisposal(g,a.chain!);return;}
if(a.type==='dispose'&&g.phase==='dispose'){const m=g.merger!;const sell=a.sell??0,trade=a.trade??0;if(!Number.isInteger(sell)||!Number.isInteger(trade)||sell<0||trade<0||sell+trade*2>p.shares[m.loser]||trade>g.bank[m.survivor])throw Error('Invalid share allocation · 股票分配不正確');p.shares[m.loser]-=sell+trade*2;g.bank[m.loser]+=sell+trade*2;p.cash+=sell*priceFor(m.loser,m.sizes[m.loser]);p.shares[m.survivor]+=trade;g.bank[m.survivor]-=trade;const decision=`${p.name} · ${HOTELS[m.loser].name} · 賣出 Sold ${sell} · 換股 Exchanged ${trade*2} → ${trade} ${HOTELS[m.survivor].name} · 保留 Kept ${p.shares[m.loser]}`;
m.cursor++;
if(m.cursor>=m.order.length)nextLoser(g);
note(g,decision);
return;}
if((a.type==='buy'||a.type==='buyAndFinish')&&g.phase==='buy'){const q=a.quantities;if(!Array.isArray(q)||q.length!==7||q.some(x=>!Number.isInteger(x)||x<0)||q.reduce((x,y)=>x+y,0)+g.bought>3)throw Error('Buy up to 3 shares per turn · 每回合最多買三股');let total=0;const items:PurchaseAnnouncement['items']=[];for(let c=0;c<7;c++){if(q[c]&&(!size(g,c)||q[c]>g.bank[c]))throw Error('Shares unavailable · 股票不足或酒店尚未成立');total+=q[c]*price(g,c);if(q[c])items.push({chain:c,quantity:q[c],unitPrice:price(g,c)});}if(total>p.cash)throw Error('Insufficient cash · 現金不足');p.cash-=total;for(let c=0;c<7;c++){p.shares[c]+=q[c];g.bank[c]-=q[c];if(q[c])note(g,`${p.name}: purchased ${HOTELS[c].name} · 買入酒店股票`);}if(items.length)announcePurchase(g,p,items,total);g.bought+=q.reduce((x,y)=>x+y,0);if(a.type==='buyAndFinish')finishTurn(g);return;}
if(a.type==='finish'&&g.phase==='buy'){finishTurn(g);return;}
if(a.type==='pass'&&g.phase==='place'){if(p.hand.some(t=>placement(g,t).legal))throw Error('You have a playable tile · 仍有可落地塊');g.stalls++;note(g,`${p.name} has no playable tile · 沒有可落地塊`);g.phase='buy';return;}throw Error('Action unavailable · 現階段不可執行此操作');}
// Public announcements are transient; persistent history cannot act as an opponents' ledger.
function hiddenHistory(line:string){return line
  .replace(/: bought \d+ (.+) @ \$\d+ · 買入$/, ': purchased $1 · 買入酒店股票')
  .replace(/: \+\$[\d,]+ (.+) bonus · 股東獎金$/, ': $1 bonus · 已派發股東獎金')
  .replace(/: (.+) sold \d+, exchanged \d+, retained \d+ · 賣出／換股／保留$/, ': $1 · 已處理合併股票 / Shares resolved');}
export function publicState(g:Game,viewer:number,delivered?:DeliveredPurchaseAnnouncement[]){
  const {purchaseNotices,...safeGame}=g;
  const now=Date.now();
  const purchaseAnnouncements=delivered??recentPurchases(purchaseNotices,now).flatMap(event=>{const remainingMs=PURCHASE_DISPLAY_MS-(now-event.createdAt);return remainingMs>0?[{...event,remainingMs}]:[];});
  const finished=g.phase==='end';
  const merger=g.merger?{...g.merger,revealed:g.phase==='dispose'?(g.merger.revealed??g.players.map(p=>p.shares[g.merger!.loser])):undefined}:null;
  return {...safeGame,finalScores:finished?g.finalScores:undefined,settings:gameSettings(g.settings),purchaseAnnouncements,merger,deck:[],deckCount:g.deck.length,
    players:g.players.map((p,i)=>({...p,id:undefined,cash:i===viewer||finished?p.cash:undefined,shares:i===viewer||finished?p.shares:[],hand:i===viewer?p.hand:[],handCount:p.hand.length})),
    log:g.log.map(hiddenHistory),announcement:finished?null:hiddenHistory(g.log.at(-1)??''),me:viewer};
}

export function botAction(g:Game):Action {const p=g.players[actor(g)];if(g.phase==='place'){const legal=p.hand.filter(t=>placement(g,t).legal);if(!legal.length)return {type:'pass'};legal.sort((a,b)=>{const score=(t:number)=>{const plan=placement(g,t);return plan.chains.reduce((n,c)=>n+p.shares[c],0)+plan.group.length*2;};return score(b)-score(a);});return {type:'place',tile:legal[0]};}if(g.phase==='found')return {type:'found',chain:HOTELS.find(h=>!size(g,h.id))!.id};if(g.phase==='survivor')return {type:'survivor',chain:[...g.pending].sort((a,b)=>p.shares[b]-p.shares[a])[0]};if(g.phase==='order')return {type:'order',chain:g.pending[0]};if(g.phase==='dispose'){const m=g.merger!;const trade=Math.min(Math.floor(p.shares[m.loser]/2),g.bank[m.survivor]);return {type:'dispose',trade,sell:p.shares[m.loser]-trade*2};}if(g.phase==='buy'){if(canEnd(g)&&!g.endDeclared)return {type:'declare'};if(g.bought)return {type:'finish'};const q=Array(7).fill(0);let cash=p.cash;for(let i=0;i<3;i++){const options=HOTELS.filter(h=>price(g,h.id)>0&&g.bank[h.id]>q[h.id]&&price(g,h.id)<=cash).sort((a,b)=>(p.shares[b.id]+q[b.id])-(p.shares[a.id]+q[a.id]));if(!options.length)break;const c=options[i%options.length].id;q[c]++;cash-=price(g,c);}if(!q.some(Boolean))return {type:'finish'};return {type:'buy',quantities:q};}throw Error('No bot action');}

// The printed Classic Stockholder Info Card, expressed using the same price rules.
// Presentation order within each tier. Hotel IDs also index saved game state.
const HOTEL_DISPLAY_ORDER = [4, 6, 5, 2, 1, 0, 3];
export const HOTEL_PRICE_GROUPS = [0, 1, 2].map(tier =>
  HOTEL_DISPLAY_ORDER.filter(id => HOTELS[id].tier === tier),
);
export const CHAIN_SIZE_BANDS = [
  {from:2,to:2,label:'2'}, {from:3,to:3,label:'3'},
  {from:4,to:4,label:'4'}, {from:5,to:5,label:'5'},
  {from:6,to:10,label:'6–10'}, {from:11,to:20,label:'11–20'},
  {from:21,to:30,label:'21–30'}, {from:31,to:40,label:'31–40'},
  {from:41,to:108,label:'41+'},
];
export const PRICE_REFERENCE_ROWS = Array.from({length:11},(_,i)=>{
  const value=(i+2)*100;
  return {price:value,majority:value*10,minority:value*5,
    sizes:HOTEL_PRICE_GROUPS.map(ids=>CHAIN_SIZE_BANDS.find(b=>priceFor(ids[0],b.from)===value)?.label??'—')};
});
