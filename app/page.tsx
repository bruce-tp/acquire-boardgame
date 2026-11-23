'use client';
import {useState,useEffect,useRef} from 'react';
import {GameSettingsPicker,GameSettingsSummary} from '../components/game-settings';
import {STANDARD_SETTINGS,gameSettings,type GameSettings} from '../lib/game/settings';
import {ShareCards} from '../components/share-cards';
import {PriceReference,PriceReferenceDialog} from '../components/price-reference';
import {useTurnSound} from '../hooks/use-turn-sound';
import {createTurnReminder} from '../lib/turn-reminder';
import {SoundControls} from '../components/sound-controls';
import {TurnGuide} from '../components/turn-guide';
import {HotelPoster} from '../components/hotel-poster';
import {createPracticeGame} from '../lib/game/practice';
import {BeginnerTutorial} from '../components/beginner-tutorial';
import {FinalScorecard} from '../components/final-scorecard';
import {BoardTile} from '../components/board-tile';
import {MergerResults} from '../components/merger-results';
import {PurchaseAnnouncements} from '../components/purchase-announcements';
import {acceptRoomView} from '../lib/purchase-notice-queue';
import {Building2,Copy,Check,Users,Plus,Minus,DoorOpen,BookOpen,Landmark,ShieldCheck,Coins,Volume2,VolumeX,X,Globe2,ChevronRight,RotateCcw,Play,Share2,Wifi,WifiOff,Crown} from 'lucide-react';
import {HOTELS,HOTEL_PRICE_GROUPS,createGame,makePlayer,publicState,applyAction,actor,placement,size,price,priceFor,canEnd,label,botAction,type Game,type Action} from '../lib/game/engine';
type View=ReturnType<typeof publicState>;
const money=(n:number|undefined)=>n===undefined?'隱藏 · Hidden':'$'+n.toLocaleString('en-GB');
const hotelNames = new Map(HOTELS.flatMap(hotel =>
  [[hotel.name, hotel.colour], [hotel.zh, hotel.colour]] as [string, string][],
));
const hotelNamePattern = new RegExp(
  '(' + [...hotelNames.keys()].sort((a,b)=>b.length-a.length)
    .map(name=>name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|') + ')',
  'g',
);
function activityText(message:string){
  return message.split(hotelNamePattern).map((part,index)=>
    index%2===1?<b key={index} style={{color:hotelNames.get(part)}}>{part}</b>:part,
  );
}

function Emblem({c=0,small=false}:{c?:number;small?:boolean}){const h=HOTELS[c];return <span className={'emblem brand-emblem '+(small?'small':'')} style={{'--hotel':h.colour} as React.CSSProperties} role="img" aria-label={`${h.zh} ${h.name} · ${h.region}`} title={`${h.zh} · ${h.name}`}><span className="hotel-logo" style={{maskImage:`url("${h.logo}")`,WebkitMaskImage:`url("${h.logo}")`}}/><span className="brand-code" aria-hidden="true">{h.mark}</span></span>}

function createScorecardPreview(settings:GameSettings){
  const game=createGame('PREVIEW','sample-1','Alex',settings);
  game.players.push(makePlayer('sample-2','Jamie'),makePlayer('sample-3','Sam'));
  game.board.fill(0,0,41);
  game.board.fill(2,60,68);
  game.board.fill(4,90,93);
  const cash=[1800,2900,1100];
  const holdings=[[7,0,2,0,4,0,0],[4,0,6,0,1,0,0],[1,0,1,2,4,0,0]];
  game.players.forEach((player,index)=>{
    player.cash=cash[index];
    player.shares=holdings[index];
    player.shares.forEach((count,hotel)=>{game.bank[hotel]-=count;});
  });
  game.phase='buy';
  applyAction(game,0,{type:'declare'});
  applyAction(game,0,{type:'finish'});
  return publicState(game,0);
}

function ScorecardPreview({view,close}:{view:View;close:()=>void}){
  const dialog=useRef<HTMLDialogElement>(null);
  useEffect(()=>{dialog.current?.showModal();},[]);
  return <dialog ref={dialog} className="dialog" aria-labelledby="scorecard-preview-title"
    onClose={close} style={{width:'min(94vw, 730px)',color:'#e3edf4'}}>
    <form method="dialog"><button className="icon close" aria-label="關閉 Close"><X size={20}/></button></form>
    <h2 id="scorecard-preview-title">結算表預覽 · Scorecard preview</h2>
    <p>示範對局 · Sample game</p>
    <FinalScorecard view={view}/>
  </dialog>;
}

