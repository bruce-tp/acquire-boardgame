'use client';

import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {applyAction, HOTELS, label, price, priceFor, size, type Action, type Game} from '../lib/game/engine.ts';
import {createTutorialGame, FOUNDING_TILE, HOSHINO, MANDARIN, MERGER_TILE, PENINSULA, PLACEMENT_TILE, type TutorialExercise} from '../lib/game/tutorial.ts';

const lessons = [
  ['place', '放置地塊', 'Placing a tile'],
  ['found', '成立酒店', 'Founding a hotel'],
  ['merge', '合併與換股', 'Mergers and shares'],
  ['settle', '終局結算', 'Final scoring'],
] as const;

const money = (amount: number) => '$' + amount.toLocaleString('en-GB');
const visibleTiles = [26, 27, 28, 29, 30, 38, 39, 40, 41, 42, 50, 51, 52, 53, 54];

function Explanation({zh, en}: {zh: string; en: string}) {
  return <p className="tutorial-explanation">{zh}<small lang="en">{en}</small></p>;
}

function LessonBoard({game, target, selected, onSelect}: {
  game: Game;
  target: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return <div className="tutorial-board" aria-label="練習棋盤 · Practice board">
    {visibleTiles.map(tile => {
      const value = game.board[tile];
      const hotel = HOTELS[value];
      const available = game.phase === 'place' && game.turn === 0 && tile === target;
      const classes = 'tutorial-tile' + (hotel ? ' tutorial-hotel-tile' : value === 7 ? ' tutorial-independent' : '');
      const style = hotel ? {color: hotel.colour} : undefined;
      return available
        ? <button key={tile} type="button" className={'tutorial-tile tutorial-target' + (selected ? ' selected' : '')}
            aria-pressed={selected} onClick={onSelect}>{label(tile)}<small>可落 · Playable</small></button>
        : <div key={tile} className={classes} style={style}>
            {label(tile)}
            {hotel && <small>{hotel.short}</small>}
            {value === 7 && <small>獨立 · Solo</small>}
          </div>;
    })}
  </div>;
}

export function BeginnerTutorial({close, showRules, startPractice}: {
  close: () => void;
  showRules: () => void;
  startPractice?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [lesson, setLesson] = useState<TutorialExercise>('place');
  const [game, setGame] = useState(() => createTutorialGame('place'));
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [sell, setSell] = useState(0);
  const [trade, setTrade] = useState(0);
  const [error, setError] = useState('');
  const player = game.players[0];
  const lessonIndex = lessons.findIndex(([id]) => id === lesson);
  const target = {place: PLACEMENT_TILE, found: FOUNDING_TILE, merge: MERGER_TILE, settle: -1}[lesson];

  useEffect(() => {dialog.current?.showModal();}, []);

  function openLesson(id: TutorialExercise) {
    setLesson(id);
    setGame(createTutorialGame(id));
    setSelected(false);
    setQuantity(0);
    setSell(0);
    setTrade(0);
    setError('');
  }

  function advance(action: Action) {
    const next = structuredClone(game);
    try {
      applyAction(next, 0, action);
      if (action.type === 'dispose' && next.phase === 'dispose') {
        // Jamie holds the only other acquired shares in this exercise.
        applyAction(next, 1, {type: 'dispose', sell: 0, trade: 0});
      }
      setGame(next);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  const placing = game.phase === 'place' && game.turn === 0;
  const founded = lesson === 'found' && game.phase === 'place' && game.turn !== 0;
  const disposed = lesson === 'merge' && game.phase === 'buy';
  const mergerPrice = game.merger ? priceFor(HOSHINO, game.merger.sizes[HOSHINO]) : 0;
  const award = game.merger?.awards?.[0]?.amount ?? 0;
  const retained = player.shares[HOSHINO] - sell - trade * 2;
  const score = game.finalScores?.[0];
  const mandarin = score?.hotels.find(hotel => hotel.id === MANDARIN);

  return <dialog ref={dialog} className="dialog beginner-tutorial" aria-labelledby="beginner-tutorial-title" onClose={close}>
    <form method="dialog"><button className="icon close" aria-label="關閉 · Close"><X size={20}/></button></form>
    <h2 id="beginner-tutorial-title">新手教學 <em>Learn to play</em></h2>
    <Explanation zh="目標係終局現金最多。每回合先落一塊地，如果觸發成立、擴張或者合併，就即時處理。之後可以買股，最後補牌交棒。"
      en="Finish with the most cash. Place one tile, resolve any hotel founding, expansion or merger it triggers, then decide whether to buy shares. Draw a replacement tile to finish your turn."/>
    <nav className="tutorial-lessons" aria-label="教學章節 · Lessons">
      {lessons.map(([id, zh, en], index) => <button type="button" className="secondary compact" key={id}
        aria-current={id === lesson ? 'step' : undefined} onClick={() => {if (id !== lesson) openLesson(id);}}>
        <span>{index + 1}. {zh}</span><small lang="en">{en}</small>
      </button>)}
    </nav>
    <section aria-labelledby="tutorial-exercise-title">
      <h3 id="tutorial-exercise-title">{lessons[lessonIndex][1]} · {lessons[lessonIndex][2]}</h3>

      {lesson !== 'settle' && <>
        {placing && lesson === 'place' && <>
          <Explanation zh="開局時遊戲會自動放好起始地塊，再派每人 6 塊手牌。輪到你，就揀其中一塊放到同座標嘅空格。5C 即係第 5 欄、C 行。試揀手牌或者棋盤上嘅 5C，再撳「確認放置」。"
            en="The game places the starting tiles and deals six tiles to each player. On your turn, choose one tile and place it on its matching empty square. 5C means column 5, row C. Select 5C in your hand or on the board, then confirm."/>
          <div className="tutorial-controls tutorial-placement-hand">
            <span>練習用手牌 · Tile to practise with</span>
            <button type="button" className="secondary compact" aria-pressed={selected}
              onClick={() => setSelected(!selected)}>5C</button>
          </div>
        </>}
        {placing && lesson === 'found' && <Explanation
          zh="今次 5C 已經有一幢獨立建築。揀 6C 同佢接埋，就可以成立一間酒店。上下左右相連先計，斜角唔計。"
          en="This time 5C already has an independent building. Place 6C beside it to found a hotel. Tiles connect along their edges. Diagonals do not count."/>}
        {placing && lesson === 'merge' && <Explanation
          zh="半島有 6 格，星野有 4 格。揀 5C 再確認，兩間酒店就會接通，由較大嘅半島收購星野。"
          en="The Peninsula has six tiles and Hoshino has four. Select 5C and confirm to connect them. The larger Peninsula chain acquires Hoshino."/>}
        <LessonBoard game={game} target={target} selected={selected} onSelect={() => setSelected(!selected)}/>
        {placing && <button type="button" className="primary" disabled={!selected} onClick={() => advance({type: 'place', tile: target})}>
          確認放置 · Build tile
        </button>}
      </>}

      {lesson === 'place' && game.phase === 'buy' && <>
        <Explanation zh="放置成功。5C 嘅上下左右都冇建築，所以佢暫時係一幢獨立建築。正式對局會去到買股階段。下一節試吓喺獨立建築旁邊放地塊。"
          en="Tile placed. None of the four squares next to 5C contains a building, so it stays independent. In a full game, you now move to the buying phase. In the next lesson, try placing beside an independent building."/>
        <button type="button" className="primary" onClick={() => openLesson('found')}>下一節：成立酒店 · Next: Found a hotel</button>
      </>}

      {lesson === 'found' && game.phase === 'found' && <>
        <Explanation zh="兩塊相連嘅獨立建築可以成立酒店。正式對局可以揀任何未成立酒店。呢度揀星野，創辦人會免費獲得一股。"
          en="Two connected independent buildings can form a hotel. In a full game, pick any inactive chain. Found Hoshino here and receive one free share."/>
        <button type="button" className="primary" onClick={() => advance({type: 'found', chain: HOSHINO})}>
          成立星野 · Found Hoshino
        </button>
      </>}

      {lesson === 'found' && game.phase === 'buy' && <>
        <Explanation zh="而家去「酒店交易所」揀股。每回合最多買 3 股，只可買已成立嘅酒店，亦可以一股都唔買。試撳 + 加股，再買入並完成回合。"
          en="Use the Stock Exchange to buy up to three shares per turn across active hotels. Buying is optional. Try adding a share, then buy and finish your turn."/>
        <div className="tutorial-controls">
          <span>星野 · Hoshino <strong>{money(price(game, HOSHINO))} / 股</strong></span>
          <div className="stepper">
            <button type="button" disabled={quantity === 0} onClick={() => setQuantity(quantity - 1)} aria-label="減一股 · Remove one share">−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" disabled={quantity === 3} onClick={() => setQuantity(quantity + 1)} aria-label="加一股 · Add one share">+</button>
          </div>
          <span>總額 · Total <strong>{money(quantity * price(game, HOSHINO))}</strong></span>
        </div>
        <div className="tutorial-actions">
          <button type="button" className="primary" disabled={!quantity} onClick={() => {
            const quantities = HOTELS.map(hotel => hotel.id === HOSHINO ? quantity : 0);
            advance({type: 'buyAndFinish', quantities});
          }}>買入並完成回合 · Buy &amp; finish turn</button>
          <button type="button" className="secondary" onClick={() => advance({type: 'finish'})}>
            不買股，完成回合 · Skip buying &amp; finish
          </button>
        </div>
      </>}

      {founded && <>
        <Explanation zh={`回合完成。你有 ${player.shares[HOSHINO]} 股星野、${money(player.cash)} 現金，手牌補回 6 塊。下次落地塊接住一間酒店，酒店就會擴張。`}
          en={`Turn complete. You have ${player.shares[HOSHINO]} Hoshino shares, ${money(player.cash)} in cash and six tiles again. Placing next to one active hotel expands that hotel.`}/>
        <button type="button" className="primary" onClick={() => openLesson('merge')}>下一節 · Next lesson</button>
      </>}

      {lesson === 'merge' && game.phase === 'dispose' && <>
        <Explanation zh={`星野每股 ${money(mergerPrice)}。你持有 4 股，係第一大股東，已收 ${money(award)} 獎金。第二大股東收一股股價嘅 5 倍。獎金同股票分開計。試吓賣 1 股、用 2 股換 1 股半島，餘下 1 股會自動保留。`}
          en={`Hoshino trades at ${money(mergerPrice)} per share. As the largest shareholder with four shares, you earned a separate ${money(award)} majority bonus. The second-largest shareholder gets five times one share’s price. Try selling one and trading two for one Peninsula share. The remaining share is kept automatically.`}/>
        <div className="tutorial-controls tutorial-disposal">
          <label>賣出股數 · Sell
            <select value={sell} onChange={event => setSell(Number(event.target.value))}>
              {Array.from({length: player.shares[HOSHINO] - trade * 2 + 1}, (_, count) =>
                <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label>換入半島股數 · Receive
            <select value={trade} onChange={event => setTrade(Number(event.target.value))}>
              {Array.from({length: Math.floor((player.shares[HOSHINO] - sell) / 2) + 1}, (_, count) =>
                <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <span>保留 · Keep <strong>{retained}</strong></span>
          <span>套現 · Proceeds <strong>{money(sell * mergerPrice)}</strong></span>
        </div>
        <button type="button" className="primary" onClick={() => advance({type: 'dispose', sell, trade})}>確認 · Confirm</button>
      </>}

      {disposed && <>
        <Explanation zh={`合併完成。同規模時，由落地塊嘅玩家揀邊間保留。你換入 ${player.shares[PENINSULA]} 股半島、保留 ${player.shares[HOSHINO]} 股星野，現金有 ${money(player.cash)}。保留嘅股票可等酒店重開。11 格或以上嘅酒店屬安全酒店，唔可以用一塊地連接兩間安全酒店。`}
          en={`The merger is complete. When chains tie for size, the tile placer picks which survives. You received ${player.shares[PENINSULA]} Peninsula shares, kept ${player.shares[HOSHINO]} Hoshino shares and now have ${money(player.cash)} in cash. Kept shares matter if Hoshino reopens. Chains of 11 or more tiles are safe. You cannot connect two safe chains.`}/>
        <button type="button" className="primary" onClick={() => openLesson('settle')}>下一節 · Next lesson</button>
      </>}

      {lesson === 'settle' && game.phase !== 'end' && <>
        <Explanation zh={`任何酒店有 41 格，或者所有已成立酒店都有至少 11 格，就可以宣告今個回合完結後結算。呢局文華有 ${size(game, MANDARIN)} 格，你揸住 7 股，手頭有 ${money(player.cash)}。先宣告，然後完成回合。`}
          en={`You may declare the final turn when any chain reaches 41 tiles or all active chains have at least 11. Here Mandarin has ${size(game, MANDARIN)} tiles. You hold seven shares and ${money(player.cash)} cash. Declare, then finish your turn.`}/>
        <button type="button" className="primary" onClick={() => advance({type: game.endDeclared ? 'finish' : 'declare'})}>
          {game.endDeclared ? '完成回合 · Finish turn' : '宣告最後回合 · Declare final turn'}
        </button>
      </>}

      {lesson === 'settle' && score && mandarin && <>
        <Explanation zh="結算表逐項列出你帶入終局嘅現金、仍然營業嘅酒店股票套現同股東獎金。未重開嘅酒店股票值 $0。現金總額最高嘅玩家贏。"
          en="The final scorecard lists your starting cash at settlement, proceeds from active hotels and shareholder bonuses. Shares in closed hotels are worth $0. The player with the most cash wins."/>
        <dl className="tutorial-score">
          <div><dt>結算前現金 · Cash before settlement</dt><dd>{money(score.cashBeforeSettlement)}</dd></div>
          <div><dt>股票套現 · Proceeds ({mandarin.shares} × {money(mandarin.sharePrice)})</dt><dd>{money(mandarin.sale)}</dd></div>
          <div><dt>第一股東獎金 · Majority bonus (10 × {money(mandarin.sharePrice)})</dt><dd>{money(mandarin.bonus)}</dd></div>
          <div><dt>最終總額 · Final total</dt><dd>{money(player.cash)}</dd></div>
        </dl>
        {startPractice && <button type="button" className="primary" onClick={startPractice}>試玩一局 · Play a practice game</button>}
        {!startPractice && <button type="button" className="primary" onClick={close}>返回遊戲 · Return to game</button>}
      </>}
      {error && <p className="error" role="alert">{error}</p>}
    </section>
    <footer className="tutorial-actions tutorial-footer">
      <button type="button" className="secondary compact" onClick={() => openLesson(lesson)}>重試本節 · Restart lesson</button>
      <button type="button" className="secondary compact" onClick={showRules}>詳細規則 · Full rules</button>
    </footer>
  </dialog>;
}
