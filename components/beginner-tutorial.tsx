'use client';

import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {BoardTile} from './board-tile';
import {applyAction, HOTELS, placement, price, priceFor, size, type Action, type Game} from '../lib/game/engine.ts';
import {createTutorialGame, FOUNDING_TILE, HOSHINO, MANDARIN, MERGER_TILE, PENINSULA, PLACEMENT_TILE, type TutorialExercise} from '../lib/game/tutorial.ts';

const lessons = [
  ['place', '放置地塊', 'Placing a tile'],
  ['found', '成立酒店', 'Founding a hotel'],
  ['merge', '合併與換股', 'Mergers and shares'],
  ['settle', '終局結算', 'Final scoring'],
] as const;

const money = (amount: number) => '$' + amount.toLocaleString('en-GB');
const boardColumns = [3, 4, 5, 6, 7];
const boardRows = ['C', 'D', 'E'];

function Explanation({zh, en}: {zh: string; en: string}) {
  return <p className="tutorial-explanation">{zh}<small lang="en">{en}</small></p>;
}

function LessonBoard({game, target, selected, onSelect}: {
  game: Game;
  target: number;
  selected: boolean;
  onSelect: () => void;
}) {
  const placing = game.phase === 'place' && game.turn === 0;
  return <div className="board-frame tutorial-board" role="group" aria-label="練習棋盤 · Practice board">
    <div className="grid-label corner" aria-hidden="true">A</div>
    {boardColumns.map(column => <div className="grid-label" key={column}>{column}</div>)}
    {boardRows.map(row => <div className="board-row" key={row}>
      <div className="grid-label">{row}</div>
      {boardColumns.map(column => {
        const tile = (row.charCodeAt(0) - 65) * 12 + column - 1;
        const plan = placing && tile === target ? placement(game, tile) : null;
        return <BoardTile key={tile} tile={tile} value={game.board[tile]} plan={plan}
          playable={!!plan?.legal} selected={!!plan && selected}
          latest={game.lastTile === tile} onSelect={onSelect}/>;
      })}
    </div>)}
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
          <Explanation zh="開局時遊戲會自動放好起始地塊，再派每人 6 塊手牌。輪到你，就揀其中一塊放到同座標嘅空格。5C 即係第 5 欄、C 行。"
            en="The game places the starting tiles and deals six tiles to each player. On your turn, choose one tile and place it on its matching empty square. 5C means column 5, row C."/>
          <Explanation zh="3C 已有一幢獨立建築。撳手牌 5C，或者撳棋盤上標有「可放置」嘅 5C 空格。見到「已選取」之後，撳「確認放置」。可放置提示只有你自己見到，確認落地後其他玩家先會見到新地塊。"
            en="3C already has an independent building. Select 5C in your hand or click the empty 5C square marked ‘Place here’. When it shows ‘Selected’, confirm the placement. Only you see the placement hints. Once confirmed, everyone sees the new tile."/>
          <div className="tutorial-controls tutorial-placement-hand">
            <span>練習用手牌 · Tile to practise with</span>
            <button type="button" className="secondary compact" aria-pressed={selected}
              onClick={() => setSelected(!selected)}>5C</button>
          </div>
        </>}
        {placing && lesson === 'found' && <>
          <Explanation
            zh="成立新酒店：新地塊接住至少一幢獨立建築，而且連成一組之後冇接到任何已成立嘅酒店。只計上下左右，唔計斜角。今次放 6C 連住 5C，就會觸發成立酒店。"
            en="You found a hotel when the new tile joins at least one independent building and the connected group touches no existing hotels. Only shared edges count. Try placing 6C beside the independent building on 5C."/>
          <Explanation
            zh="擴張已有酒店：如果放完地塊之後，連成嘅一組接到一間已成立嘅酒店，新地塊同連住嘅獨立建築都會併入嗰間酒店。接到兩間或以上，就會觸發合併。"
            en="If the connected group touches exactly one existing hotel, the new tile and any connected independent buildings become part of that hotel. Connecting two or more hotels triggers a merger."/>
        </>}
        {placing && lesson === 'merge' && <>
          <Explanation
            zh="合併（收購）係遊戲嘅核心玩法，會大大影響你手頭有幾多現金可以再投資。被收購酒店會派股東獎金，持有嗰間酒店股票嘅玩家亦可以選擇賣股套現。"
            en="Mergers are central to the game and can make a big difference to how much cash you have to reinvest. The acquired hotel pays shareholder bonuses, and its shareholders can choose to sell shares for cash."/>
          <Explanation
            zh="半島有 6 格，星野有 4 格。揀 5C 再確認，兩間酒店就會接通，由較大嘅半島收購星野。"
            en="The Peninsula has six tiles and Hoshino has four. Select 5C and confirm to connect them. The larger Peninsula chain acquires Hoshino."/>
        </>}
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
        <Explanation zh="6C 同 5C 已經連埋，而且冇接到已成立嘅酒店。正式對局可以揀任何未成立酒店。呢度揀星野，創辦人會免費獲得一股。"
          en="6C and 5C now form a group that touches no existing hotels. In a full game, pick any inactive chain. Found Hoshino here and receive one free share."/>
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
