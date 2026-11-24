import {useState, type CSSProperties} from 'react';
import {useLanguage} from './language';
import {BoardTile} from './board-tile';
import {applyAction, createGame, HOTELS, priceFor, size} from '../lib/game/engine';
import {bonusAmounts} from '../lib/game/settings';

const peninsula = 1;
const fourSeasons = 2;
const mergerTile = 3 * 12 + 4;
const exampleSize = 4;
const sharePrice = priceFor(fourSeasons, exampleSize);
const awards = bonusAmounts(sharePrice);
const money = (cash: number) => '$' + cash.toLocaleString('en-GB');

function MergerExample() {
  const {t} = useLanguage();
  const [survivor, setSurvivor] = useState<number | null>(null);
  const game = createGame('RULES', 'sample', 'Investor');
  for (const row of [2, 3]) {
    for (const column of [2, 3]) game.board[row * 12 + column] = peninsula;
    for (const column of [5, 6]) game.board[row * 12 + column] = fourSeasons;
  }
  game.phase = 'place';
  game.players[0].hand = [mergerTile];
  applyAction(game, 0, {type:'place', tile:mergerTile});
  const candidates = game.pending.map(id => HOTELS[id]);
  if (survivor !== null) applyAction(game, 0, {type:'survivor', chain:survivor});
  return <figure className="rules-merger-example">
    <figcaption>{t('棋盤示例：在 5D 放置地塊後，兩間 4 格酒店相連。', 'Board example: placing 5D connects two four-tile hotels.')}</figcaption>
    <div className="board-frame tutorial-board rules-example-board" style={{gridTemplateColumns:'24px repeat(5,minmax(0,1fr))'}}>
      <span className="grid-label corner" aria-hidden="true">A</span>
      {[3, 4, 5, 6, 7].map(col => <span key={col} className="grid-label">{col}</span>)}
      {[2, 3].map(row => <div className="board-row" key={row}>
        <span className="grid-label">{row === 2 ? 'C' : 'D'}</span>
        {[2, 3, 4, 5, 6].map(col => {
          const tile = row * 12 + col;
          return <BoardTile key={tile} tile={tile} value={game.board[tile]} plan={null}
            playable={false} selected={false} latest={tile === mergerTile}/>;
        })}
      </div>)}
    </div>
    <p>{t('試按其中一間酒店，看看選擇後棋盤如何變化。', 'Choose a hotel to see how the board changes.')}</p>
    <div className="rules-choice-buttons">
      {candidates.map(hotel => <button className="secondary compact" key={hotel.id}
        style={{color:hotel.colour}} type="button" aria-pressed={survivor === hotel.id}
        onClick={() => setSurvivor(hotel.id)}>
        {t(hotel.zh, hotel.name)}{survivor === null && t('（4 格）', ' (4 tiles)')}
      </button>)}
      {survivor !== null && <button type="button" className="secondary compact"
        onClick={() => setSurvivor(null)}>{t('重設示例', 'Reset example')}</button>}
    </div>
    {survivor !== null && <p role="status" style={{color:HOTELS[survivor].colour}}>
      {t(`${HOTELS[survivor].zh}保留，合併後共有 ${size(game, survivor)} 格。`,
        `${HOTELS[survivor].name} survives with ${size(game, survivor)} tiles.`)}
    </p>}
  </figure>;
}

