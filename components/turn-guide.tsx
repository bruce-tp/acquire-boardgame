'use client';
import {useLanguage} from "./language";
import {Building2,Coins,Check} from 'lucide-react';

export function TurnGuide({phase,bought,mine,selected,cartCount=0}:{phase:string;bought:number;mine:boolean;selected?:string|null;cartCount?:number}){
  const {t} = useLanguage();

  if(phase==='end'||phase==='lobby')return null;
  const placing=phase!=='buy';
  const resolving=phase!=='place'&&phase!=='buy';
  return <div className="turn-guide">
    <ol className="turn-guide-steps">
      <li className={(placing&&mine?'current ':'')+(!placing?'completed':'')} aria-current={placing?'step':undefined}>
        <span className="turn-step-number">{placing?'1':<Check size={21}/>}</span>
        <div><strong>{t("放置地塊", "Place a tile")}</strong><p>{t(resolving?'地塊已放置，先處理酒店成立或合併。':placing?'在棋盤上選擇一個可用的專屬地塊，再按右上方的「確認放置」。':'地塊已放好，相關酒店事件已處理。', resolving?'Tile placed: resolve the founding or merger before buying.':placing?'Choose an available private building spot on the board, then confirm above.':'Tile placement and hotel events are complete.')}</p>{placing&&!resolving&&selected&&<b className="turn-selected-tile">{t(`已選 ${selected}`, `Selected ${selected}`)}</b>}</div>
        <span className="turn-step-state">{placing ? t("先完成", "Do first") : t("已完成", "Complete")}</span>
      </li>
      <li className={!placing&&mine?'current':''} aria-current={!placing?'step':undefined}>
        <span className="turn-step-number">2</span>
        <div><strong>{t("買股票", "Buy shares")}<em>{t("可跳過", "Optional")}</em></strong><p>{t(!placing&&cartCount>0?`已選 ${cartCount} 股：確認買入即完成回合；亦可取消選股後跳過買股。`:!placing&&bought>=3?'已買滿 3 股，按右上「完成回合」。':'可買 0–3 股，確認買入即完成回合；若不購買，請按「完成回合」。', !placing&&cartCount>0?'Confirm to buy and finish your turn, or clear the selection to skip buying.':!placing&&bought>=3?'All three shares bought. Select Finish turn above.':'Buy up to 3 shares and finish automatically, or select Finish turn without buying.')}</p>{!placing&&<b className="turn-bought-count">{t(`本回合已買 ${bought} / 3 股`, `${bought} / 3 bought`)}</b>}</div>
      </li>
    </ol>

  </div>;
}
