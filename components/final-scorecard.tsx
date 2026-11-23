import type {CSSProperties} from 'react';
import {HOTELS, type publicState} from '../lib/game/engine';

type View = ReturnType<typeof publicState>;
const money = (n:number|undefined) => n === undefined ? '隱藏 · Hidden' : '$' + n.toLocaleString('en-GB');

export function FinalScorecard({view}:{view:View}){
  const entries=view.players.map((player,index)=>({player,score:view.finalScores?.[index]}))
    .sort((a,b)=>(b.player.cash??0)-(a.player.cash??0));
  const sharesByHotel=HOTELS.map(hotel=>
    entries.map(({score})=>score?.hotels.find(row=>row.id===hotel.id)?.shares??0),
  );

  return <section aria-label="最終計分表 · Final scores">
    <h3>最終計分表 <small>Final scores</small></h3>
    {view.finalScores&&view.players.length===2&&<p className="muted">
      排名只計玩家，股東獎金可受市場虛擬持股影響。 · Ranks compare players. The market’s virtual holding can affect bonuses.
    </p>}
    {entries.map(({player,score},index)=><section className="holdings-panel" key={index}>
      <h4>{player.name}</h4>
      {score&&<>
        <p>結算前現金 · Cash before settlement <strong>{money(score.cashBeforeSettlement)}</strong></p>
        <div className="holdings-scroll">
          <table>
            <thead><tr>
              <th>酒店 · Hotel</th><th>持股 · Shares</th><th scope="col">持股排名 · Rank</th><th>股價 · Price</th>
              <th>套現 · Proceeds</th><th>獎金 · Bonus</th>
            </tr></thead>
            <tbody>{score.hotels.map(hotel=>{
              const shareCounts=sharesByHotel[hotel.id];
              const rank=1+shareCounts.filter(count=>count>hotel.shares).length;
              const ordinal=['1st','2nd','3rd'][rank-1]??`${rank}th`;
              const tied=shareCounts.filter(count=>count===hotel.shares).length>1;
              return <tr key={hotel.id} className="scorecard-hotel-row" style={{'--hotel':HOTELS[hotel.id].colour} as CSSProperties}>
                <th scope="row">{HOTELS[hotel.id].zh} · {HOTELS[hotel.id].name}</th>
                <td>{hotel.shares}</td>
                <td className="scorecard-rank">
                  {hotel.shares>0?<>{tied?'並列第':'第'} {rank}<small>{tied?'Tied ':''}{ordinal}</small></>:'—'}
                </td>
                <td>{money(hotel.sharePrice)}</td>
                <td>{money(hotel.sale)}</td><td>{money(hotel.bonus)}</td>
              </tr>;
            })}</tbody>
          </table>
        </div>
      </>}
      <p>最終總額 · Final total <strong>{money(player.cash)}</strong></p>
    </section>)}
    {!view.finalScores&&<p>此局只保留最終總額。 · Only final totals were saved for this game.</p>}
  </section>;
}
