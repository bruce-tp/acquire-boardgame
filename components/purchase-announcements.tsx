'use client';
import {useLanguage} from "./language";
import {useEffect, useRef, useState, type CSSProperties} from 'react';
import {HOTELS} from '../lib/game/engine';
import type {DeliveredPurchaseAnnouncement} from '../lib/game/purchase-announcements';
import {createPurchaseNoticeQueue, type VisiblePurchase} from '../lib/purchase-notice-queue';

export function PurchaseAnnouncements({roomCode, incoming}: {
  roomCode: string;
  incoming: DeliveredPurchaseAnnouncement[];
}) {
  const {t} = useLanguage();

  const [visible, setVisible] = useState<VisiblePurchase[]>([]);
  const queue = useRef<ReturnType<typeof createPurchaseNoticeQueue> | null>(null);
  useEffect(() => {
    setVisible([]);
    const current = createPurchaseNoticeQueue(setVisible);
    queue.current = current;
    return () => { current.stop(); queue.current = null; };
  }, [roomCode]);
  useEffect(() => { queue.current?.receive(incoming.filter(notice=>!notice.mergerResult)); }, [roomCode, incoming]);
  if (!visible.length) return null;
  return <section className="purchase-notice-tray" aria-label={t("交易公告", "Table notifications")}
    aria-live="polite" aria-relevant="additions" aria-atomic="false">
    {visible.map(notice => {
      const hotel = notice.founding ? HOTELS[notice.founding.chain] : undefined;
      const logoMask = hotel ? `url("${hotel.logo}")` : undefined;
      return <article className="purchase-notice" key={notice.id}>
      {notice.founding && hotel ? <>
        <p style={{display:'flex', alignItems:'center', flexWrap:'wrap', gap:8}}>
          <span style={{overflowWrap:'anywhere'}}><strong>{notice.playerName}</strong> {t("成立了", "founded")} <strong style={{color:hotel.colour}}>{t(hotel.zh, hotel.name)}</strong></span>
          <span className="emblem small" style={{'--hotel':hotel.colour, padding:4, width:56, height:36} as CSSProperties} aria-hidden="true">
            {hotel.mark === 'RGH'
              ? <img className="guesthouse-emblem-art" src="/hotels/regent-guesthouse-colour.webp" alt=""/>
              : <span className="hotel-logo" style={{maskImage:logoMask, WebkitMaskImage:logoMask}}/>}
          </span>
        </p>
        <footer><span>{t("創辦獎勵", "Founder’s reward")}</span>
          <strong>{notice.founding.reward.type === 'share'
            ? t("1 股創辦人股票", "1 founder’s share")
            : `$${notice.founding.reward.amount.toLocaleString('en-GB')}`}</strong></footer>
      </> : notice.bonus ? <>
        <header><strong style={{color:HOTELS[notice.bonus.chain].colour}}>{t(HOTELS[notice.bonus.chain].zh, HOTELS[notice.bonus.chain].name)}</strong>
          <span>{t("股東獎金", "SHAREHOLDER BONUSES")}</span></header>
        <ul>{notice.bonus.payouts.map((payout,index)=><li key={index}>
          <span>{payout.playerName}</span>
          <strong className="purchase-line-cost">+${payout.amount.toLocaleString('en-GB')}</strong>
        </li>)}</ul>
      </> : <>
      <header><strong>{notice.playerName}</strong><span>{t("買股公告", "PURCHASE")}</span></header>
      {notice.items.length ? <ul>{notice.items.map(item => <li key={item.chain}>
        <i style={{background: HOTELS[item.chain].colour}} aria-hidden="true"/>
        <span style={{color: HOTELS[item.chain].colour}} title={HOTELS[item.chain].name}>{t(HOTELS[item.chain].zh, HOTELS[item.chain].name)}</span>
        <b aria-label={`${item.quantity} shares`}>{item.quantity} {t("股", "shares")}</b>
        <span className="purchase-line-cost">${(item.quantity * item.unitPrice).toLocaleString('en-GB')}</span>
      </li>)}</ul> : <p>{t("本回合未購買股票", "No shares bought this turn")}</p>}
      <footer><span>{t("總花費", "Total spent")}</span><strong>${notice.total.toLocaleString('en-GB')}</strong></footer>
      </>}
      <div className="purchase-notice-lifetime" aria-hidden="true"
        style={{animationDuration: `${notice.remainingMs}ms`}}/>
    </article>;})}
  </section>;
}