function Rulebook({close, settings}: {close: () => void; settings: GameSettings}) {
  const major = settings.majorityMultiplier;
  const minor = major / 2;
  const steps = [
    ['開局同勝出條件 · Set-up and objective',
      '房主開局後，每人有 $6,000、零持股同六個專屬地塊。系統先為每人放一幢獨立建築，按棋盤次序（1A 至 12A，再到 B 行）最先出現嘅起始地塊決定先手，之後按座位順序輪流。結算後現金最多嘅玩家勝出。',
      'When the host starts the game, each player gets $6,000, no shares and six private building spots. The game places one independent building per player. The player whose starting square comes first in board order (1A to 12A, then row B and so on) goes first. Turns follow seat order. The most cash after settlement wins.'],
    ['揀一格起樓 · Place one tile',
      '輪到你時，喺棋盤揀一個可用嘅專屬地塊，再撳「確認放置」。只計上下左右。新地塊會連同接通嘅獨立建築一齊處理。冇接到其他建築就保持獨立；只接到獨立建築就揀一個未成立嘅品牌開酒店；接到一間酒店就擴展；接到兩間或以上就合併。創辦人獲一股，冇庫存就按新酒店股價收現金。',
      'Choose one available private spot and select Build tile. Connections count across shared edges. Resolve the new tile together with the independent buildings it connects. An isolated tile stays independent. Connecting only to independent buildings lets you found an inactive brand. Connecting to one hotel expands it. Connecting to two or more triggers a merger. Founders get one share, or its cash value if none is left.'],
    ['安全酒店同無法放置 · Safe hotels and blocked spots',
      '酒店達 11 格就安全，可以收購較細酒店。連接兩間安全酒店嘅位置永久不能使用，系統會喺回合尾換走，有地塊剩餘先補。七間酒店都已成立時，會成立新酒店嘅位置暫時不能使用。完全冇位置可用時，可以跳過放置，繼續買股。',
      'A hotel with 11 or more tiles is safe and can acquire smaller hotels. Spots that would join two safe hotels are permanently blocked and are replaced at turn end if tiles remain. Founding spots are temporarily blocked when all seven hotels are active. If you have no legal placement, skip placement and continue to share buying.'],
    ['合併時點做 · Resolve a merger',
      '比較合併前嘅酒店大小，最大一間收購其餘酒店。最大同格數時，由落地塊嘅玩家揀存續酒店。被收購酒店由大至小逐間處理，同格數由落地塊嘅玩家揀次序。每間先派股東獎金，再由落地塊嘅玩家開始，按座位順序畀有持股嘅人決定點處理。',
      'Compare hotel sizes before the merger. The largest hotel acquires the others. The tile placer breaks ties for the surviving hotel and for the order of equally sized acquired hotels. Process acquired hotels largest first. For each one, award bonuses first, then let shareholders decide what to do in seat order starting with the tile placer.'],
    ['賣出、換股、保留 · Sell, exchange or keep',
      '你可以混合三種做法。賣出按被收購酒店合併前嘅股價計。每兩股可換一股存續酒店嘅股票，視乎庫存。保留嘅股票可以等原品牌重新成立。例：你有六股，可以賣兩股、用兩股換一股、保留兩股。',
      'You can combine all three options. Sell at the acquired hotel’s pre-merger share price. Exchange two acquired shares for one surviving share, subject to supply. Kept shares can regain value if the brand is founded again. With six shares, you could sell two, exchange two for one, and keep two.'],
    ['股東獎金 · Shareholder bonuses',
      `本局大股東獎金係每股股價 ×${major}，第二大股東係 ×${minor}。只有一位持股者就攞晒兩份。並列第一就平分兩份獎金；並列第二就平分第二份。平分所得向上取整至最接近嘅 $100。兩人局喺合併同結算計獎金時，如果地塊池仲有地塊，市場會用隨機地塊嘅欄號作為虛擬持股數。`,
      `This table pays ${major}× the share price to the largest shareholder and ${minor}× to the second largest. A sole shareholder gets both. Tied leaders split both bonuses. Tied runners-up split the second bonus. Round each split award up to the next $100 increment. In two-player games, if tiles remain, a random tile’s column number is the market’s virtual shareholding when bonuses are calculated for a merger or settlement.`],
    ['買股同完成回合 · Buy shares and finish the turn',
      '處理完放置同合併，可以用現金買已成立酒店嘅股票。每回合合共最多三股，可以分開買幾間。用股價表按品牌同酒店格數查價。確認買入會完成回合，唔買就撳「完成回合」。用咗一個專屬地塊，其餘會留低，有地塊剩餘就自動補上。其他玩家睇到你買咗乜嘢，但各人只見到自己嘅現金、總持股同專屬地塊；合併時會公開被收購酒店嘅持股供處理。',
      'After resolving placement and any merger, use cash to buy up to three shares in total across active hotels, subject to supply. Use the price guide to find the price for each brand and size. Confirming a purchase finishes your turn. To skip buying, select Finish turn. Unused private spots carry over and the game replenishes them while tiles remain. Purchases are announced. Cash, total holdings and private spots are personal, with acquired hotel holdings revealed during a merger.'],
    ['幾時結算 · End the game',
      '如果有酒店達 41 格，或者場上至少有一間酒店而每間都達 11 格，輪到你時可以喺放置或買股階段宣告最後回合。完成你嘅回合後就結算。如果全場連續一輪都冇人可以放置，遊戲亦會自動結算。每間仍然成立嘅酒店先派獎金，再按最終股價兌現股份。未成立品牌嘅股票值 $0。結算表嘅總數係結算前現金加獎金同賣股所得。最高總數勝出，同分並列。',
      'On your turn, you may declare the final turn during placement or buying if any hotel reaches 41 tiles, or if at least one hotel is active and every active hotel has 11 or more tiles. Finish your turn, then settle. The game also settles if everyone goes a full round without a legal placement. Active hotels pay bonuses and their shares are sold at final prices. Inactive shares are worth $0. The final total is cash before settlement plus bonuses and share proceeds. The highest total wins, with joint winners on a tie.'],
  ];
  return <div className="overlay" onClick={close}>
    <section className="dialog rules" role="dialog" aria-modal="true" aria-label="完整規則 · Full rules" onClick={e => e.stopPropagation()}>
      <button className="icon close" onClick={close} aria-label="關閉 · Close"><X size={20}/></button>
      <h2>完整規則 <em>Full rules</em></h2>
      <p>每回合先放一格，再處理酒店變化，最後買股或交棒。<br/><span lang="en">On your turn, place one tile, resolve what happens to the hotels, then buy shares or finish.</span></p>
      {steps.map(([title, zh, en], index) => <div className="rule-step" key={title}>
        <b>{index + 1}</b><div><h3>{title}</h3><p>{zh}</p><p lang="en">{en}</p></div>
      </div>)}
    </section>
  </div>;
}
export default function Home(){
const [selectedSettings,setSelectedSettings]=useState<GameSettings>({...STANDARD_SETTINGS});
const [showSkyline,setShowSkyline]=useState(true);
const [tutorial,setTutorial]=useState(false);
useEffect(()=>{try{setShowSkyline(localStorage.getItem('acquire:show-skyline')!=='false');}catch{}},[]);
function toggleSkyline(){const next=!showSkyline;setShowSkyline(next);try{localStorage.setItem('acquire:show-skyline',String(next));}catch{}}
const [view,setView]=useState<View|null>(null),[name,setName]=useState(''),[code,setCode]=useState(''),[mode,setMode]=useState('create'),[rules,setRules]=useState(false),[scorecardPreview,setScorecardPreview]=useState<View|null>(null),[priceGuide,setPriceGuide]=useState(false),[error,setError]=useState(''),[busy,setBusy]=useState(false),[copied,setCopied]=useState(false),[connected,setConnected]=useState(true),[quantities,setQuantities]=useState<number[]>(Array(7).fill(0)),[sell,setSell]=useState(0),[trade,setTrade]=useState(0),[selected,setSelected]=useState<number|null>(null),[confirmLeave,setConfirmLeave]=useState(false);const {sound,volume,audioError,setVolume,previewSound,toggleSound,playDing,cancelPendingDing}=useTurnSound();const session=useRef<{code:string;token:string}|null>(null),demo=useRef<Game|null>(null),lastPhase=useRef('');
async function load(s:{code:string;token:string}){const r=await fetch('/api/room?code='+s.code,{headers:{Authorization:'Bearer '+s.token},cache:'no-store'});const data=await r.json() as any;if(!r.ok)throw Error(data.error);setView(old=>acceptRoomView(old,data));setConnected(true);}
useEffect(()=>{try{const query=new URLSearchParams(location.search).get('room')?.toUpperCase();const last=query||localStorage.getItem('acquire:last');if(last){setCode(last);setMode('join');const saved=localStorage.getItem('acquire:room:'+last);if(saved){const s={code:last,token:saved};session.current=s;load(s).catch(e=>{setError(e.message);session.current=null;});}}setName(localStorage.getItem('acquire:name')||'');}catch{}},[]);
useEffect(()=>{const t=setInterval(()=>{if(session.current&&!demo.current)load(session.current).catch(()=>setConnected(false));},1600);return()=>clearInterval(t);},[]);
useEffect(()=>{if(!view){lastPhase.current='';cancelPendingDing();return;}const key=[view.code,view.round,view.turn,view.phase,view.merger?.loser??'',view.merger?.cursor??''].join(':');if(lastPhase.current!==key){setQuantities(Array(7).fill(0));setSell(0);setTrade(0);setSelected(null);const cue=view.phase;if(actor(view as any)===view.me&&(cue==='place'||cue==='buy'||cue==='dispose'))playDing(cue);else cancelPendingDing();lastPhase.current=key;}},[view,playDing,cancelPendingDing]);
useEffect(()=>{if(!view||!demo.current||['lobby','end'].includes(view.phase)||actor(demo.current)===0)return;const timer=setTimeout(()=>{try{const g=demo.current!;applyAction(g,actor(g),botAction(g));g.version++;setView(publicState(g,0));}catch(e){setError(String(e));}},750);return()=>clearTimeout(timer);},[view]);
const buyReminderKey=view?.phase==='buy'&&view.turn===view.me?`${view.code}:${view.round}:${view.turn}`:null;
useEffect(()=>{
  if(!buyReminderKey||busy)return;
  const reminder=createTurnReminder(()=>playDing('buy'));
  document.addEventListener('pointerdown',reminder.activity,{passive:true});
  document.addEventListener('keydown',reminder.activity);
  document.addEventListener('input',reminder.activity);
  return()=>{
    reminder.stop();
    document.removeEventListener('pointerdown',reminder.activity);
    document.removeEventListener('keydown',reminder.activity);
    document.removeEventListener('input',reminder.activity);
    cancelPendingDing();
  };
},[buyReminderKey,busy,playDing,cancelPendingDing]);
async function enter(){setError('');if(!name.trim()){setError('請輸入名字 · Please enter your name');return;}if(mode==='join'&&!/^[A-Z2-9]{6}$/.test(code)){setError('請輸入六位房號 · Enter a six-character room code');return;}setBusy(true);try{const stored=localStorage.getItem('acquire:room:'+code);const r=await fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json',...(stored?{Authorization:'Bearer '+stored}:{})},body:JSON.stringify({type:mode==='create'?'create':'join',name,code,...(mode==='create'?{settings:selectedSettings}:{})})});const data=await r.json() as any;if(!r.ok)throw Error(data.error);const s={code:data.state.code,token:data.token||stored};if(!s.token)throw Error('Missing session');session.current=s;demo.current=null;localStorage.setItem('acquire:room:'+s.code,s.token);localStorage.setItem('acquire:last',s.code);localStorage.setItem('acquire:name',name);history.replaceState(null,'','?room='+s.code);setView(data.state);setConnected(true);}catch(e){setError(e instanceof Error?e.message:'連線失敗 · Connection failed');}finally{setBusy(false);}}
async function act(action:Action){if(busy)return;setError('');setBusy(true);try{if(demo.current){applyAction(demo.current,0,action);demo.current.version++;setView(publicState(demo.current,0));}else{const s=session.current!;const r=await fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+s.token},body:JSON.stringify({type:'action',code:s.code,version:view!.version,action})});const data=await r.json() as any;if(!r.ok){await load(s);throw Error(data.error);}setView(data.state);setConnected(true);}}catch(e){setError(e instanceof Error?e.message:'操作失敗 · Action failed');}finally{setBusy(false);}}
function practice(){const g=createPracticeGame(name.trim()||'You · 你',selectedSettings);demo.current=g;session.current=null;setError('');setView(publicState(g,0));}
async function copy(){try{await navigator.clipboard.writeText(location.origin+'/?room='+view!.code);setCopied(true);setTimeout(()=>setCopied(false),2200);}catch{setError('邀請連結 · Invite link: '+location.origin+'/?room='+view!.code);}}
function leave(){demo.current=null;session.current=null;localStorage.removeItem('acquire:last');history.replaceState(null,'',location.pathname);setView(null);setError('');setConfirmLeave(false);}
const playing=view&&view.phase!=='lobby',me=view?.players[view.me] as (View['players'][number]&{cash:number})|undefined,myTurn=playing&&view.phase!=='end'&&actor(view as any)===view.me,activePlayer=view&&view.phase!=='lobby'?view.players[actor(view as any)]:null;
const activeSettings=gameSettings(view?.settings??selectedSettings);
const currentPhase=view?.phase;const phaseInfo:Record<string,[string,string]>={place:['第 1 / 2 階段：放置地塊','Phase 1 of 2: place a tile'],found:['第 1 / 2 階段：成立酒店','Phase 1 of 2: found a hotel'],survivor:['第 1 / 2 階段：決定合併結果','Phase 1 of 2: choose the surviving chain'],order:['第 1 / 2 階段：處理合併次序','Phase 1 of 2: resolve merger order'],dispose:['第 1 / 2 階段：處理合併持股','Phase 1 of 2: sell, exchange or retain shares'],buy:['第 2 / 2 階段：買股票（可跳過）','Phase 2 of 2: buy shares (optional)'],end:['你的帝國，現在結算','The final balance sheet']};
const total=view?quantities.reduce((n,q,c)=>n+q*price(view as any,c),0):0,totalQ=quantities.reduce((a,b)=>a+b,0);const affordable=!!me&&total<=me.cash;
return <main className={playing?'app playing':'app'}><header className="topbar"><button className="brand" onClick={()=>view?setConfirmLeave(true):null} aria-label="Big Ambition home"><span className="brand-mark">B<span/></span><span>BIG AMBITION<small>THE HOTEL EXCHANGE</small></span></button><div className="top-right"><span className="edition">HONG KONG × JAPAN <i/> 經典版</span><button className="text-button price-guide-button" onClick={()=>setPriceGuide(true)}><Landmark size={17}/><span>股價表 <span className="english">Price guide</span></span></button><button className="text-button" onClick={()=>setTutorial(true)}><BookOpen size={17}/><span>新手教學 <span className="english">Learn to play</span></span></button><SoundControls sound={sound} volume={volume} error={audioError} toggle={toggleSound} setVolume={setVolume} preview={previewSound}/></div></header>
{!playing?<><div className="landing landing-immersive">
<div className="landing-showcase">
<section className="hero hotel-landing-hero"><img className="landing-toast-art" src="/art/gatsby-toast-v1.webp" alt="" aria-hidden="true" draggable={false} width={1536} height={1024}/><div className="hero-copy"><span className="eyebrow"><span className="line"/>A CLASSIC GAME OF AMBITION</span><h1>一座城市。<br/>無限<span>野心。</span></h1><p className="hero-en">Build a city.<br/><em>Build an empire.</em></p><p className="hero-desc">從半島、文華，到喜來登。建立你的酒店帝國。<br/>與朋友一起建造、投資，掌握每一次合併的時機。</p><div className="hero-tags"><span><Users size={15}/> 2–6 位玩家 <small>players</small></span><span><Globe2 size={15}/> 即開即玩 <small>in your browser</small></span></div><a className="primary hero-play-link" href="#room-entry">{view?'前往房間 · Your table':'開房／加入遊戲 · Play with friends'}</a></div>
<blockquote className="landing-toast-quote">
  <p lang="yue-Hant">今晚我嘅～<br/>今晚之後，間酒店都係我嘅～</p>
  <p lang="en">Tonight’s on me.<br/>After tonight, the hotel’s mine too.</p>
</blockquote>
<HotelPoster landing/><div className="art-caption"><span>THE CITY IS YOURS TO BUILD</span><span>BIG AMBITION</span></div></section>
<div className="hotel-collection" tabIndex={0} role="region" aria-label="七大酒店品牌 · Seven hotel brands">
  {[[0, 1, 6, 3], [4, 5, 2]].map((hotelIds, side) => (
    <div className="hotel-rail" key={side}>
      {hotelIds.map(id => HOTELS[id]).map(h => (
        <div className="hotel-mini" key={h.id} style={{'--hotel': h.colour} as React.CSSProperties}>
          <Emblem c={h.id}/><strong>{h.zh}</strong><small lang="en">{h.name}</small>
        </div>
      ))}
    </div>
  ))}
</div>
</div>
<section className="entry-area" id="room-entry" tabIndex={-1}>{view?<div className="entry-card room-card"><span className="eyebrow">YOUR PRIVATE TABLE</span><h2>朋友到齊，<br/>就開局。<em>Your table awaits.</em></h2><div className="room-code"><div><span>房間號碼 · ROOM CODE</span><strong>{view.code}</strong></div><button className="icon" onClick={copy} aria-label="複製邀請連結 Copy invitation">{copied?<Check size={21}/>:<Copy size={21}/>}</button></div><p className="muted">分享邀請連結，讓朋友加入。<br/>Share your invitation link to bring friends to the table.</p><GameSettingsSummary settings={view.settings}/><div className="lobby-players">{view.players.map((p,i)=><div key={i}><span className={'avatar av'+i}>{p.name.slice(0,1).toUpperCase()}</span><span>{p.name}</span><span className="player-tag">{i===0?'房主 · HOST':'已加入 · JOINED'}</span></div>)}{Array.from({length:Math.max(0,3-view.players.length)},(_,i)=><div className="empty-seat" key={i}><span className="avatar"><Plus size={18}/></span><span>等待朋友加入 <small>Waiting for a friend</small></span></div>)}</div><button className="primary" disabled={busy||view.me!==0||view.players.length<2} onClick={()=>act({type:'start'})}><Play size={17}/>{view.me===0?'開始遊戲 · Start game':'等待房主開始 · Waiting for host'}</button><button className="secondary" onClick={copy}>{copied?<Check size={16}/>:<Share2 size={16}/>} {copied?'已複製 · Copied':'邀請朋友 · Invite friends'}</button><button className="quiet" onClick={()=>setConfirmLeave(true)}>返回大堂 · Leave table</button><p className="card-footnote">Classic · 隱藏現金及持股 / Hidden cash & shares</p></div>:<div className="entry-card"><span className="eyebrow">A SEAT AT THE TABLE</span><h2>你的帝國，<br/>由這裏開始。<em>Your next move starts here.</em></h2><div className="entry-tabs" role="tablist"><button role="tab" aria-selected={mode==='create'} className={mode==='create'?'active':''} onClick={()=>{setMode('create');setError('');}}>開設房間 <small>Create a room</small></button><button role="tab" aria-selected={mode==='join'} className={mode==='join'?'active':''} onClick={()=>{setMode('join');setError('');}}>加入房間 <small>Join a room</small></button></div><form onSubmit={e=>{e.preventDefault();enter();}}><label className="input-label" htmlFor="name">你的名字 <span>YOUR NAME</span></label><input id="name" autoComplete="nickname" maxLength={24} placeholder="投資者，如何稱呼你？ / Your name" value={name} onChange={e=>setName(e.target.value)}/>{mode==='create'&&<GameSettingsPicker value={selectedSettings} onChange={setSelectedSettings} disabled={busy}/>}{mode==='join'&&<><label className="input-label" htmlFor="room">房間號碼 <span>ROOM CODE</span></label><input id="room" placeholder="例如 / e.g. AB7XK2" value={code} maxLength={6} onChange={e=>setCode(e.target.value.toUpperCase().replace(/[^A-Z2-9]/g,''))}/></>}<button className="primary" disabled={busy} type="submit">{mode==='create'?<Plus size={18}/>:<DoorOpen size={18}/>}{busy?'連線中 · Connecting…':mode==='create'?'開設私人房間 · Create a room':'加入遊戲 · Join game'}</button></form><div className="or"><span/>或先熟悉一下 · OR EXPLORE FIRST<span/></div><button type="button" className="secondary tutorial-launch" onClick={()=>setTutorial(true)}><BookOpen size={18}/>新手教學 <span>Learn to play</span></button><button className="secondary" onClick={practice}><Landmark size={18}/>試玩一局 <span>Play a practice game</span></button><button type="button" className="secondary" style={{marginTop:8}} onClick={()=>setScorecardPreview(createScorecardPreview(selectedSettings))}>預覽結算表 · Preview scorecard</button><p className="card-footnote"><ShieldCheck size={14}/> 無需安裝，分享連結即可邀請朋友<br/><span>No installation. Just a link and good company.</span></p></div>}{error&&<div className="error" role="alert">{error}</div>}</section></div>
<footer style={{textAlign:'center',padding:'1.5rem 1rem',lineHeight:1.7}}>
  <div>開發者 · Developed by <strong>Bruce Lam</strong></div>
  <div>特別鳴謝首輪測試玩家 · Special thanks to our first playtesters</div>
  <div>Anson Cheung · Owen Liu · Ka Fu Cheung</div>
</footer></>:<div className="game-wrap"><PurchaseAnnouncements roomCode={view.code} incoming={view.purchaseAnnouncements}/><div className="table-heading"><div><span className="eyebrow">{demo.current?'PRACTICE TABLE · 練習桌':'PRIVATE TABLE · 私人房間'}</span><h2>{demo.current?'建立你的酒店王國。':'歡迎來到交易所。'} <em>{demo.current?'Build your hotel empire.':'The city is in play.'}</em></h2></div>{me&&view.phase!=='end'&&<section className="holdings-panel header-holdings">
  <h3>你的持股 <small>Your holdings</small></h3>
  <dl>{HOTELS.map(h=><div key={h.id}>
    <dt style={{color:h.colour}}><abbr title={h.zh+' · '+h.name}>{h.mark}</abbr></dt>
    <dd>{me.shares[h.id]}</dd>
  </div>)}</dl>
</section>}<div className="table-controls"><span className={'connection '+(connected?'':'offline')}>{connected?<Wifi size={14}/>:<WifiOff size={14}/>} {demo.current?'本機練習 · Local':connected?'已連線 · Connected':'重新連線中 · Reconnecting'}</span>{!demo.current&&<button className="secondary compact" onClick={copy}>{copied?<Check size={15}/>:<Copy size={15}/>} {view.code}</button>}<button className="icon" aria-label="離開房間 Leave table" onClick={()=>setConfirmLeave(true)}><DoorOpen size={18}/></button></div></div><GameSettingsSummary settings={view.settings} compact/><div className="scoreboard">{view.players.map((p,i)=><div className={'player-card '+(view.phase!=='end'&&actor(view as any)===i?'current':'')} key={i}><span className={'avatar av'+i}>{p.name.slice(0,1).toUpperCase()}</span><div><strong>{p.name} {i===view.me&&<small>你 YOU</small>}</strong><span>{view.phase==='end'?'最終資產 · Final cash':i===view.me?'你的現金 · Your cash':'現金 · Private cash'} <b>{money(p.cash)}</b></span></div>{view.phase==='end'&&p.cash===Math.max(...view.players.map(p=>p.cash??0))?<Crown size={20} className="gold"/>:<span className="turn-indicator">{view.phase!=='end'&&actor(view as any)===i?'回合 TURN':(p.handCount+' 地塊 TILES')}</span>}</div>)}</div><div className="game-layout"><aside className="table-information" aria-label="合併持股及交易紀錄 · Merger holdings and table activity">
{view.phase==='dispose'&&view.merger?.revealed&&<section className="merger-reveal holdings-panel"><h3>被收購酒店股東 <small>Acquired chain shareholders</small></h3><p>{HOTELS[view.merger.loser].zh} · {HOTELS[view.merger.loser].name}</p><table><thead><tr><th>投資者 · Investor</th><th>合併前股數 · Shares</th></tr></thead><tbody>{view.players.map((p,i)=><tr key={i}><th>{p.name}</th><td className="has-shares">{view.merger!.revealed![i]}</td></tr>)}</tbody></table><p className="private-note">只公開本次被收購酒店在合併前的持股。<br/>Only pre-merger holdings in this acquired chain are disclosed.</p></section>}
<section className="activity-panel"><h3>交易紀錄 <small>Table activity</small></h3>{view.phase!=='end'&&view.announcement&&<p className="live-announcement" aria-live="polite"><span>最新公告 · Latest announcement</span>{activityText(view.announcement)}</p>}<div className="activity-log" aria-live="polite">{view.log.slice(-14).reverse().map((s,i)=><p key={view.log.length-i} className={i===0?'latest':''}><span className="log-dot"/>{activityText(s)}</p>)}</div></section></aside><section className="board-area"><div className="board-top"><div><span className="eyebrow">THE CITY MAP</span><h3>城市版圖 <span>12 × 9</span></h3>{myTurn&&currentPhase==='place'&&<span className="phase-focus-label"><Building2 size={14}/>現在放地塊 · PLACE A TILE</span>}</div><div className="board-tools"><div className="board-meta"><button type="button" className="skyline-toggle" aria-pressed={showSkyline} aria-controls="city-panorama" onClick={toggleSkyline}>{showSkyline?'收起插畫 · Hide artwork':'顯示插畫 · Show artwork'}</button><span>第 {view.round} 輪 · ROUND {view.round}</span><span>{view.deckCount} 地塊剩餘 · TILES LEFT</span></div></div></div><HotelPoster id="city-panorama" hidden={!showSkyline}/><div className="board-with-results"><div className="board-scroll"><div className={'board-frame '+(myTurn&&currentPhase==='place'?'phase-active phase-map-active':'')}><div className="grid-label corner">A</div>{Array.from({length:12},(_,i)=><div className="grid-label" key={'c'+i}>{i+1}</div>)}{Array.from({length:9},(_,r)=><div className="board-row" key={r}><div className="grid-label">{String.fromCharCode(65+r)}</div>{Array.from({length:12},(_,c)=>{
  const tile=r*12+c;
  const plan=me?.hand.includes(tile)?placement(view as any,tile):null;
  return <BoardTile key={tile} tile={tile} value={view.board[tile]} plan={plan}
    playable={!!(myTurn&&currentPhase==='place'&&plan?.legal)} selected={selected===tile}
    latest={view.lastTile===tile} onSelect={()=>setSelected(tile)}/>;
})}</div>)}</div></div><MergerResults key={view.code} incoming={view.purchaseAnnouncements}/></div><div className="board-legend">{view.lastTile!==null&&<span className="latest-tile-legend">最新落牌 · Latest placement <strong>{label(view.lastTile)}</strong></span>}<span><i className="legend-independent"/>獨立建築 <small>Independent</small></span><span><i className="legend-held"/>你的專屬地塊 <small>Your private building spots</small></span><span><ShieldCheck size={14}/> 11+ 安全 <small>Safe chain</small></span></div>

<section className="action-panel"><div className="action-panel-head"><div className="action-title" role="status" aria-live="polite" aria-atomic="true"><span className={'action-status '+(myTurn?'yours':'')}><span/>{view.phase==='end'?'已結算 · FINISHED':myTurn?'輪到你 · YOUR TURN':`${activePlayer?.name} 的回合 · THEIR TURN`}</span><h3>{phaseInfo[currentPhase!]?.[0]} <small>{phaseInfo[currentPhase!]?.[1]}</small></h3></div>{myTurn&&['place','buy'].includes(currentPhase!)&&<div className="action-header-controls">{currentPhase==='place'?(me!.hand.some(t=>placement(view as any,t).legal)?<button className="primary compact" disabled={selected===null||busy} onClick={()=>act({type:'place',tile:selected!})}>確認放置 · Build tile</button>:<button className="secondary compact" disabled={busy} onClick={()=>act({type:'pass'})}>無牌可落 · Pass placement</button>):<>{totalQ>0&&<button className="secondary compact" disabled={busy} onClick={()=>setQuantities(Array(7).fill(0))}>取消選股 · Clear selection</button>}<button className="primary compact" disabled={busy||totalQ>0} onClick={()=>act({type:'finish'})}>完成回合 · Finish turn</button></>}</div>}</div><TurnGuide phase={view.phase} bought={view.bought} mine={!!myTurn} selected={selected===null?null:label(selected)} cartCount={totalQ}/>{myTurn&&['found','survivor','order'].includes(currentPhase!)&&<div className="chain-choices">{HOTELS.filter(h=>currentPhase==='found'?!size(view as any,h.id):view.pending.includes(h.id)).map(h=><button className="chain-choice" key={h.id} disabled={busy} onClick={()=>act({type:currentPhase!,chain:h.id})}><Emblem c={h.id} small/><span>{h.zh}<small>{h.name}</small></span></button>)}</div>}{myTurn&&currentPhase==='dispose'&&view.merger&&<div className="disposal"><p>{HOTELS[view.merger.loser].zh} / {HOTELS[view.merger.loser].name}：持有 {me!.shares[view.merger.loser]} 股，每股 {money(priceFor(view.merger.loser,view.merger.sizes[view.merger.loser]))}。<br/>Exchange two acquired shares for one {HOTELS[view.merger.survivor].name} share. Unallocated shares are retained.</p><div className="disposal-inputs"><label>賣出股數 · Sell<input type="number" min={0} max={me!.shares[view.merger.loser]} value={sell} onChange={e=>setSell(Number(e.target.value))}/></label><label>換入股數 · Receive<input type="number" min={0} max={Math.min(Math.floor(me!.shares[view.merger.loser]/2),view.bank[view.merger.survivor])} value={trade} onChange={e=>setTrade(Number(e.target.value))}/></label><div className="retained">保留 · Retain<strong>{me!.shares[view.merger.loser]-sell-trade*2}</strong></div><button className="primary compact" disabled={busy||!Number.isInteger(sell)||!Number.isInteger(trade)||sell<0||trade<0||sell+trade*2>me!.shares[view.merger.loser]||trade>view.bank[view.merger.survivor]} onClick={()=>act({type:'dispose',sell,trade})}>確認 · Confirm</button></div></div>}{myTurn&&canEnd(view as any)&&['place','buy'].includes(currentPhase!)&&!view.endDeclared&&<button className="end-declare" onClick={()=>act({type:'declare'})}>已達結束條件：宣告最後回合 · Declare final turn</button>}{view.endDeclared&&view.phase!=='end'&&<p className="gold">本回合完成後結算 · The game will settle after this turn.</p>}{view.phase==='end'&&<div className="results"><p><Crown size={24}/>{view.players.filter(p=>p.cash===Math.max(...view.players.map(p=>p.cash??0))).map(p=>p.name).join(' & ')} 勝出 · wins!</p><FinalScorecard view={view}/><button className="secondary compact" onClick={leave}>返回大堂 · Back to lobby</button>{demo.current&&<button className="primary compact" onClick={practice}>再練一局 · Practise again</button>}</div>}</section><ShareCards shares={me!.shares} active={HOTELS.map(h=>size(view as any,h.id)>0)} settled={view.phase==='end'}/><PriceReference sizes={HOTELS.map(h=>size(view as any,h.id))} settings={view.settings}/></section><aside className="market-area"><section className={'market-panel '+(myTurn&&currentPhase==='buy'?'phase-active phase-market-active':'')}><div className="market-title"><div><span className="eyebrow">THE STOCK EXCHANGE</span><h3>酒店交易所</h3>{myTurn&&currentPhase==='buy'&&<span className="phase-focus-label"><Coins size={14}/>現在買股票 · BUY SHARES</span>}</div><button className="market-reference-button" onClick={()=>setPriceGuide(true)}><Landmark size={17}/><span>股價參考卡<small>PRICE GUIDE</small></span></button></div><div className="market-labels"><span>酒店集團 · HOTEL</span><span>你的持股 · SHARES</span></div>{HOTEL_PRICE_GROUPS.flat().map(id=>{const h=HOTELS[id];const n=size(view as any,h.id),p=price(view as any,h.id);return <div className={'market-row '+(!n?'inactive':'')} key={h.id} style={{'--hotel':h.colour} as React.CSSProperties}><div className="hotel-info"><Emblem c={h.id} small/><div><strong style={{color:h.colour}}>{h.zh} <small style={{color:h.colour}}>{h.name}</small></strong><span>{n?n+' 塊 · '+(n>=11?'安全 SAFE':'ACTIVE'):'尚未成立 · INACTIVE'} <span className="bank-count">餘 {view.bank[h.id]}/25</span></span></div></div><div className="hotel-metrics"><div className={'owned owned-prominent '+(me!.shares[h.id]>0?'invested':'')} aria-label={`${h.zh}：你持有 ${me!.shares[h.id]} 股 / You own ${me!.shares[h.id]} shares`}><span>你持有 <small>OWNED</small></span><strong>{me!.shares[h.id]}<small>股</small></strong></div><div className="share-price"><span>股價</span><strong>{n?money(p):'—'}</strong></div></div>{myTurn&&currentPhase==='buy'&&n>0&&<div className="purchase-line"><span>買入股數 <small>BUY</small></span><div className="stepper"><button aria-label={'減少 Reduce '+h.name} disabled={!quantities[h.id]||busy} onClick={()=>setQuantities(q=>q.map((n,c)=>c===h.id?n-1:n))}><Minus size={16}/></button><span>{quantities[h.id]}</span><button aria-label={'增加 Add '+h.name} disabled={busy||totalQ+view.bought>=3||quantities[h.id]>=view.bank[h.id]||total+p>me!.cash} onClick={()=>setQuantities(q=>q.map((n,c)=>c===h.id?n+1:n))}><Plus size={16}/></button></div></div>}</div>})}{myTurn&&currentPhase==='buy'&&<div className="cart"><div><span>{totalQ} 股 · shares <small>本回合已買 / bought: {view.bought}/3</small></span><strong>{money(total)}</strong></div><button className="primary compact" disabled={!totalQ||busy||!affordable} onClick={async()=>{await act({type:'buyAndFinish',quantities});setQuantities(Array(7).fill(0));}}>買入並完成回合 · Buy & finish turn</button></div>}</section></aside></div>{error&&<div className="error floating" role="alert"><span>{error}</span><button className="icon" onClick={()=>setError('')} aria-label="Dismiss error"><X size={17}/></button></div>}</div>}
{scorecardPreview&&<ScorecardPreview view={scorecardPreview} close={()=>setScorecardPreview(null)}/>}
{priceGuide&&<PriceReferenceDialog settings={activeSettings} sizes={view?HOTELS.map(h=>size(view as any,h.id)):Array(7).fill(0)} close={()=>setPriceGuide(false)}/>} {tutorial&&<BeginnerTutorial close={()=>setTutorial(false)}
  showRules={()=>{setTutorial(false);setRules(true);}}
  startPractice={view?undefined:()=>{setTutorial(false);practice();}}/>}
{rules&&<Rulebook settings={activeSettings} close={()=>setRules(false)}/>} {confirmLeave&&<div className="overlay"><section className="dialog leave-dialog" role="dialog" aria-modal="true"><DoorOpen size={30} className="gold"/><h2>返回大堂？<em>Leave this table?</em></h2><p>{demo.current?'練習局進度將會清除。 · Practice progress will be cleared.':'房間會保留。使用同一瀏覽器及房號可重新加入；離開不會移除座位。 · Your seat remains reserved. Rejoin using this browser and room code.'}</p><button className="primary" onClick={leave}>返回大堂 · Leave table</button><button className="secondary" onClick={()=>setConfirmLeave(false)}>繼續遊戲 · Stay</button></section></div>}</main>
}
