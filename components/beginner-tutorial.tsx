'use client';
import {useLanguage} from "./language";

import {useEffect, useRef, useState} from 'react';
import {ArrowDown, BadgeCheck, Building2, X} from 'lucide-react';
import {FinalScorecard} from './final-scorecard';
import {createPracticeGame} from '../lib/game/practice.ts';
import {hotelText} from './hotel-text';
import {ShareCertificate} from './share-cards';
import {BoardTile, boardHotelLogo} from './board-tile';
import {PriceReference} from './price-reference';
import {applyAction, HOTELS, label, placement, size, price, priceFor, publicState, type Action, type Game} from '../lib/game/engine.ts';
import {createTutorialGame, FINAL_TILE, FOUNDING_TILE, FOUR_SEASONS, MERGER_TILE, PENINSULA, PLACEMENT_TILE, type TutorialExercise} from '../lib/game/tutorial.ts';

const buildLessons = [
  ['place', '放置地塊', 'Placing a tile'],
  ['found', '1.1 成立酒店', '1.1 Founding a hotel'],
  ['merge', '1.2 合併與換股', '1.2 Mergers and shares'],
] as const;

const chapters = [
  ['place', '建造（放置地塊）', 'Build (place a tile)', 'build'],
  ['buy', '買股票', 'Buy shares', 'buy'],
  ['settle', '終局', 'Game end', 'end'],
] as const;
type Lesson = TutorialExercise | 'buy';

const money = (amount: number) => '$' + amount.toLocaleString('en-GB');
const boardColumns = [3, 4, 5, 6, 7];
const boardRows = ['C', 'D', 'E'];

function Explanation({zh, en}: {zh: string; en: string}) {
  const {t} = useLanguage();

  return <p className="tutorial-explanation">{hotelText(t(zh, en), true)}</p>;
}

function PrivateSpotCoordinates() {
  const {language} = useLanguage();
  const english = language === "en";

  const spots = ['5C', '7E', '8B', '8G', '8H', '9E'];
  return spots.map((spot, index) => <span key={spot} style={{whiteSpace: 'nowrap'}}>
    {index === 0 ? '' : index === spots.length - 1 ? (english ? ' and ' : ' 及 ') : (english ? ', ' : '、')}
    <span style={{display: 'inline-block', paddingInline: 5, border: '1px solid #dfbc8080', borderRadius: 4, color: 'var(--goldlight)', fontWeight: 700}}>{spot}</span>
  </span>);
}

