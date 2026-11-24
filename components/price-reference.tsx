'use client';
import {useLanguage} from "./language";
import {gameSettings,bonusAmounts,type GameSettings} from '../lib/game/settings';

import { X, Landmark, ShieldCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { HOTELS, HOTEL_PRICE_GROUPS, PRICE_REFERENCE_ROWS, priceFor } from '../lib/game/engine';

const cash = (n:number) => '$' + n.toLocaleString('en-GB');

export function PriceReference({ sizes = Array(7).fill(0),settings }: { sizes?: number[];settings?:GameSettings }) {
  const {t} = useLanguage();

  const config=gameSettings(settings), major=config.majorityMultiplier, minor=major/2;
  return <section className="price-reference" aria-label={t("股價及股東獎金參考卡", "Stockholder info card")}>
    <div className="reference-heading"><Landmark size={27} aria-hidden="true"/><div>
      <span className="eyebrow">{t("經典版股價表", "CLASSIC STOCKHOLDER INFO CARD")}</span>
      <h3>{t("股價及股東獎金參考卡", "Share prices & bonuses")}</h3>
    </div></div>
    <p className="reference-intro">{t("先在酒店所屬欄位找到格數，再向右查看每股價格及股東獎金。", "Find the chain’s size in its hotel column, then read across for the price per share and bonuses.")}</p>
    <div className="reference-table-scroll" tabIndex={0} role="region" aria-label={t("可橫向捲動的股價表", "Scrollable share price table")}>
      <table className="reference-table">
        <caption>{t("經典版 · 格數 → 每股買賣價 → 股東獎金", "Classic mode · Chain size → Share price → Shareholder bonuses")}<br/>{config.bonusMode==='standard'?t("標準", "Standard"):t("自訂", "Custom")} · {major}× / {minor}×</caption>
        <thead><tr>
          {HOTEL_PRICE_GROUPS.map((ids,tier)=><th scope="col" key={tier} className="reference-chain-column">
            <span className="reference-column-label">{t("酒店格數", "CHAIN SIZE")}</span>
            <span className="reference-brand-names">{ids.map(id=><span key={id} style={{'--hotel':HOTELS[id].colour} as CSSProperties}><i aria-hidden="true"/>{t(HOTELS[id].zh, HOTELS[id].name)}</span>)}</span>
          </th>)}
          <th scope="col">{t("每股價格", "BUY / SELL")}</th>
          <th scope="col">{t("第一大股東", "MAJORITY")}</th>
          <th scope="col">{t("第二大股東", "MINORITY")}</th>
        </tr></thead>
        <tbody>{PRICE_REFERENCE_ROWS.map(row=><tr key={row.price}>
          {HOTEL_PRICE_GROUPS.map((ids,tier)=>{
            const matching=ids.filter(id=>sizes[id]>=2&&priceFor(id,sizes[id])===row.price);
            return <td key={tier} className={matching.length?'reference-current':''}>
              <strong className="reference-size">{row.sizes[tier]}</strong>
              {matching.length>0&&<span className="reference-current-chains">{matching.map(id=><span key={id} style={{'--hotel':HOTELS[id].colour} as CSSProperties} title={`${HOTELS[id].name} · ${sizes[id]} tiles`}>{t(HOTELS[id].short, HOTELS[id].name)} {sizes[id]}</span>)}</span>}
            </td>;
          })}
          <td className="reference-share-price">{cash(row.price)}</td>
          <td>{cash(bonusAmounts(row.price,config).majority)}</td><td>{cash(bonusAmounts(row.price,config).minority)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="reference-notes">
      <p><strong>{t("獎金", "Bonuses")}</strong> {t(`第一大股東獲股價 ×${major}；第二大獲 ×${minor}。若只有一人持股，該股東可獲得兩份獎金。`, `Majority: ${major}× the share price. Minority: ${minor}×. A sole shareholder receives both.`)}</p>
      <p>{t("並列第一：合併兩份獎金平分。並列第二：平分第二獎金。並列分獎時，各人向上取整至 $100；沒有並列則按倍數派發。", "Tied majority splits both bonuses; tied minority splits the minority bonus. Round split awards up to $100; unsplit awards use the exact multiplier.")}</p>
      <p><ShieldCheck size={15}/> <strong>{t("11+ 格安全", "Safe at 11+")}</strong>　{t("41+ 格，或所有活躍酒店均安全，可於自己回合宣告最後回合。", "At 41+ tiles, or when every active chain is safe, the current player may declare the final turn.")}</p>
      <p>{t("表中賣價用於合併或結算，普通回合不能自由賣股。", "Selling prices apply during mergers and final settlement; shares cannot be sold during an ordinary turn.")}</p>
    </div>
  </section>;
}

export function PriceReferenceDialog({ sizes, settings, close }: { sizes:number[];settings?:GameSettings;close:()=>void }) {
  const {t} = useLanguage();

  return <div className="overlay" onClick={close}>
    <section className="dialog reference-dialog" role="dialog" aria-modal="true" aria-label={t("股價參考卡", "Stockholder info card")} onClick={event=>event.stopPropagation()}>
      <button className="icon close" aria-label={t("關閉參考卡", "Close price guide")} onClick={close}><X size={20}/></button>
      <PriceReference sizes={sizes} settings={settings}/>
    </section>
  </div>;
}
