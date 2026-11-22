'use client';
import {gameSettings,bonusAmounts,type GameSettings} from '../lib/game/settings';

import { X, Landmark, ShieldCheck } from 'lucide-react';
import type { CSSProperties } from 'react';
import { HOTELS, HOTEL_PRICE_GROUPS, PRICE_REFERENCE_ROWS, priceFor } from '../lib/game/engine';

const cash = (n:number) => '$' + n.toLocaleString('en-GB');

export function PriceReference({ sizes = Array(7).fill(0),settings }: { sizes?: number[];settings?:GameSettings }) {
  const config=gameSettings(settings), major=config.majorityMultiplier, minor=major/2;
  return <section className="price-reference" aria-label="股價及股東獎金參考卡 · Stockholder info card">
    <div className="reference-heading"><Landmark size={27} aria-hidden="true"/><div>
      <span className="eyebrow">CLASSIC STOCKHOLDER INFO CARD</span>
      <h3>股價及股東獎金參考卡 <small>Share prices & bonuses</small></h3>
    </div></div>
    <p className="reference-intro">先喺酒店所屬欄搵格數，再向右睇每股價格及股東獎金。<br/>
      Find the chain’s size in its hotel column, then read across for the price per share and bonuses.</p>
    <div className="reference-table-scroll" tabIndex={0} role="region" aria-label="可橫向捲動的股價表 · Scrollable share price table">
      <table className="reference-table">
        <caption>Classic 模式 · 格數 → 每股買賣價 → 第一及第二大股東獎金<br/>Classic mode · Chain size → Share price → Majority and minority bonuses<br/>{config.bonusMode==='standard'?'標準 Standard':'自訂 Custom'} · {major}× / {minor}×</caption>
        <thead><tr>
          {HOTEL_PRICE_GROUPS.map((ids,tier)=><th scope="col" key={tier} className="reference-chain-column">
            <span className="reference-column-label">酒店格數 <small>CHAIN SIZE</small></span>
            <span className="reference-brand-names">{ids.map(id=><span key={id} style={{'--hotel':HOTELS[id].colour} as CSSProperties}><i aria-hidden="true"/>{HOTELS[id].zh}</span>)}</span>
          </th>)}
          <th scope="col">每股價格<small>BUY / SELL</small></th>
          <th scope="col">第一大股東<small>MAJORITY</small></th>
          <th scope="col">第二大股東<small>MINORITY</small></th>
        </tr></thead>
        <tbody>{PRICE_REFERENCE_ROWS.map(row=><tr key={row.price}>
          {HOTEL_PRICE_GROUPS.map((ids,tier)=>{
            const matching=ids.filter(id=>sizes[id]>=2&&priceFor(id,sizes[id])===row.price);
            return <td key={tier} className={matching.length?'reference-current':''}>
              <strong className="reference-size">{row.sizes[tier]}</strong>
              {matching.length>0&&<span className="reference-current-chains">{matching.map(id=><span key={id} style={{'--hotel':HOTELS[id].colour} as CSSProperties} title={`${HOTELS[id].name} · ${sizes[id]} tiles`}>{HOTELS[id].short} {sizes[id]}</span>)}</span>}
            </td>;
          })}
          <td className="reference-share-price">{cash(row.price)}</td>
          <td>{cash(bonusAmounts(row.price,config).majority)}</td><td>{cash(bonusAmounts(row.price,config).minority)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <div className="reference-notes">
      <p><strong>獎金 · Bonuses</strong> 第一大股東獲股價 ×{major}；第二大獲 ×{minor}。只有一人持股，兩份獎金都歸佢。<br/>Majority: {major}× the share price; minority: {minor}×. A sole shareholder receives both.</p>
      <p>並列第一：合併兩份獎金平分。並列第二：平分第二獎金。並列分獎時，各人向上取整至 $100；沒有並列則按倍數派發。<br/>Tied majority splits both bonuses; tied minority splits the minority bonus. Round split awards up to $100; unsplit awards use the exact multiplier.</p>
      <p><ShieldCheck size={15}/> <strong>11+ 格安全 · Safe at 11+</strong>　41+ 格，或所有活躍酒店均安全，可於自己回合宣告最後回合。<br/>At 41+ tiles, or when every active chain is safe, the current player may declare the final turn.</p>
      <p>表中賣價用於合併或結算，普通回合不能自由賣股。<br/>Selling prices apply during mergers and final settlement; shares cannot be sold during an ordinary turn.</p>
    </div>
  </section>;
}

export function PriceReferenceDialog({ sizes, settings, close }: { sizes:number[];settings?:GameSettings;close:()=>void }) {
  return <div className="overlay" onClick={close}>
    <section className="dialog reference-dialog" role="dialog" aria-modal="true" aria-label="股價參考卡 · Stockholder info card" onClick={event=>event.stopPropagation()}>
      <button className="icon close" aria-label="關閉參考卡 · Close price guide" onClick={close}><X size={20}/></button>
      <PriceReference sizes={sizes} settings={settings}/>
    </section>
  </div>;
}