function SuccessFeedback({zh, en}: {zh: string; en: string}) {
  const {t} = useLanguage();

  return <div role="status" className="tutorial-explanation" style={{display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', border: '1px solid #dfbc8060', borderRadius: 8, background: '#dfbc8010', color: 'var(--goldlight)'}}>
    <BadgeCheck size={25} aria-hidden="true" style={{flexShrink: 0}}/>
    <strong style={{flex: 1}}>{t(zh, en)}</strong>
    <picture style={{flexShrink: 0, width: 'clamp(64px, 16vw, 116px)'}}>
      <source media="(prefers-reduced-motion: no-preference)" srcSet="https://media1.tenor.com/m/yg67eWk9vG4AAAAC/%E8%8B%B1%E9%9B%84%E6%9C%AC%E8%89%B22-chow-yun-fat.gif"/>
      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt="" referrerPolicy="no-referrer"
        style={{display: 'block', width: '100%', height: 'auto', borderRadius: 5}}
        onError={event => { event.currentTarget.closest('picture')?.setAttribute('hidden', ''); }}/>
    </picture>
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
  const {t} = useLanguage();

  const placing = game.phase === 'place' && game.turn === 0;
  const overviewView = overviewViewer === undefined ? null : publicState(game, overviewViewer);
  const privateSpots = overviewView?.players[overviewView.me].hand;
  const canPlace = overviewView ? game.turn === overviewView.me && game.phase === 'place' : placing;
  const columns = full ? Array.from({length:12}, (_, index) => index + 1) : boardColumns;
  const rows = full ? Array.from({length:9}, (_, index) => String.fromCharCode(65 + index)) : boardRows;
  return <div className={full ? 'board-frame' : 'board-frame tutorial-board'} role="group" aria-label={t("練習棋盤", "Practice board")}>
    <div className="grid-label corner" aria-hidden="true">A</div>
    {columns.map(column => <div className="grid-label" key={column}>{column}</div>)}
    {rows.map(row => <div className="board-row" key={row}>
      <div className="grid-label">{row}</div>
      {columns.map(column => {
        const tile = (row.charCodeAt(0) - 65) * 12 + column - 1;
        const plan = (privateSpots ? privateSpots.includes(tile) : placing && tile === target) ? placement(game, tile) : null;
        return <BoardTile key={tile} tile={tile} value={game.board[tile]} plan={plan}
          playable={canPlace && !!plan?.legal} selected={!!plan && canPlace && selected === tile}
          tutorialHint={canPlace && !!plan?.legal && selected === null && !!onSelect}
          latest={game.lastTile === tile} onSelect={onSelect && (() => onSelect(tile))}/>;
      })}
    </div>)}
  </div>;
}

function FoundingChoices({game, onChoose}: {game: Game; onChoose: (chain: number) => void}) {
  const {t} = useLanguage();

  return <div className="chain-choices" role="group" aria-label={t("選擇酒店", "Choose a hotel")}>
    {HOTELS.filter(hotel => size(game, hotel.id) === 0).map(hotel => {
      const maskImage = `url("${boardHotelLogo(hotel)}")`;
      return <button type="button" className="chain-choice" data-tutorial-next key={hotel.id}
        onClick={() => onChoose(hotel.id)}>
        <span className="emblem brand-emblem small" aria-hidden="true" style={{'--hotel': hotel.colour} as React.CSSProperties}>
          <span className="hotel-logo" style={{maskImage, WebkitMaskImage: maskImage}}/>
        </span>
        <span>{hotelText(t(hotel.zh, hotel.name))}</span>
      </button>;
    })}
  </div>;
}

export function BeginnerTutorial({close, showRules, startPractice}: {
  close: () => void;
  showRules: () => void;
  startPractice?: () => void;
}) {
  const {t, localiseMessage} = useLanguage();

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
  const buyingHotel = HOTELS[foundedHotel ?? FOUR_SEASONS];
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
  const mergerPrice = game.merger ? priceFor(FOUR_SEASONS, game.merger.sizes[FOUR_SEASONS]) : 0;
  const award = game.merger?.awards?.[0]?.amount ?? 0;
  const retained = player.shares[FOUR_SEASONS] - sell - trade * 2;
  const score = game.finalScores?.[0];
  const proceeds = score?.hotels.reduce((sum, hotel) => sum + hotel.sale, 0) ?? 0;
  const bonuses = score?.hotels.reduce((sum, hotel) => sum + hotel.bonus, 0) ?? 0;

  return <dialog ref={dialog} className="dialog beginner-tutorial" aria-labelledby="beginner-tutorial-title" onClose={close}>
    <form method="dialog"><button className="icon close" aria-label={t("關閉", "Close")}><X size={20}/></button></form>
    <h2 id="beginner-tutorial-title">{t("新手教學", "Learn to play")}</h2>
    <p className="tutorial-explanation">{t("歡迎來到酒店交易所，投資者！", "Welcome to the Hotel Exchange, investor!")}</p>
    <p className="tutorial-explanation">{t(
      "完成這份教學後，你就能掌握基本遊戲流程，並有能力從第一回合開始，獨立完成一場遊戲。",
      "By the end of this tutorial, you’ll understand how the game works and be able to play a full game on your own, starting from the first turn.",
    )}</p>
    <p className="tutorial-explanation">{t(
      <>你會練習<strong className="tutorial-build">放置地塊</strong>、<strong style={{color: '#f5ca80'}}>成立酒店</strong>、<strong style={{color: '#8cddcc'}}>擴展酒店</strong>、<strong style={{color: '#ffa696'}}>處理合併與換股</strong>，以及<strong className="tutorial-buy">購買股票</strong>。最後，你會學會閱讀<strong className="tutorial-end">終局結算表</strong>，看懂誰獲勝，以及勝負是如何決定的。</>,
      <>You’ll practise <strong className="tutorial-build">placing tiles</strong>, <strong style={{color: '#f5ca80'}}>founding hotels</strong>, <strong style={{color: '#8cddcc'}}>expanding hotels</strong>, <strong style={{color: '#ffa696'}}>handling shares in a merger</strong> and <strong className="tutorial-buy">buying shares</strong>. Finally, you’ll learn to read the <strong className="tutorial-end">final scorecard</strong> and see who won and why.</>,
    )}</p>
    <p className="tutorial-explanation">{t(
      <>在完成教學後，我們強烈建議您<strong>與電腦試玩一局</strong>，對我們投資者而言，實踐就是最好的老師！</>,
      <>After the tutorial, we strongly recommend <strong>playing a practice game against the computer</strong>. For us investors, practice is the best teacher!</>,
    )}</p>
    <section aria-labelledby="tutorial-game-flow" style={{
      border: '1px solid #829bb24d',
      borderRadius: 8,
      padding: '12px 16px',
      marginBottom: 12,
    }}>
      <div className="tutorial-flow-layout">
        <div>
          <h3 id="tutorial-game-flow" style={{margin: '0 0 8px'}}>{t("遊戲流程", "Game flow")}</h3>
          <Explanation zh="每個回合分為兩個步驟：" en="Each turn has two steps:"/>
          <ol>
            <li className="tutorial-build"><Explanation zh="建造（放置地塊）" en="Build (place a tile)"/></li>
            <li className="tutorial-buy"><Explanation zh="購買股票（可略過）" en="Buy shares (optional)"/></li>
          </ol>
        </div>
        <div className="tutorial-turn-art" aria-hidden="true">
          <div className="tutorial-turn-board">
            <span/><span/><span/><span><Building2 size={26}/></span>
          </div>
          <ArrowDown size={22}/>
          <div className="tutorial-turn-shares">
            {[HOTELS[0], HOTELS[2]].map(hotel => {
              const maskImage = `url("${boardHotelLogo(hotel)}")`;
              return <div className="tutorial-turn-certificate" key={hotel.id} style={{'--hotel': hotel.colour} as React.CSSProperties}>
                <span>{t("股票證書", "SHARE CERTIFICATE")}</span>
                <span className="hotel-logo" style={{maskImage, WebkitMaskImage: maskImage}}/>
                <strong>{t(hotel.short, hotel.name)}</strong>
                <span>{t("1 股", "ONE SHARE")}</span>
              </div>;
            })}
          </div>
        </div>
      </div>
      <p className="tutorial-explanation">
        {t("購買股票或略過後，由下一位玩家進行回合，直到", "Once you buy or skip buying, the next player takes their turn. This repeats until ")}<span className="tutorial-end">{t("終局", "the game ends")}</span>{t("。", ".")}
      </p>
          <div className="tutorial-explanation" style={{display: 'flex', alignItems: 'center', gap: 10, color: '#ffd98a'}}>
            <span aria-hidden="true" style={{
          display: 'grid', placeItems: 'center', flexShrink: 0, width: 36, height: 24,
          border: '2px solid currentColor', borderRadius: 4, fontWeight: 800, lineHeight: 1,
        }}>$</span>
            <div>
              <strong>{t("勝利條件：遊戲結束後，計入股票出售收入及股東獎金，現金最多的玩家獲勝。", "To win, finish with the most cash after share sales and bonuses.")}</strong>
            </div>
          </div>
    </section>
    <nav className="tutorial-lessons" aria-label={t("教學章節", "Lessons")}>
      {chapters.map(([id, zh, en, colour], index) => <button type="button" className={`secondary compact tutorial-${colour}`} key={id}
        disabled={index > unlockedChapter} style={index > unlockedChapter ? {opacity: 0.4} : undefined}
        aria-current={id === chapter ? 'step' : undefined} onClick={() => {if (id !== chapter) openLesson(id);}}>
        <span>{index + 1}. {t(zh, en)}</span>
      </button>)}
    </nav>
    <section aria-labelledby="tutorial-exercise-title">
      <h3 id="tutorial-exercise-title" className={chapter === 'place' ? 'tutorial-build' : chapter === 'buy' ? 'tutorial-buy' : 'tutorial-end'}>{t(heading[1], heading[2])}</h3>

      {chapter === 'place' && <>
        {placing && lesson === 'place' && <>
          <p className="tutorial-explanation">
            {t(<> 放置地塊之後，可能會起一幢<span style={{color: '#b9ccd8'}}>獨立建築</span>、<span style={{color: '#f5ca80'}}>成立酒店</span>、<span style={{color: '#8cddcc'}}>擴展酒店</span>，或者<span style={{color: '#ffa696'}}>觸發合併</span>及換股。以下將逐步練習。</>, <> Placing a tile can add an <span style={{color: '#b9ccd8'}}>independent building</span>, <span style={{color: '#f5ca80'}}>found a hotel</span>, <span style={{color: '#8cddcc'}}>expand a hotel</span>, or <span style={{color: '#ffa696'}}>trigger a merger</span> and share exchanges. Try these in the exercises below.</>)}
          </p>
          <Explanation zh="遊戲開始時，每個玩家都會獲分配 6 個「專屬地塊」，只有獲分配該地塊的玩家可以在該處建造。"
            en="At the start of the game, each player gets six private building spots. Only you can build on the spots assigned to you."/>
          <p className="tutorial-explanation">
            {t(<> 以這個棋盤為例，假設你是這位玩家，你的六個專屬地塊是 <PrivateSpotCoordinates/>。輪到你時，可在棋盤上選擇其中一格建造。</>, <> In this example, the player’s six private building spots are <PrivateSpotCoordinates/>. On their turn, they can click any of these squares to build.</>)}
          </p>
        </>}
        {placing && lesson === 'found' && <>
          <Explanation
            zh="成立新酒店：新地塊連接至少一幢獨立建築，且連成的區域未與任何已成立的酒店相連。只計算上下左右相鄰的地塊，斜角不算。本例中，放置 6C 會連接 5C，觸發酒店成立。"
            en="You found a hotel when the new tile joins at least one independent building and the connected group touches no existing hotels. Only shared edges count. Try placing 6C beside the independent building on 5C."/>
          <Explanation
            zh="擴展現有酒店：放置後，若連成的區域只與一間已成立的酒店相連，新地塊及相連的獨立建築都會併入該酒店。若連接兩間或以上的酒店，則觸發合併。"
            en="If the connected group touches exactly one existing hotel, the new tile and any connected independent buildings become part of that hotel. Connecting two or more hotels triggers a merger."/>
        </>}
        {placing && lesson === 'merge' && <>
          <Explanation
            zh="合併（收購）會影響你可用於再投資的現金。被收購的酒店會發放股東獎金，持有該酒店股票的玩家也可選擇出售股票。"
            en="Mergers are central to the game and can make a big difference to how much cash you have to reinvest. The acquired hotel pays shareholder bonuses, and its shareholders can choose to sell shares for cash."/>
          <Explanation
            zh="半島有 6 格，四季有 4 格。選擇 5C 並確認放置後，兩間酒店便會相連，由規模較大的半島收購四季。"
            en="The Peninsula has six tiles and Four Seasons has four. Select 5C and confirm to connect them. The larger Peninsula chain acquires Four Seasons."/>
        </>}
        {placing && <p className="tutorial-explanation" aria-live="polite">
          <strong>{t(selected !== null ? `已選擇 ${label(selected)}，請按「確認放置」。` : lesson === 'place' ? '請選擇棋盤上六個有標記的地塊之一。' : `請選擇棋盤上的 ${label(target)} 格。`, selected !== null ? `${label(selected)} selected. Choose ‘Build tile’.` : lesson === 'place' ? 'Try clicking any of the six marked squares.' : `Try clicking ${label(target)} on the board.`)}</strong>
        </p>}
        {lesson === 'place' ? <figure className="tutorial-practice-opening">
          <div className="board-scroll" tabIndex={0} role="region" aria-label={t("練習棋盤", "Practice board")}>
            <LessonBoard full game={game} target={target} selected={selected} onSelect={selectTile} overviewViewer={0}/>
          </div>
        </figure> : <LessonBoard game={game} target={target} selected={selected} onSelect={selectTile}/>}
        {placing && <button type="button" className="primary" data-tutorial-next={selected !== null || undefined} disabled={selected === null} onClick={() => advance({type: 'place', tile: selected!})}>
          {t("確認放置", "Build tile")}
        </button>}
      </>}

      {lesson === 'place' && !placing && game.lastTile !== null && <>
        <SuccessFeedback zh="恭喜你，投資者！你已成功放置一個地塊。" en="Congratulations, investor! You placed a tile."/>
        {game.phase === 'found' ? <>
          <Explanation zh="你放置的地塊與獨立建築相連。請選擇一間尚未成立的酒店。成立後，你會免費獲得該酒店的一股股票。"
            en="Your tile connects to an independent building. Choose an inactive hotel to found it on the board and receive one free share."/>
          <FoundingChoices game={game} onChoose={chain => advance({type: 'found', chain})}/>
        </> : game.lastTileEvent === 'found' ? <Explanation
          zh={`${HOTELS[game.board[game.lastTile]].zh}已成立，你獲得一股創辦人股票。`}
          en={`${HOTELS[game.board[game.lastTile]].name} is open, and you received one founder’s share.`}/>
        : game.board[game.lastTile] === 7 ? <Explanation zh="放置成功。這個地塊未與其他建築相連，因此成為一幢獨立建築。"
          en="Tile placed. It touches no other buildings, so it stays independent."/>
        : <Explanation zh={`放置成功。${HOTELS[game.board[game.lastTile]].zh}已擴展一格。`}
          en={`Tile placed. ${HOTELS[game.board[game.lastTile]].name} gained one tile.`}/>}
        {game.lastTileEvent === 'found' && game.phase === 'buy' && <div className="tutorial-founder-certificate">
          <ShareCertificate hotel={HOTELS[game.board[game.lastTile]]}/>
        </div>}
        {game.phase !== 'found' && <button type="button" className="primary" data-tutorial-next onClick={() => openLesson('found')}>{t("繼續建造練習", "Continue building")}</button>}
      </>}

      {lesson === 'found' && game.phase === 'found' && <>
        <Explanation zh="6C 和 5C 已相連，且未與任何已成立的酒店相連。選擇一個品牌在這兩格成立酒店，即可免費獲得一股股票。"
          en="6C and 5C are connected and touch no existing hotels. Choose a hotel to found on these two squares and receive one free share."/>
        <FoundingChoices game={game} onChoose={chain => advance({type: 'found', chain})}/>
      </>}

      {lesson === 'found' && game.phase === 'buy' && <>
        <SuccessFeedback zh="恭喜！你已成立一間酒店。" en="Congratulations! You founded a hotel."/>
        <Explanation zh="酒店已成立，你獲得一股創辦人股票。" en="The hotel is open, and you received one founder’s share."/>
        <div className="tutorial-founder-certificate"><ShareCertificate hotel={buyingHotel}/></div>
        <button type="button" className="primary" data-tutorial-next onClick={() => openLesson('merge')}>{t("繼續建造練習", "Continue building")}</button>
      </>}

      {lesson === 'buy' && game.phase === 'buy' && <>
        <Explanation zh="請到「酒店交易所」選擇股票。每回合可購買已成立酒店的股票，合計最多 3 股，也可略過。請按「+」增加購買股數，再選擇「買入並完成回合」。"
          en="Use the Stock Exchange to buy up to three shares per turn across active hotels. Buying is optional. Try adding a share, then buy and finish your turn."/>
        {founderShares > 0 && <Explanation zh={`你已有 1 股${buyingHotel.zh}創辦人股票。`}
          en={`You already have one founder’s share in ${buyingHotel.name}.`}/>}
        <div className="tutorial-controls">
          <span>{hotelText(t(buyingHotel.zh, buyingHotel.name))} <strong>{money(price(game, buyingHotel.id))} {t("/ 股", "/ share")}</strong></span>
          <div className="stepper">
            <button type="button" disabled={quantity === 0} onClick={() => setQuantity(quantity - 1)} aria-label={t("減一股", "Remove one share")}>−</button>
            <output aria-live="polite">{quantity}</output>
            <button type="button" data-tutorial-next={quantity === 0 || undefined} disabled={quantity === 3} onClick={() => setQuantity(quantity + 1)} aria-label={t("加一股", "Add one share")}>+</button>
          </div>
          <span>{t("總額", "Total")} <strong>{money(quantity * price(game, buyingHotel.id))}</strong></span>
        </div>
        <div className="tutorial-actions">
          <button type="button" className="primary" data-tutorial-next={quantity > 0 || undefined} disabled={!quantity} onClick={() => {
            const quantities = HOTELS.map(hotel => hotel.id === buyingHotel.id ? quantity : 0);
            advance({type: 'buyAndFinish', quantities});
          }}>{t("買入並完成回合", "Buy & finish turn")}</button>
          <button type="button" className="secondary" data-tutorial-next={quantity === 0 || undefined} onClick={() => advance({type: 'finish'})}>
            {t("不買股，完成回合", "Skip buying & finish")}
          </button>
        </div>
      </>}

      {buyingFinished && <>
        <SuccessFeedback zh="做得好！你已完成購買股票練習。" en="Well done! You completed the buying exercise."/>
        <Explanation zh={`回合完成。${buyingHotel.zh}：${founderShares ? '1 股創辦人股票 + ' : ''}本回合買入 ${player.shares[buyingHotel.id] - founderShares} 股，合共 ${player.shares[buyingHotel.id]} 股。剩餘現金：${money(player.cash)}。`}
          en={`Turn complete. ${buyingHotel.name}: ${founderShares ? '1 founder’s share + ' : ''}${player.shares[buyingHotel.id] - founderShares} bought this turn, ${player.shares[buyingHotel.id]} in total. Cash remaining: ${money(player.cash)}.`}/>
        <button type="button" className="primary" data-tutorial-next onClick={() => openLesson('settle')}>{t("下一節：終局", "Next: Game end")}</button>
      </>}

      {lesson === 'merge' && game.phase === 'dispose' && <>
        <Explanation
          zh={`查閱股價表：先在四季欄找到收購前的規模（4 格），再橫向查看每股賣價 ${money(mergerPrice)}。同一列也列出第一及第二大股東的獎金。`}
          en={`In the share price guide, find Four Seasons’s pre-merger size of four tiles in its column. Read across for the sell price of ${money(mergerPrice)} per share and the majority and minority bonuses.`}/>
        <details className="tutorial-price-guide">
          <summary data-tutorial-next={!sell && !trade || undefined}>{t("查看股價及股東獎金表", "View share price and bonus guide")}</summary>
          <PriceReference sizes={game.merger?.sizes} settings={game.settings}/>
        </details>

        <Explanation zh={`從上表得知，四季每股 ${money(mergerPrice)}。你持有 4 股，是第一大股東，已獲得 ${money(award)} 獎金。第二大股東的獎金為每股價格的 5 倍。獎金與股票分開計算。請試著賣出 1 股四季，再以 2 股四季換取 1 股半島，剩餘 1 股四季會自動保留。`}
          en={`As shown in the table above, Four Seasons trades at ${money(mergerPrice)} per share. As the largest shareholder with four shares, you earned a separate ${money(award)} majority bonus. The second-largest shareholder gets five times one share’s price. Try selling one and trading two for one Peninsula share. The remaining share is kept automatically.`}/>
        <div className="tutorial-controls tutorial-disposal">
          <label>{t("賣出股數", "Sell")}
            <select data-tutorial-next={sell === 0 || undefined} value={sell} onChange={event => setSell(Number(event.target.value))}>
              {Array.from({length: player.shares[FOUR_SEASONS] - trade * 2 + 1}, (_, count) =>
                <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <label><span>{hotelText(t("換入半島股數", "Receive"), true)}</span>
            <select data-tutorial-next={trade === 0 || undefined} value={trade} onChange={event => setTrade(Number(event.target.value))}>
              {Array.from({length: Math.floor((player.shares[FOUR_SEASONS] - sell) / 2) + 1}, (_, count) =>
                <option key={count} value={count}>{count}</option>)}
            </select>
          </label>
          <span>{t("保留", "Keep")} <strong>{retained}</strong></span>
          <span>{t("套現", "Proceeds")} <strong>{money(sell * mergerPrice)}</strong></span>
        </div>
        <button type="button" className="primary" data-tutorial-next={sell > 0 || trade > 0 || undefined} onClick={() => advance({type: 'dispose', sell, trade})}>{t("確認", "Confirm")}</button>
      </>}

      {disposed && <>
        <SuccessFeedback zh="做得好！你已完成本次合併的股票分配。" en="Well done! You handled your shares in the merger."/>
        <Explanation zh={`合併完成。酒店規模相同時，由放置地塊的玩家決定保留哪一間。你換入 ${player.shares[PENINSULA]} 股半島、保留 ${player.shares[FOUR_SEASONS]} 股四季，現金為 ${money(player.cash)}。保留的股票可留待酒店重新成立。`}
          en={`The merger is complete. When chains tie for size, the tile placer picks which survives. You received ${player.shares[PENINSULA]} Peninsula shares, kept ${player.shares[FOUR_SEASONS]} Four Seasons shares and now have ${money(player.cash)} in cash. Kept shares matter if Four Seasons reopens.`}/>
        <Explanation zh="注意：達到 11 格的酒店屬於安全酒店，無法被合併"
          en="Note: Hotels with 11 or more tiles are safe and cannot be taken over in a merger."/>
        <button type="button" className="primary" data-tutorial-next onClick={() => openLesson('buy')}>{t("下一節：買股票", "Next: Buy shares")}</button>
      </>}

      {lesson === 'settle' && <>
        <Explanation
          zh="輪到你時，若符合下列任一條件，可選擇在本回合結束後結算。"
          en="On your turn, you may choose to end the game after your turn if either condition is met."/>
        <ol>
          <li>{t("至少一間酒店有 41 格或以上。", "At least one hotel has 41 or more tiles.")}</li>
          <li>{t("棋盤上所有已成立的酒店都已達到安全規模，即每間至少有 11 格。", "Every active hotel on the board is safe, meaning each has at least 11 tiles.")}</li>
        </ol>
        {placing && <Explanation
          zh="棋盤上有四間酒店。文華東方 15 格、半島 14 格、四季 12 格，全部安全。瑰麗只有 10 格。請在棋盤上選擇 10H，再按「確認放置」，看看瑰麗擴展至 11 格後會發生甚麼。"
          en="There are four hotels on the board. Mandarin Oriental (15), The Peninsula (14) and Four Seasons (12) are safe. Rosewood has 10 tiles. Select 10H, then choose ‘Build tile’ to grow Rosewood to 11."/>}
        {!placing && <h4>{t("終局棋盤", "Endgame board")}</h4>}
        <div className="board-scroll">
          <LessonBoard full game={game} target={target} selected={selected} onSelect={selectTile}/>
        </div>
        {placing && <button type="button" className="primary" data-tutorial-next={selected !== null || undefined} disabled={selected === null} onClick={() => advance({type: 'place', tile: target})}>
          {t("確認放置", "Build tile")}
        </button>}
        {game.phase === 'buy' && <>
          <SuccessFeedback zh="做得好！你令最後一間酒店達到安全規模。" en="Well done! You brought the last hotel up to safe size."/>
          <Explanation zh="瑰麗現有 11 格，四間酒店均已達到安全規模，可以選擇結束遊戲。本例中，你將在本回合結束遊戲，並略過購買股票。"
            en="Rosewood now has 11 tiles, so all four hotels are safe and you may end the game. In this example, you choose to end the game and skip buying more shares."/>
          <button type="button" className="primary" data-tutorial-next onClick={() => {
            const finalGame = structuredClone(game);
            applyAction(finalGame, 0, {type: 'declare'});
            applyAction(finalGame, 0, {type: 'finish'});
            setGame(finalGame);
          }}>{t("結束遊戲及查看結算表", "End game and see scores")}</button>
        </>}
      </>}

      {lesson === 'settle' && score && <>
        <SuccessFeedback zh="恭喜！你已完成終局結算練習。" en="Congratulations! You completed the final scoring exercise."/>
        <Explanation
          zh={`你結算前有 ${money(score.cashBeforeSettlement)} 現金。表內各酒店的股票出售收入合計為 ${money(proceeds)}，股東獎金合計為 ${money(bonuses)}。三項相加後，你的最終總額為 ${money(player.cash)}。總額最高的玩家獲勝。`}
          en={`You start settlement with ${money(score.cashBeforeSettlement)} in cash. Add the share sale proceeds of ${money(proceeds)} and shareholder bonuses of ${money(bonuses)} for a final total of ${money(player.cash)}. The player with the highest final total ranks first.`}/>
        <FinalScorecard view={publicState(game, 0)}/>
        <figure style={{display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12, margin: '16px 0 12px', padding: 10, border: '1px solid #dfbc8060', borderRadius: 8, background: '#dfbc8010'}}>
          <img src="/art/gatsby-toast-v1.webp" alt="" width={144} height={96} style={{maxWidth: '100%', height: 'auto', borderRadius: 5}}/>
          <figcaption style={{color: 'var(--goldlight)', fontWeight: 700}}>{t("敬你，投資者！", "Here’s to you, investor!")}</figcaption>
        </figure>
        <p className="tutorial-explanation">{t(
          <>你已經完成基本教學，並成為一個可以獨當一面的投資者。{startPractice && <>我們強烈建議您<strong>與電腦試玩一局</strong>，對我們投資者而言，實踐就是最好的老師！</>}</>,
          <>You’ve completed the basic tutorial and can now hold your own as an investor. {startPractice && <>We strongly recommend <strong>playing a practice game against the computer</strong>. For us investors, practice is the best teacher!</>}</>,
        )}</p>
        {startPractice && <button type="button" className="primary" data-tutorial-next onClick={startPractice}>{t("與電腦試玩一局", "Play a practice game against the computer")}</button>}
        <button type="button" className="secondary" data-tutorial-next style={{marginTop: 8}} onClick={close}>
          {startPractice ? t("返回首頁", "Back to homepage") : t("完成教學", "Finish tutorial")}
        </button>
      </>}
      {error && <p className="error" role="alert">{localiseMessage(error)}</p>}
    </section>
    <footer className="tutorial-actions tutorial-footer">
      <button type="button" className="secondary compact" onClick={() => openLesson(lesson)}>{t("重試本節", "Restart lesson")}</button>
      <button type="button" className="secondary compact" onClick={showRules}>{t("實戰規則答疑", "Gameplay FAQ")}</button>
    </footer>
  </dialog>;
}
