import {useLanguage} from "./language";
import {hotelText} from './hotel-text';

const sections = [
  ['你要做乜？', 'Overview', [
    ['你是一名酒店投資者。你可以在棋盤上建造、成立或擴展酒店，並購買看好的酒店股票。遊戲結束後，計入股票出售收入及股東獎金，現金最多的玩家獲勝。', 'You are a hotel investor. Build on the board, found or expand hotels and buy shares. The player with the most cash after share sales and bonuses wins.'],
  ]],
  ['先認識畫面', 'Know the board', [
    ['棋盤：5C 代表第 5 欄、C 行。酒店各有顏色同標誌。', 'Board: 5C is column 5, row C. Each hotel has its own colour and logo.'],
    ['專屬地塊：遊戲分配給你的建造位置。每位玩家只可查看自己的專屬地塊，並在自己的回合選擇有標記的地塊。', 'Private building spots: Only you see your assigned spots. On your turn, click a marked square.'],
    ['可在酒店交易所查看股價、庫存及持股，也可按品牌及格數查閱股價和股東獎金。', 'The stock exchange shows prices, stock available and your holdings. The price guide lists prices and bonuses by brand and size.'],
  ]],
  ['開局', 'Set-up', [
    ['由一位玩家建立房間並邀請朋友。2–6 人即可開始。每人獲得 $6,000 和六個專屬地塊，起初不持有股票。', 'Create a room and invite friends. Start with 2–6 players. Each gets $6,000, no shares and six private building spots.'],
    ['系統為每人放一幢起始獨立建築。按 1A 至 12A、再到 B 行的順序排列，起始建築位置最前的玩家先行，其餘按座位順序輪流。', 'The game places one independent building per player. The earliest square in board order (1A to 12A, then row B) determines who goes first. Turns follow seat order.'],
  ]],
  ['每回合得兩步', 'Your turn', [
    ['① 建造（放置地塊）。選擇一格，再按「確認放置」。只計算上下左右相鄰的地塊。新地塊及與其相連的獨立建築一併處理。', '① Build (place a tile). Choose a square and confirm. Only shared edges count. Resolve the tile together with any independent buildings it connects.'],
    ['若未連接其他建築，則成為獨立建築。若只連接獨立建築，選擇一個尚未成立的品牌成立酒店，並獲得一股股票或等值現金。若連接一間酒店，該酒店便會擴展。若連接兩間或以上，則觸發合併。', 'An isolated tile stays independent. Joining only independent buildings lets you found an inactive brand and receive one share or its cash value. Joining one hotel expands it. Joining two or more triggers a merger.'],
    ['② 購買股票（可略過）。若現金及股票庫存充足，可購買已成立酒店的股票，合計最多三股。確認買入或按「完成回合」，即可結束回合。若仍有剩餘地塊，系統會補上新的位置。', '② Buy shares (optional). Buy up to three shares in total in active hotels, subject to cash and supply. Confirm or select Finish turn to pass play. Used spots are replenished while tiles remain.'],
    ['例：在 5C 建造，使文華東方擴展一格，然後可買入兩股文華東方並確認結束回合。', 'Example: Build at 5C to expand Mandarin Oriental by one tile, then buy two Mandarin Oriental shares and confirm to pass play.'],
    ['合併：規模最大的酒店保留。若規模相同，由放置地塊的玩家決定。被收購的酒店先按合併前的股價發放獎金，持股玩家再按座位順序處理股票，從放置地塊的玩家開始。', 'Merger: The largest hotel survives. The tile placer breaks ties. The acquired hotel pays bonuses using its pre-merger price. Shareholders then act in seat order, starting with the tile placer.'],
    ['例：半島 6 格，星野 4 格。合併後保留半島。若你持有六股星野，而星野每股價格為 $500，你可賣出兩股取得 $1,000、以兩股換取一股半島（若有庫存），並保留兩股星野。標準獎金分別為每股價格的 10 倍及 5 倍。若你是唯一股東，可另外獲得 $7,500。自訂房間則按設定的倍數計算。', 'Example: The Peninsula (six tiles) acquires Hoshino (four tiles). At $500 per Hoshino share, you can sell two for $1,000, swap two for one Peninsula share if available and keep two. Standard bonuses are 10× and 5× the share price. A sole shareholder receives both, $7,500 in this example. Custom rooms use their selected multipliers.'],
  ]],
  ['遊戲結束及結算', 'Game end and scoring', [
    ['若一間酒店達到 41 格，或場上至少有一間已成立的酒店且每間均達到 11 格，你可以在自己的放置地塊或購買股票階段宣布最後回合。回合結束後結算。', 'If a hotel reaches 41 tiles, or at least one hotel is active and all active hotels have 11 or more tiles, you may declare the final turn during placement or buying. Finish your turn before settlement.'],
    ['仍在營運的酒店會發放股東獎金，其股票按最終股價兌現。未成立酒店的股票價值為 $0。例：原有 $3,000 + 獎金 $6,000 + 三股每股 $600 = $10,800。現金最多的玩家獲勝，同額者並列。', 'Active hotels pay bonuses and their shares cash out at final prices. Inactive shares are worth $0. Example: $3,000 cash + $6,000 bonus + three shares at $600 = $10,800. The highest total wins, with joint winners on a tie.'],
  ]],
  ['特殊情況', 'Special cases', [
    ['達到 11 格的酒店不可被收購。會連接兩間安全酒店的地塊永久不可放置，回合結束時若仍有剩餘地塊，系統會更換。若七間酒店均已成立，會觸發成立新酒店的地塊暫時不可放置。', 'Hotels of 11 or more tiles are safe from acquisition. Spots joining two safe hotels are permanently blocked and replaced at turn end if tiles remain. Founding spots are temporarily blocked when all seven hotels are active.'],
    ['沒有可放置的地塊時，可略過放置階段並繼續購買股票。若所有玩家在一整輪內都無法放置地塊，遊戲會自動結算。', 'If you have no legal placement, skip it and proceed to buying. If everyone goes a full round without a legal placement, the game settles automatically.'],
    ['同時收購多間酒店時，按各被收購酒店原有的規模由大至小處理。若格數相同，由放置地塊的玩家決定順序。', 'Resolve multiple acquired hotels in descending order of their original size. The tile placer breaks ties.'],
    ['唯一股東獲得兩份獎金。並列第一的股東平分兩份獎金，並列第二的股東平分第二份獎金。每人的獎金向上取整至最接近的 $100。兩人對局中，若仍有剩餘地塊，合併及結算時會抽取一個地塊，以其欄號作為市場持股數。', 'A sole shareholder gets both bonuses. Tied leaders split both and tied runners-up split the second. Round split awards up to the next $100 increment. In two-player games, if tiles remain, a drawn tile’s column gives the market holding for merger and settlement bonuses.'],
  ]],
  ['一頁速查', 'Quick reference', [
    ['回合：放置地塊 → 處理酒店變化 → 購買 0–3 股 → 結束回合。', 'Turn: Build → resolve hotel changes → buy 0–3 shares → pass play.'],
    ['合併：決定邊間保留 → 派獎金 → 賣、換或留股。', 'Merger: Determine the survivor → pay bonuses → sell, exchange or keep shares.'],
    ['結算：原有現金 + 股東獎金 + 賣股所得。', 'Settlement: Cash on hand + shareholder bonuses + share proceeds.'],
  ]],
] as const;

export function RulebookPreview() {
  const {t} = useLanguage();

  return <div className="rulebook-preview">
    {sections.map(([title, english, points], index) => <section className="rule-step" key={title}>
      <b aria-hidden="true">{index + 1}</b>
      <div>
        <h3>{t(title, english)}</h3>
        <ul>{points.map(([zh, en]) => <li key={zh}>
          <p>{hotelText(t(zh, en), true)}</p>
        </li>)}</ul>
      </div>
    </section>)}
  </div>;
}
