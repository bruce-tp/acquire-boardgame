'use client';
import {useLanguage} from "./language";

import { useState, type CSSProperties } from 'react';
import { Layers3, ShieldCheck } from 'lucide-react';
import { HOTELS } from '../lib/game/engine';

/** Receives only the current player's portfolio, never the room's player list. */
export function ShareCards({ shares, active, settled = false }: {
  shares: number[];
  active: boolean[];
  settled?: boolean;
}) {
  const {t} = useLanguage();

  const [expanded, setExpanded] = useState<number[]>([]);
  const holdings = HOTELS.filter(h => (shares[h.id] ?? 0) > 0);
  const total = shares.reduce((sum, count) => sum + count, 0);

  return <section className="share-cards-area" aria-labelledby="share-cards-title">
    <div className="share-cards-heading">
      <div>
        <span className="eyebrow">{t("酒店股票證書", "YOUR HOTEL SHARE CERTIFICATES")}</span>
        <h3 id="share-cards-title">{t("你的股票卡牌", "Your share cards")}</h3>
      </div>
      <div className="share-cards-meta">
        <strong>{total}<span>{t(" 股", " cards")}</span></strong>
        <span><ShieldCheck size={14} />{t("只有你能看到", "Private to you")}</span>
      </div>
    </div>

    {holdings.length === 0
      ? <div className="share-cards-empty">
          <Layers3 size={30} aria-hidden="true" />
          <div><strong>{settled ? t("股票已完成結算", "Shares settled") : t("你的第一張股票，等你入手。", "Your first share awaits.")}</strong>
            <p>{settled
              ? t("股份已售出並計入最終現金。", "Shares have been liquidated into your final cash.")
              : t("成立酒店或買入股票後，卡牌會出現在這裏。", "Found a hotel or buy shares to start your collection.")}</p>
          </div>
        </div>
      : <div className="share-card-groups">
          {holdings.map(h => {
            const count = shares[h.id];
            const open = expanded.includes(h.id);
            const spreadId = `share-cards-${h.id}`;
            return <section className={'certificate-group ' + (open ? 'expanded' : '')}
              key={h.id} style={{ '--hotel': h.colour } as CSSProperties}
              aria-label={t(`${h.zh}：${count} 股`, `${h.name}: ${count} shares`)}>
              <div className="certificate-group-heading">
                <span><i aria-hidden="true" />{t(h.zh, h.name)} <strong>{count}<small>{t(" 股", " shares")}</small></strong></span>
                {count > 1 && <button type="button" className="certificate-spread-toggle"
                  aria-expanded={open} aria-controls={spreadId}
                  onClick={() => setExpanded(previous => open
                    ? previous.filter(id => id !== h.id) : [...previous, h.id])}>
                  {open ? t("疊起", "Stack") : t("展開", "Spread")}
                </button>}
              </div>
              <div className="certificate-spread" id={spreadId} role="list"
                aria-label={t(`${h.zh}股票證書`, `${h.name} share certificates`)}>
                {Array.from({ length: count }, (_, index) =>
                  <div className="stock-card" role="listitem" key={`${h.id}-${index}`}
                    style={{ '--card-index': index } as CSSProperties}
                    aria-label={t(`${h.zh}股票，第 ${index + 1} 張，共 ${count} 張，每張一股`, `${h.name}, share ${index + 1} of ${count}`)}>
                    <div className="stock-card-frame" aria-hidden="true" />
                    <div className="stock-card-top"><span>{h.mark}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
                    <span className="stock-card-caption" lang="en">SHARE CERTIFICATE</span>
                    {h.mark === 'RGH'
                      ? <img className="stock-card-logo stock-card-guesthouse" src={h.logo} alt=""/>
                      : <span className="stock-card-logo" aria-hidden="true"
                      style={{ maskImage: `url("${h.logo}")`, WebkitMaskImage: `url("${h.logo}")` }} />}
                    <strong className="stock-card-hotel">{t(h.zh, h.name)}</strong>
                    <div className="stock-card-bottom"><span className="stock-card-seal" aria-hidden="true">A</span><span><b lang="en">ONE SHARE</b></span></div>
                  </div>
                )}
              </div>
              {!active[h.id] && <p className="certificate-retained">{t("酒店暫未成立 · 保留待重建", "Inactive chain · Shares retained")}</p>}
            </section>;
          })}
        </div>}
  </section>;
}
