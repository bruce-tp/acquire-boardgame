'use client';

import {useEffect, useRef, useState} from 'react';
import {X} from 'lucide-react';
import {FinalScorecard} from './final-scorecard';
import {createPracticeGame} from '../lib/game/practice.ts';
import {hotelText} from './hotel-text';
import {BoardTile, boardHotelLogo} from './board-tile';
import {PriceReference} from './price-reference';
import {applyAction, HOTELS, label, placement, size, price, priceFor, publicState, type Action, type Game} from '../lib/game/engine.ts';
import {createTutorialGame, FINAL_TILE, FOUNDING_TILE, HOSHINO, MERGER_TILE, PENINSULA, PLACEMENT_TILE, type TutorialExercise} from '../lib/game/tutorial.ts';

const buildLessons = [
  ['place', '放置地塊', 'Placing a tile'],
  ['found', '成立酒店', 'Founding a hotel'],
  ['merge', '合併與換股', 'Mergers and shares'],
] as const;

const chapters = [
  ['place', '起樓（放置地塊）', 'Build (place a tile)', 'build'],
  ['buy', '買股票', 'Buy shares', 'buy'],
  ['settle', '終局', 'Game end', 'end'],
] as const;
type Lesson = TutorialExercise | 'buy';

const money = (amount: number) => '$' + amount.toLocaleString('en-GB');
const boardColumns = [3, 4, 5, 6, 7];
const boardRows = ['C', 'D', 'E'];

function Explanation({zh, en}: {zh: string; en: string}) {
  return <p className="tutorial-explanation">{hotelText(zh, true)}<small lang="en">{hotelText(en, true)}</small></p>;
}

function PrivateSpotCoordinates({english = false}: {english?: boolean}) {
  const spots = ['5C', '7E', '8B', '8G', '8H', '9E'];
  return spots.map((spot, index) => <span key={spot} style={{whiteSpace: 'nowrap'}}>
    {index === 0 ? '' : index === spots.length - 1 ? (english ? ' and ' : ' 同 ') : (english ? ', ' : '、')}
    <span style={{display: 'inline-block', paddingInline: 5, border: '1px solid #dfbc8080', borderRadius: 4, color: 'var(--goldlight)', fontWeight: 700}}>{spot}</span>
  </span>);
}

function SuccessFeedback({zh, en}: {zh: string; en: string}) {
  return <div role="status" className="tutorial-explanation" style={{borderInlineStart: '3px solid var(--goldlight)', paddingInlineStart: 12}}>
    <strong style={{color: 'var(--goldlight)'}}>{zh}</strong>
    <small lang="en">{en}</small>
  </div>;
}

function LessonBoard({game, target, selected, onSelect, full = false, overviewViewer}: {
  game: Game;
  target: number;
  selected: number | null;
  onSelect?: (tile: number) => void;
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
          playable={canPlace && !!plan?.legal} selected={!!plan && canPlace && selected === tile}
          latest={game.lastTile === tile} onSelect={onSelect && (() => onSelect(tile))}/>;
      })}
    </div>)}
  </div>;
}

function FoundingChoices({game, onChoose}: {game: Game; onChoose: (chain: number) => void}) {
  return <div className="chain-choices" role="group" aria-label="選擇酒店 · Choose a hotel">
    {HOTELS.filter(hotel => size(game, hotel.id) === 0).map(hotel => {
      const maskImage = `url("${boardHotelLogo(hotel)}")`;
      return <button type="button" className="chain-choice" key={hotel.id}
        onClick={() => onChoose(hotel.id)}>
        <span className="emblem brand-emblem small" aria-hidden="true" style={{'--hotel': hotel.colour} as React.CSSProperties}>
          <span className="hotel-logo" style={{maskImage, WebkitMaskImage: maskImage}}/>
        </span>
        <span>{hotelText(hotel.zh)}<small lang="en">{hotelText(hotel.name)}</small></span>
      </button>;
    })}
  </div>;
}

