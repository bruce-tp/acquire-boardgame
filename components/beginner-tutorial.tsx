'use client';

import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {FinalScorecard} from './final-scorecard';
import {createPracticeGame} from '../lib/game/practice.ts';
import {hotelText} from './hotel-text';
import {BoardTile} from './board-tile';
import {PriceReference} from './price-reference';
import {applyAction, HOTELS, label, placement, price, priceFor, publicState, type Action, type Game} from '../lib/game/engine.ts';
import {createTutorialGame, FINAL_TILE, FOUNDING_TILE, HOSHINO, MERGER_TILE, PENINSULA, PLACEMENT_TILE, type TutorialExercise} from '../lib/game/tutorial.ts';

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
  return <p className="tutorial-explanation">{hotelText(zh, true)}<small lang="en">{hotelText(en, true)}</small></p>;
}

function LessonBoard({game, target, selected, onSelect, full = false, overviewViewer}: {
  game: Game;
  target: number;
  selected: boolean;
  onSelect?: () => void;
  full?: boolean;
  overviewViewer?: number;
}) {
  const placing = game.phase === 'place' && game.turn === 0;
  const overviewView = overviewViewer === undefined ? null : publicState(game, overviewViewer);
  const privateSpots = overviewView?.players[overviewView.me].hand;
  const canPlace = overviewView ? game.turn === overviewView.me && game.phase === 'place' : placing;
  const columns = full ? Array.from({length:12}, (_, index) => index + 1) : boardColumns;
  const rows = full ? Array.from({length:9}, (_, index) => String.fromCharCode(65 + index)) : boardRows;
  return <div className={full ? 'board-frame' : 'board-frame tutorial-board'} role="group" aria-label="練習棋盤 · Practice board">
    <div className="grid-label corner" aria-hidden="true">A</div>
    {columns.map(column => <div className="grid-label" key={column}>{column}</div>)}
    {rows.map(row => <div className="board-row" key={row}>
      <div className="grid-label">{row}</div>
      {columns.map(column => {
        const tile = (row.charCodeAt(0) - 65) * 12 + column - 1;
        const plan = (privateSpots ? privateSpots.includes(tile) : placing && tile === target) ? placement(game, tile) : null;
        return <BoardTile key={tile} tile={tile} value={game.board[tile]} plan={plan}
          playable={canPlace && !!plan?.legal} selected={!!plan && selected}
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
  const [practiceOpening] = useState(createPracticeGame);
  const [selected, setSelected] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const [sell, setSell] = useState(0);
  const [trade, setTrade] = useState(0);
  const [error, setError] = useState('');
  const player = game.players[0];
  const lessonIndex = lessons.findIndex(([id]) => id === lesson);
  const target = {place: PLACEMENT_TILE, found: FOUNDING_TILE, merge: MERGER_TILE, settle: FINAL_TILE}[lesson];

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
  const proceeds = score?.hotels.reduce((sum, hotel) => sum + hotel.sale, 0) ?? 0;
  const bonuses = score?.hotels.reduce((sum, hotel) => sum + hotel.bonus, 0) ?? 0;

  return <dialog ref={dialog} className="dialog beginner-tutorial" aria-labelledby="beginner-tutorial-title" onClose={close}>
    <form method="dialog"><button className="icon close" aria-label="關閉 · Close"><X size={20}/></button></form>
    <h2 id="beginner-tutorial-title">新手教學 <em>Learn to play</em></h2>
    <Explanation zh="勝利條件：完場計埋賣股同獎金，最多錢嗰個贏。"
      en="To win, finish with the most cash after share sales and bonuses."/>
    <Explanation zh="每個回合得兩個步驟：" en="Each turn has two steps:"/>
    <ol>
      <li><Explanation zh="起樓（放置地塊）" en="Build (place a tile)"/></li>
      <li><Explanation zh="買股票（唔買都得）" en="Buy shares (optional)"/></li>
    </ol>
    <Explanation zh="買完或者揀唔買，就到下一位玩家做同樣嘅嘢。"
      en="Once you buy or skip buying, the next player takes their turn."/>
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
          <Explanation zh="用呢個盤面做例子。輪到你時，可以喺棋盤揀一個有提示嘅位置起樓。"
            en="On your turn, choose a marked square on the board to build on."/>
          <figure className="tutorial-practice-opening">
            <figcaption>輪到你時，你見到嘅棋盤 · What you see on your turn</figcaption>
            <div className="board-scroll" tabIndex={0} role="region" aria-label="你見到嘅棋盤 · Your view of the board">
              <LessonBoard game={practiceOpening} target={-1} selected={false} full overviewViewer={0}/>
            </div>
          </figure>
          <Explanation zh="你會見到 6 個提示。白色 8H「可放置」會起一幢獨立建築，青色 5C「擴展」會擴大文華，金色 8B「成立」會開一間新酒店。"
            en="You can see six markers. White 8H (‘Place here’) adds an independent building, teal 5C (‘Expansion’) grows Mandarin Oriental, and gold 8B (‘Founding’) starts a new hotel."/>
          <Explanation zh="呢六格係你嘅專屬地塊。用咗一格，其餘五格會留低。有地塊剩嘅話，回合尾會補一個新位置畀你。"
            en="These six squares are your private building spots. After you use one, the other five stay. If tiles remain, you get a new spot at the end of your turn."/>
          <Explanation zh="5C 即係第 5 欄、C 行。試吓撳棋盤上標住「可放置」嘅 5C，再撳「確認放置」。落咗地之後，其他玩家就會見到新建築。"
            en="5C means column 5, row C. Click the square marked ‘Place here’ at 5C, then confirm. Everyone can see the new building once you place it."/>
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
        {placing && <p className="tutorial-explanation" aria-live="polite">
          <strong>{selected ? '而家撳棋盤下方嘅「確認放置」。' : `試吓撳下面棋盤嘅 ${label(target)} 格。`}</strong>
          <small lang="en">{selected ? 'Now click “Build tile” below the board.' : `Try clicking the ${label(target)} square on the board below.`}</small>
        </p>}
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
          {hotelText('成立星野 · Found Hoshino', true)}
        </button>
      </>}

      {lesson === 'found' && game.phase === 'buy' && <>
        <Explanation zh="而家去「酒店交易所」揀股。每回合最多買 3 股，只可買已成立嘅酒店，亦可以一股都唔買。試撳 + 加股，再買入並完成回合。"
          en="Use the Stock Exchange to buy up to three shares per turn across active hotels. Buying is optional. Try adding a share, then buy and finish your turn."/>
        <div className="tutorial-controls">
          <span>{hotelText('星野 · Hoshino', true)} <strong>{money(price(game, HOSHINO))} / 股</strong></span>
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
        <Explanation zh={`回合完成。你有 ${player.shares[HOSHINO]} 股星野、${money(player.cash)} 現金，遊戲已補返一個專屬地塊。下次落地塊接住一間酒店，酒店就會擴張。`}
          en={`Turn complete. You have ${player.shares[HOSHINO]} Hoshino shares, ${money(player.cash)} in cash and one new private building spot. Placing next to one active hotel expands that hotel.`}/>
        <button type="button" className="primary" onClick={() => openLesson('merge')}>下一節 · Next lesson</button>
      </>}

      {lesson === 'merge' && game.phase === 'dispose' && <>
        <Explanation
          zh={`查股價表：喺星野嗰欄搵收購前嘅 4 格，再橫向讀取每股賣價 ${money(mergerPrice)}。同一行亦列出第一同第二大股東嘅獎金。`}
          en={`In the share price guide, find Hoshino’s pre-merger size of four tiles in its column. Read across for the sell price of ${money(mergerPrice)} per share and the majority and minority bonuses.`}/>
        <details className="tutorial-price-guide">
          <summary>查看股價及股東獎金表 · View share price and bonus guide</summary>
          <PriceReference sizes={game.merger?.sizes} settings={game.settings}/>
        </details>

        <Explanation zh={`星野每股 ${money(mergerPrice)}。你持有 4 股，係第一大股東，已收 ${money(award)} 獎金。第二大股東收一股股價嘅 5 倍。獎金同股票分開計。試吓賣 1 股、用 2 股換 1 股半島，餘下 1 股會自動保留。`}
          en={`Hoshino trades at ${money(mergerPrice)} per share. As the largest shareholder with four shares, you earned a separate ${money(award)} majority bonus. The second-largest shareholder gets five times one share’s price. Try selling one and trading two for one Peninsula share. The remaining share is kept automatically.`}/>
        <div className="tutorial-controls tutorial-disposal">
          <label>賣出股數 · Sell
            <select value={sell} onChange={event => setSell(Number(event.target.value))}>
              {Array.from({length: player.shares[HOSHINO] - trade * 2 + 1}, (_, count) =>
                <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label><span>{hotelText('換入半島股數 · Receive', true)}</span>
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

      {lesson === 'settle' && <>
        <Explanation
          zh="輪到你時，符合以下任何一個條件，就可以選擇喺今個回合完結後結算。"
          en="On your turn, you may choose to end the game after your turn if either condition is met."/>
        <ol>
          <li>至少一間酒店有 41 格或以上。<br/><small lang="en">At least one hotel has 41 or more tiles.</small></li>
          <li>棋盤上所有已成立嘅酒店都安全，即係每間都有至少 11 格。<br/><small lang="en">Every active hotel on the board is safe, meaning each has at least 11 tiles.</small></li>
        </ol>
        {placing && <Explanation
          zh="棋盤上有四間酒店。文華東方 15 格、半島 14 格、星野 12 格，全部安全。瑰麗得 10 格。撳棋盤嘅 10H，再撳「確認放置」，睇吓瑰麗擴展到 11 格之後會點。"
          en="There are four hotels on the board. Mandarin Oriental (15), The Peninsula (14) and Hoshino (12) are safe. Rosewood has 10 tiles. Select 10H, then choose ‘Build tile’ to grow Rosewood to 11."/>}
        {!placing && <h4>終局棋盤 · Endgame board</h4>}
        <div className="board-scroll">
          <LessonBoard full game={game} target={target} selected={selected} onSelect={() => setSelected(!selected)}/>
        </div>
        {placing && <button type="button" className="primary" disabled={!selected} onClick={() => advance({type: 'place', tile: target})}>
          確認放置 · Build tile
        </button>}
        {game.phase === 'buy' && <>
          <Explanation zh="瑰麗而家有 11 格，四間酒店都安全，可以選擇結束遊戲。呢個例子入面，你選擇完結遊戲，今個回合唔再買股。"
            en="Rosewood now has 11 tiles, so all four hotels are safe and you may end the game. In this example, you choose to end the game and skip buying more shares."/>
          <button type="button" className="primary" onClick={() => {
            const finalGame = structuredClone(game);
            applyAction(finalGame, 0, {type: 'declare'});
            applyAction(finalGame, 0, {type: 'finish'});
            setGame(finalGame);
          }}>結束遊戲及查看結算表 · End game and see scores</button>
        </>}
      </>}

      {lesson === 'settle' && score && <>
        <Explanation
          zh={`你結算前有 ${money(score.cashBeforeSettlement)} 現金。將表內各間酒店嘅賣股收入加埋，係 ${money(proceeds)}，再加 ${money(bonuses)} 股東獎金。你嘅最終總額係 ${money(player.cash)}。最終總額最高嘅玩家排第一。`}
          en={`You start settlement with ${money(score.cashBeforeSettlement)} in cash. Add the share sale proceeds of ${money(proceeds)} and shareholder bonuses of ${money(bonuses)} for a final total of ${money(player.cash)}. The player with the highest final total ranks first.`}/>
        <FinalScorecard view={publicState(game, 0)}/>
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
