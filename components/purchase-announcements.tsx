'use client';
import {useEffect, useRef, useState} from 'react';
import {HOTELS} from '../lib/game/engine';
import type {DeliveredPurchaseAnnouncement} from '../lib/game/purchase-announcements';
import {createPurchaseNoticeQueue, type VisiblePurchase} from '../lib/purchase-notice-queue';

export function PurchaseAnnouncements({roomCode, incoming}: {
  roomCode: string;
  incoming: DeliveredPurchaseAnnouncement[];
}) {
  const [visible, setVisible] = useState<VisiblePurchase[]>([]);
  const queue = useRef<ReturnType<typeof createPurchaseNoticeQueue> | null>(null);
  useEffect(() => {
    setVisible([]);
    const current = createPurchaseNoticeQueue(setVisible);
    queue.current = current;
    return () => { current.stop(); queue.current = null; };
  }, [roomCode]);
  useEffect(() => { queue.current?.receive(incoming); }, [roomCode, incoming]);
  if (!visible.length) return null;
  return <section className="purchase-notice-tray" aria-label="交易公告 · Table notifications"
    aria-live="polite" aria-relevant="additions" aria-atomic="false">
    {visible.map(notice => <article className="purchase-notice" key={notice.id}>
      {notice.bonus ? <>
        <header><strong style={{color:HOTELS[notice.bonus.chain].colour}}>{HOTELS[notice.bonus.chain].zh}</strong>
          <span>股東獎金 · SHAREHOLDER BONUSES</span></header>
        <ul>{notice.bonus.payouts.map((payout,index)=><li key={index}>
          <span>{payout.playerName}</span>
          <strong className="purchase-line-cost">+${payout.amount.toLocaleString('en-GB')}</strong>
        </li>)}</ul>
      </> : <>
      <header><strong>{notice.playerName}</strong><span>買股公告 · PURCHASE</span></header>
      {notice.items.length ? <ul>{notice.items.map(item => <li key={item.chain}>
        <i style={{background: HOTELS[item.chain].colour}} aria-hidden="true"/>
        <span title={HOTELS[item.chain].name}>{HOTELS[item.chain].zh}</span>
        <b aria-label={`${item.quantity} shares`}>{item.quantity} 股</b>
        <span className="purchase-line-cost">${(item.quantity * item.unitPrice).toLocaleString('en-GB')}</span>
      </li>)}</ul> : <p>本回合冇買股 <small>No shares bought this turn</small></p>}
      <footer><span>總花費 · Total spent</span><strong>${notice.total.toLocaleString('en-GB')}</strong></footer>
      </>}
      <div className="purchase-notice-lifetime" aria-hidden="true"
        style={{animationDuration: `${notice.remainingMs}ms`}}/>
    </article>)}
  </section>;
}