export function BeginnerTutorial({close, showRules, startPractice}: {
  close: () => void;
  showRules: () => void;
  startPractice?: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [unlockedChapter, setUnlockedChapter] = useState(0);
  const [lesson, setLesson] = useState<Lesson>('place');
  const [game, setGame] = useState(createPracticeGame);
  const [selected, setSelected] = useState<number | null>(null);
  const [foundedHotel, setFoundedHotel] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(0);
  const [sell, setSell] = useState(0);
  const [trade, setTrade] = useState(0);
  const [error, setError] = useState('');
  const player = game.players[0];
  const buyingHotel = HOTELS[foundedHotel ?? HOSHINO];
  const founderShares = foundedHotel === null ? 0 : 1;
  const chapter = lesson === 'buy' || lesson === 'settle' ? lesson : 'place';
  const heading = buildLessons.find(([id]) => id === lesson) ?? chapters.find(([id]) => id === chapter)!;
  const target = {place: PLACEMENT_TILE, found: FOUNDING_TILE, merge: MERGER_TILE, buy: FOUNDING_TILE, settle: FINAL_TILE}[lesson];

  useEffect(() => {dialog.current?.showModal();}, []);

  function openLesson(id: Lesson) {
    setLesson(id);
    const next = id === 'place' ? createPracticeGame() : createTutorialGame(id === 'buy' ? 'found' : id);
    if (id === 'buy') {
      applyAction(next, 0, {type: 'place', tile: FOUNDING_TILE});
      applyAction(next, 0, {type: 'found', chain: buyingHotel.id});
      if (founderShares === 0) {
        next.players[0].shares[buyingHotel.id]--;
        next.bank[buyingHotel.id]++;
      }
    }
    setGame(next);
    setSelected(null);
    setQuantity(0);
    setSell(0);
    setTrade(0);
    setError('');
  }

  function selectTile(tile: number) {
    setSelected(previous => previous === tile ? null : tile);
  }

  function advance(action: Action) {
    const next = structuredClone(game);
    try {
      applyAction(next, 0, action);
      if (action.type === 'dispose' && next.phase === 'dispose') {
        // Jamie holds the only other acquired shares in this exercise.
        applyAction(next, 1, {type: 'dispose', sell: 0, trade: 0});
      }
      if (action.type === 'found' && action.chain !== undefined) {
        setFoundedHotel(action.chain);
      }
      if (lesson === 'merge' && next.phase === 'buy') {
        setUnlockedChapter(previous => Math.max(previous, 1));
      }
      if (lesson === 'buy' && next.phase === 'place' && next.turn !== 0) {
        setUnlockedChapter(2);
      }
      setGame(next);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  const placing = game.phase === 'place' && game.turn === 0;
  const buyingFinished = lesson === 'buy' && game.phase === 'place' && game.turn !== 0;
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
    <p className="tutorial-explanation"><strong style={{color: 'var(--goldlight)'}}>編寫中</strong> · 呢份新手教學仲寫緊，內容會繼續更新。<br/><span lang="en">This tutorial is a work in progress.</span></p>
    <section aria-labelledby="tutorial-game-flow" style={{
      border: '1px solid #829bb24d',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 12,
    }}>
      <h3 id="tutorial-game-flow" style={{margin: '0 0 8px'}}>遊戲流程 · <span lang="en">Game flow</span></h3>
      <Explanation zh="勝利條件：完場計埋賣股同獎金，最多錢嗰個贏。"
        en="To win, finish with the most cash after share sales and bonuses."/>
      <Explanation zh="每個回合得兩個步驟：" en="Each turn has two steps:"/>
      <ol>
        <li className="tutorial-build"><Explanation zh="起樓（放置地塊）" en="Build (place a tile)"/></li>
        <li className="tutorial-buy"><Explanation zh="買股票（唔買都得）" en="Buy shares (optional)"/></li>
      </ol>
      <p className="tutorial-explanation">
        買完或者揀唔買，就到下一位玩家做同樣嘅嘢，直到<span className="tutorial-end">終局</span>。
        <small lang="en">Once you buy or skip buying, the next player takes their turn. This repeats until <span className="tutorial-end">the game ends</span>.</small>
      </p>
    </section>
    <nav className="tutorial-lessons" aria-label="教學章節 · Lessons">
      {chapters.map(([id, zh, en, colour], index) => <button type="button" className={`secondary compact tutorial-${colour}`} key={id}
        disabled={index > unlockedChapter} style={index > unlockedChapter ? {opacity: 0.4} : undefined}
        aria-current={id === chapter ? 'step' : undefined} onClick={() => {if (id !== chapter) openLesson(id);}}>
        <span>練習{["一", "二", "三"][index]} · {zh}</span><small lang="en">Exercise {index + 1} · {en}</small>
      </button>)}
    </nav>
    <section aria-labelledby="tutorial-exercise-title">
      <h3 id="tutorial-exercise-title" className={chapter === 'place' ? 'tutorial-build' : chapter === 'buy' ? 'tutorial-buy' : 'tutorial-end'}>{heading[1]} · {heading[2]}</h3>

      {chapter === 'place' && <>
        {placing && lesson === 'place' && <>
          <p className="tutorial-explanation">
            放置地塊之後，可能會起一幢<span style={{color: '#b9ccd8'}}>獨立建築</span>、<span style={{color: '#f5ca80'}}>成立酒店</span>、<span style={{color: '#8cddcc'}}>擴展酒店</span>，或者<span style={{color: '#ffa696'}}>觸發合併</span>同換股。下面會逐步練習。
            <small lang="en">Placing a tile can add an <span style={{color: '#b9ccd8'}}>independent building</span>, <span style={{color: '#f5ca80'}}>found a hotel</span>, <span style={{color: '#8cddcc'}}>expand a hotel</span>, or <span style={{color: '#ffa696'}}>trigger a merger</span> and share exchanges. Try these in the exercises below.</small>
          </p>
          <Explanation zh="遊戲開始時，每個玩家都會獲分配 6 個「專屬地塊」，即係只有你可以起樓嘅位置。"
            en="At the start of the game, each player gets six private building spots. Only you can build on the spots assigned to you."/>
          <p className="tutorial-explanation">
            用呢個盤面做例子。假設你就係呢位玩家，由地圖得知，你嘅六個專屬地塊係 <PrivateSpotCoordinates/>。輪到你時，就可以喺棋盤撳呢啲格起樓。
            <small lang="en">In this example, the player’s six private building spots are <PrivateSpotCoordinates english/>. On their turn, they can click any of these squares to build.</small>
          </p>
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
          <strong>{selected !== null ? `已揀 ${label(selected)}，撳「確認放置」。` : lesson === 'place' ? '依家試吓撳棋盤上六個提示格嘅其中一格。' : `試吓撳棋盤嘅 ${label(target)} 格。`}</strong>
          <small lang="en">{selected !== null ? `${label(selected)} selected. Choose ‘Build tile’.` : lesson === 'place' ? 'Try clicking any of the six marked squares.' : `Try clicking ${label(target)} on the board.`}</small>
        </p>}
        {lesson === 'place' ? <figure className="tutorial-practice-opening">
          <div className="board-scroll" tabIndex={0} role="region" aria-label="練習棋盤 · Practice board">
            <LessonBoard full game={game} target={target} selected={selected} onSelect={selectTile} overviewViewer={0}/>
          </div>
        </figure> : <LessonBoard game={game} target={target} selected={selected} onSelect={selectTile}/>}
        {placing && <button type="button" className="primary" disabled={selected === null} onClick={() => advance({type: 'place', tile: selected!})}>
          確認放置 · Build tile
        </button>}
      </>}

      {lesson === 'place' && !placing && game.lastTile !== null && <>
        <SuccessFeedback zh="做得好！你成功放咗一塊地。" en="Well done! You placed a tile."/>
        {game.phase === 'found' ? <>
          <Explanation zh="你揀嘅地塊連住獨立建築。揀一間未成立嘅酒店，遊戲會喺棋盤上成立嗰間酒店，仲會送你一股。"
            en="Your tile connects to an independent building. Choose an inactive hotel to found it on the board and receive one free share."/>
          <FoundingChoices game={game} onChoose={chain => advance({type: 'found', chain})}/>
        </> : game.lastTileEvent === 'found' ? <Explanation
          zh={`${HOTELS[game.board[game.lastTile]].zh}成立咗，你攞到一股創辦人股票。`}
          en={`${HOTELS[game.board[game.lastTile]].name} is open, and you received one founder’s share.`}/>
        : game.board[game.lastTile] === 7 ? <Explanation zh="放置成功。呢格冇接到其他建築，所以成為一幢獨立建築。"
          en="Tile placed. It touches no other buildings, so it stays independent."/>
        : <Explanation zh={`放置成功。${HOTELS[game.board[game.lastTile]].zh}擴展咗一格。`}
          en={`Tile placed. ${HOTELS[game.board[game.lastTile]].name} gained one tile.`}/>}
        {game.phase !== 'found' && <button type="button" className="primary" onClick={() => openLesson('found')}>繼續起樓練習 · Continue building</button>}
      </>}

      {lesson === 'found' && game.phase === 'found' && <>
        <Explanation zh="6C 同 5C 已經連埋，而且冇接到已成立嘅酒店。揀一間酒店成立喺呢兩格，你就會免費攞到一股。"
          en="6C and 5C are connected and touch no existing hotels. Choose a hotel to found on these two squares and receive one free share."/>
        <FoundingChoices game={game} onChoose={chain => advance({type: 'found', chain})}/>
      </>}

      {lesson === 'found' && game.phase === 'buy' && <>
        <SuccessFeedback zh="恭喜！你成立咗一間酒店。" en="Congratulations! You founded a hotel."/>
        <Explanation zh="酒店成立咗，你攞到一股創辦人股票。" en="The hotel is open, and you received one founder’s share."/>
        <button type="button" className="primary" onClick={() => openLesson('merge')}>繼續起樓練習 · Continue building</button>
      </>}

      {lesson === 'buy' && game.phase === 'buy' && <>
        <Explanation zh="而家去「酒店交易所」揀股。每回合最多買 3 股，只可買已成立嘅酒店，亦可以一股都唔買。試撳 + 加股，再買入並完成回合。"
          en="Use the Stock Exchange to buy up to three shares per turn across active hotels. Buying is optional. Try adding a share, then buy and finish your turn."/>
        {founderShares > 0 && <Explanation zh={`你已有 1 股${buyingHotel.zh}創辦人股票。`}
          en={`You already have one founder’s share in ${buyingHotel.name}.`}/>}
        <div className="tutorial-controls">
          <span>{hotelText(buyingHotel.zh + ' · ' + buyingHotel.name)} <strong>{money(price(game, buyingHotel.id))} / 股</strong></span>
          <div className="stepper">
            <button type="button" disabled={quantity === 0} onClick={() => setQuantity(quantity - 1)} aria-label="減一股 · Remove one share">−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" disabled={quantity === 3} onClick={() => setQuantity(quantity + 1)} aria-label="加一股 · Add one share">+</button>
          </div>
          <span>總額 · Total <strong>{money(quantity * price(game, buyingHotel.id))}</strong></span>
        </div>
        <div className="tutorial-actions">
          <button type="button" className="primary" disabled={!quantity} onClick={() => {
            const quantities = HOTELS.map(hotel => hotel.id === buyingHotel.id ? quantity : 0);
            advance({type: 'buyAndFinish', quantities});
          }}>買入並完成回合 · Buy &amp; finish turn</button>
          <button type="button" className="secondary" onClick={() => advance({type: 'finish'})}>
            不買股，完成回合 · Skip buying &amp; finish
          </button>
        </div>
      </>}

      {buyingFinished && <>
        <SuccessFeedback zh="做得好！你完成咗買股練習。" en="Well done! You completed the buying exercise."/>
        <Explanation zh={`回合完成。${buyingHotel.zh}：${founderShares ? '1 股創辦人股票 + ' : ''}今次買入 ${player.shares[buyingHotel.id] - founderShares} 股，合共 ${player.shares[buyingHotel.id]} 股。剩餘現金：${money(player.cash)}。`}
          en={`Turn complete. ${buyingHotel.name}: ${founderShares ? '1 founder’s share + ' : ''}${player.shares[buyingHotel.id] - founderShares} bought this turn, ${player.shares[buyingHotel.id]} in total. Cash remaining: ${money(player.cash)}.`}/>
        <button type="button" className="primary" onClick={() => openLesson('settle')}>下一節：終局 · Next: Game end</button>
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
        <SuccessFeedback zh="做得好！你處理完今次合併嘅股票。" en="Well done! You handled your shares in the merger."/>
        <Explanation zh={`合併完成。同規模時，由落地塊嘅玩家揀邊間保留。你換入 ${player.shares[PENINSULA]} 股半島、保留 ${player.shares[HOSHINO]} 股星野，現金有 ${money(player.cash)}。保留嘅股票可等酒店重開。11 格或以上嘅酒店屬安全酒店，唔可以用一塊地連接兩間安全酒店。`}
          en={`The merger is complete. When chains tie for size, the tile placer picks which survives. You received ${player.shares[PENINSULA]} Peninsula shares, kept ${player.shares[HOSHINO]} Hoshino shares and now have ${money(player.cash)} in cash. Kept shares matter if Hoshino reopens. Chains of 11 or more tiles are safe. You cannot connect two safe chains.`}/>
        <button type="button" className="primary" onClick={() => openLesson('buy')}>下一節：買股票 · Next: Buy shares</button>
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
          <LessonBoard full game={game} target={target} selected={selected} onSelect={selectTile}/>
        </div>
        {placing && <button type="button" className="primary" disabled={selected === null} onClick={() => advance({type: 'place', tile: target})}>
          確認放置 · Build tile
        </button>}
        {game.phase === 'buy' && <>
          <SuccessFeedback zh="做得好！你令最後一間酒店達到安全規模。" en="Well done! You brought the last hotel up to safe size."/>
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
        <SuccessFeedback zh="恭喜！你完成咗終局結算練習。" en="Congratulations! You completed the final scoring exercise."/>
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
