'use client';

import {useEffect, useRef, useState} from 'react';
import {HOTELS} from '../lib/game/engine';
import type {DeliveredPurchaseAnnouncement} from '../lib/game/purchase-announcements';
import {createPurchaseNoticeQueue, type VisiblePurchase} from '../lib/purchase-notice-queue';

export function MergerResults({incoming}: {incoming: DeliveredPurchaseAnnouncement[]}) {
  const [visible, setVisible] = useState<VisiblePurchase[]>([]);
  const queue = useRef<ReturnType<typeof createPurchaseNoticeQueue> | null>(null);

  useEffect(() => {
    const current = createPurchaseNoticeQueue(setVisible);
    queue.current = current;
    return () => { current.stop(); queue.current = null; };
  }, []);
  useEffect(() => {
    queue.current?.receive(incoming.filter(notice => notice.mergerResult));
  }, [incoming]);

  if (!visible.length) return null;

  return <section className="merger-results" aria-label="合併結果 · Merger results">
    <header className="merger-results-header">
      <h3>合併結果 <small>Merger results</small></h3>
      <button type="button" className="secondary compact"
        onClick={() => queue.current?.dismiss(visible.map(notice => notice.id))}>關閉 · Close</button>
    </header>
    <div className="merger-results-body" aria-live="polite">
      {visible.map(({id, mergerResult}) => {
        if (!mergerResult) return null;
        const {acquirer, acquired, decisions} = mergerResult;
        return <section key={id}>
          <h4>
            <span style={{color: HOTELS[acquirer].colour}}>{HOTELS[acquirer].zh}</span>
            {' 收購 · acquired '}
            <span style={{color: HOTELS[acquired].colour}}>{HOTELS[acquired].zh}</span>
          </h4>
          {decisions.length ? <div className="merger-results-table">
            <table>
              <thead><tr>
                <th scope="col">股東 · Player</th>
                <th scope="col">原有 · Held</th>
                <th scope="col">賣出 · Sold</th>
                <th scope="col">舊股換新股 · Swap</th>
                <th scope="col">保留 · Kept</th>
              </tr></thead>
              <tbody>{decisions.map((decision, index) => <tr key={index}>
                <th scope="row">{decision.playerName}</th>
                <td>{decision.starting}</td>
                <td>{decision.sold ?? '—'}</td>
                <td>{decision.received === null ? '—' : <><span style={{color: HOTELS[acquired].colour}}>{decision.received * 2}</span>
                  {' → '}<span style={{color: HOTELS[acquirer].colour}}>{decision.received}</span></>}</td>
                <td>{decision.kept}</td>
              </tr>)}</tbody>
            </table>
          </div> : <p>冇玩家持有被收購酒店股份 · No players held shares in the acquired hotel.</p>}
        </section>;
      })}
    </div>
  </section>;
}