export function RulebookPreview() {
  const {t} = useLanguage();
  return <div className="rules-reference">
    <section className="rules-recap">
      <h3>{t('一回合速查', 'Your turn at a glance')}</h3>
      <p>{t('放置一個專屬地塊，處理成立、擴展或合併。接着可買入已成立酒店的股票，合計最多 3 股，然後結束回合。', 'Place one private tile and resolve any founding, expansion or merger. Then optionally buy up to three shares in total in active hotels and finish your turn.')}</p>
    </section>

    <section>
      <h3>{t('兩間酒店同樣大，誰收購誰？', 'Who survives a merger when hotels tie?')}</h3>
      <p>{t('以放置地塊前的酒店格數比較，最大的一間保留。若有多間並列最大，由放置地塊的玩家選擇其中一間保留。持股數量不影響這個決定。', 'Compare hotel sizes before placement. The largest survives. If several tie for largest, the player who placed the tile chooses which of them survives. Shareholdings do not affect that choice.')}</p>
      <MergerExample/>
      <p>{t('一次收購多間酒店時，依照各間合併前的格數，由大至小處理。若被收購的酒店格數相同，由放置地塊的玩家決定先處理哪一間。', 'When several hotels are acquired, resolve them in descending order of their pre-merger sizes. The player who placed the tile decides the order between tied acquisitions.')}</p>
    </section>

    <section>
      <h3>{t('有專屬地塊，為甚麼仍然不能放？', 'Why is a private tile blocked?')}</h3>
      <ul>
        <li><strong>{t('永久禁放', 'Permanently blocked')}</strong> {t('若一格會把兩間或以上的安全酒店連在一起，就不能放置。酒店達到 11 格即屬安全。即使是透過相連的獨立建築接通，也一樣禁止。回合結束時，系統會移除這類地塊，並在有剩餘地塊時補發。', 'You cannot connect two or more safe hotels, even through a group of independent buildings. A hotel is safe at 11 tiles. The game discards these blocked tiles at the end of your turn and replaces them while tiles remain.')}</li>
        <li><strong>{t('暫時禁放', 'Temporarily blocked')}</strong> {t('七間酒店均已成立時，不能放置會成立第八間酒店的地塊。該地塊會保留，日後仍可能可用。', 'When all seven hotels are active, a tile that would found an eighth hotel is blocked. You keep it and may be able to use it later.')}</li>
        <li>{t('若沒有任何可放置的地塊，可直接進入購買股票階段。若所有玩家一整輪都無法放置，遊戲會自動結算。', 'If none of your tiles can be placed, skip to buying shares. If nobody can place a tile for a full round, the game settles automatically.')}</li>
      </ul>
    </section>

    <section>
      <h3>{t('為甚麼要爭第一或第二大股東？', 'Why aim for the largest or second-largest holding?')}</h3>
      <p>{t('股東獎金按同一間酒店的持股數量排名。被收購時，只有被收購的酒店按合併前股價發放獎金。終局時，每間仍在營運的酒店會按最終股價發放獎金，股票也會另行兌現。', 'Bonuses are based on shareholdings in each hotel. In a merger, the acquired hotel pays bonuses at its pre-merger share price. At game end, every active hotel pays bonuses at its final price, and its shares are cashed out separately.')}</p>
      <p style={{color:HOTELS[fourSeasons].colour} as CSSProperties}>{t(
        `以標準房間的四季酒店為例：4 格時每股 ${money(sharePrice)}，第一大股東可獲 ${money(awards.majority)}，第二大股東可獲 ${money(awards.minority)}。`,
        `In a standard room, Four Seasons at four tiles is worth ${money(sharePrice)} per share. The largest holder receives ${money(awards.majority)} and the second-largest receives ${money(awards.minority)}.`)}</p>
      <ul>
        <li>{t('標準房間的獎金為每股股價的 10 倍及 5 倍。自訂房間以房間設定為準。', 'Standard bonuses are 10× and 5× the share price. Custom rooms use their chosen multipliers.')}</li>
        <li>{t('唯一股東可獲兩份獎金。並列第一者平分兩份獎金，並列第二者平分第二份。平分後，每人的獎金向上取整至 $100 的倍數。', 'A sole holder receives both bonuses. Tied leaders share both. Tied runners-up share the second bonus. Round each split payment up to a multiple of $100.')}</li>
        <li>{t('兩人對局有剩餘地塊時，系統會抽取一格，以欄號作為市場的持股數，參與獎金排名。市場取得的獎金不歸任何玩家。', 'In a two-player game, if tiles remain, the game draws a tile and uses its column number as the market’s holding for bonus ranking. Any bonus won by the market goes to no player.')}</li>
      </ul>
    </section>

    <section>
      <h3>{t('被收購後，手上的股票怎麼辦？', 'What can you do with acquired shares?')}</h3>
      <ul>
        <li>{t('賣出：按被收購酒店合併前的每股價格套現。', 'Sell at the acquired hotel’s pre-merger share price.')}</li>
        <li>{t('換股：每 2 股被收購酒店股票可換 1 股收購方股票，須有庫存。', 'Exchange two acquired shares for one share in the surviving hotel, subject to supply.')}</li>
        <li>{t('保留：未賣出或換出的股票可留待酒店重新成立。若終局時該酒店仍未成立，股票價值為 $0。', 'Keep unallocated shares in case the hotel is founded again. They are worth $0 if the hotel is inactive at game end.')}</li>
      </ul>
      <p>{t('同一次收購可混合使用三種方式。持股玩家由放置地塊者開始，按座位順序處理，因此換股庫存可能先被其他玩家用完。', 'You can mix all three options. Shareholders act in seat order starting with the tile placer, so earlier players may use up the shares available for exchange.')}</p>
    </section>

    <section>
      <h3>{t('何時可以結束遊戲？', 'When can you end the game?')}</h3>
      <p>{t('若任何酒店達到 41 格，或場上至少有一間酒店且所有已成立酒店均達 11 格，輪到你的放置或購股階段可宣告最後回合。完成該回合後結算。現金、股東獎金及股票出售收入合計最高者獲勝，同額者並列。', 'If any hotel reaches 41 tiles, or at least one is active and all active hotels have at least 11 tiles, you may declare the final turn during placement or buying. Finish that turn, then settle. Cash plus bonuses and share proceeds determines the winner. Equal totals share the win.')}</p>
    </section>
  </div>;
}
