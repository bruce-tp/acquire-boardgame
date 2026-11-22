'use client';
import {Building2,Coins,Check} from 'lucide-react';

export function TurnGuide({phase,bought,mine,selected,cartCount=0}:{phase:string;bought:number;mine:boolean;selected?:string|null;cartCount?:number}){
  if(phase==='end'||phase==='lobby')return null;
  const placing=phase!=='buy';
  const resolving=phase!=='place'&&phase!=='buy';
  return <div className="turn-guide">
    <ol className="turn-guide-steps">
      <li className={(placing&&mine?'current ':'')+(!placing?'completed':'')} aria-current={placing?'step':undefined}>
        <span className="turn-step-number">{placing?'1':<Check size={21}/>}</span>
        <div><strong>放置地塊 <span>Place a tile</span></strong><p>{resolving?'地塊已放置，先處理酒店成立或合併。':placing?'選下方手牌或版圖高亮位置，再按右上「確認放置」。':'地塊已放好，相關酒店事件已處理。'}<br/>{resolving?'Tile placed: resolve the founding or merger before buying.':placing?'Select a tile below or on the map, then confirm above.':'Tile placement and hotel events are complete.'}</p>{placing&&!resolving&&selected&&<b className="turn-selected-tile">已選 {selected} · Selected {selected}</b>}</div>
        <span className="turn-step-state">{placing?'先完成':'已完成'}</span>
      </li>
      <li className={!placing&&mine?'current':''} aria-current={!placing?'step':undefined}>
        <span className="turn-step-number">2</span>
        <div><strong>買股票 <span>Buy shares</span><em>可跳過 · Optional</em></strong><p>{!placing&&cartCount>0?`已選 ${cartCount} 股：確認買入即完成回合；亦可取消選股後跳過買股。`:!placing&&bought>=3?'已買滿 3 股，按右上「完成回合」。':'可買 0–3 股，確認買入即完成回合；唔買請按「完成回合」。'}<br/>{!placing&&cartCount>0?'Confirm to buy and finish your turn, or clear the selection to skip buying.':!placing&&bought>=3?'All three shares bought. Select Finish turn above.':'Buy up to 3 shares and finish automatically, or select Finish turn without buying.'}</p>{!placing&&<b className="turn-bought-count">本回合已買 {bought} / 3 股 · {bought} / 3 bought</b>}</div>
      </li>
    </ol>

  </div>;
}
