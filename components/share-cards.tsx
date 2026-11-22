'use client';

import { useState, type CSSProperties } from 'react';
import { Layers3, ShieldCheck } from 'lucide-react';
import { HOTELS } from '../lib/game/engine';

/** Receives only the current player's portfolio, never the room's player list. */
export function ShareCards({ shares, active, settled = false }: {
  shares: number[];
  active: boolean[];
  settled?: boolean;
}) {
  const [expanded, setExpanded] = useState<number[]>([]);
  const holdings = HOTELS.filter(h => (shares[h.id] ?? 0) > 0);
  const total = shares.reduce((sum, count) => sum + count, 0);

  return <section className="share-cards-area" aria-labelledby="share-cards-title">
    <div className="share-cards-heading">
      <div>
        <span className="eyebrow">YOUR HOTEL SHARE CERTIFICATES</span>
        <h3 id="share-cards-title">你的股票卡牌 <small>Your share cards</small></h3>
      </div>
      <div className="share-cards-meta">
        <strong>{total}<span> 股 · {total} cards</span></strong>
        <span><ShieldCheck size={14} />只有你能看到 · Private to you</span>
      </div>
    </div>

    {holdings.length === 0
      ? <div className="share-cards-empty">
          <Layers3 size={30} aria-hidden="true" />
          <div><strong>{settled ? '股票已完成結算' : '你的第一張股票，等你入手。'}</strong>
            <p>{settled
              ? '股份已售出並計入最終現金。 · Shares have been liquidated into your final cash.'
              : '成立酒店或買入股票後，卡牌會出現在這裏。 · Found a hotel or buy shares to start your collection.'}</p>
          </div>
        </div>
      : <div className="share-card-groups">
          {holdings.map(h => {
            const count = shares[h.id];
            const open = expanded.includes(h.id);
            const spreadId = `share-cards-${h.id}`;
            return <section className={'certificate-group ' + (open ? 'expanded' : '')}
              key={h.id} style={{ '--hotel': h.colour } as CSSProperties}
              aria-label={`${h.zh}：${count} 股 / ${count} shares`}>
              <div className="certificate-group-heading">
                <span><i aria-hidden="true" />{h.zh} <strong>{count}<small> 股</small></strong></span>
                {count > 1 && <button type="button" className="certificate-spread-toggle"
                  aria-expanded={open} aria-controls={spreadId}
                  onClick={() => setExpanded(previous => open
                    ? previous.filter(id => id !== h.id) : [...previous, h.id])}>
                  {open ? '疊起 · Stack' : '展開 · Spread'}
                </button>}
              </div>
              <div className="certificate-spread" id={spreadId} role="list"
                aria-label={`${h.name} share certificates`}>
                {Array.from({ length: count }, (_, index) =>
                  <div className="stock-card" role="listitem" key={`${h.id}-${index}`}
                    style={{ '--card-index': index } as CSSProperties}
                    aria-label={`${h.zh}股票，第 ${index + 1} 張，共 ${count} 張，每張一股 / ${h.name}, share ${index + 1} of ${count}`}>
                    <div className="stock-card-frame" aria-hidden="true" />
                    <div className="stock-card-top"><span>{h.mark}</span><span>{String(index + 1).padStart(2, '0')}</span></div>
                    <span className="stock-card-caption">SHARE CERTIFICATE</span>
                    <span className="stock-card-logo" aria-hidden="true"
                      style={{ maskImage: `url("${h.logo}")`, WebkitMaskImage: `url("${h.logo}")` }} />
                    <strong className="stock-card-hotel">{h.zh}</strong>
                    <span className="stock-card-english">{h.name}</span>
                    <div className="stock-card-bottom"><span className="stock-card-seal" aria-hidden="true">A</span><span><b>1 股</b><small>ONE SHARE</small></span></div>
                  </div>
                )}
              </div>
              {!active[h.id] && <p className="certificate-retained">酒店暫未成立 · 保留待重建<br />Inactive chain · Shares retained</p>}
            </section>;
          })}
        </div>}
  </section>;
}
