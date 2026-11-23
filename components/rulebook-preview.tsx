import {hotelText} from './hotel-text';

const sections = [
  ['你要做乜？', 'Overview', [
    ['你係酒店投資者。你會喺棋盤起樓、成立或擴展酒店，同埋買你睇好嘅酒店股票。完場計埋賣股所得同股東獎金，最多現金嗰個贏。', 'You are a hotel investor. Build on the board, found or expand hotels and buy shares. The player with the most cash after share sales and bonuses wins.'],
  ]],
  ['先認識畫面', 'Know the board', [
    ['棋盤：5C 代表第 5 欄、C 行。酒店各有顏色同標誌。', 'Board: 5C is column 5, row C. Each hotel has its own colour and logo.'],
    ['專屬地塊：遊戲分配畀你嘅起樓位置。只有你睇到自己嗰批，輪到你時可以撳有提示嘅格。', 'Private building spots: Only you see your assigned spots. On your turn, click a marked square.'],
    ['酒店交易所睇股價、庫存同持股。股價表可以按品牌同格數查股價同獎金。', 'The stock exchange shows prices, stock available and your holdings. The price guide lists prices and bonuses by brand and size.'],
  ]],
  ['開局', 'Set-up', [
    ['一位玩家開房並邀請朋友。2–6 人就可以開局。每人有 $6,000、零持股同六個專屬地塊。', 'Create a room and invite friends. Start with 2–6 players. Each gets $6,000, no shares and six private building spots.'],
    ['系統為每人放一幢起始獨立建築。按 1A 至 12A、再到 B 行嘅次序，位置最先嗰位先行，之後按座位輪流。', 'The game places one independent building per player. The earliest square in board order (1A to 12A, then row B) determines who goes first. Turns follow seat order.'],
  ]],
  ['每回合得兩步', 'Your turn', [
    ['① 起樓（放置地塊）。揀一格，再撳「確認放置」。只計上下左右。新地塊同佢接通嘅獨立建築一齊處理。', '① Build (place a tile). Choose a square and confirm. Only shared edges count. Resolve the tile together with any independent buildings it connects.'],
    ['冇接到建築就保持獨立。只接到獨立建築就成立酒店，揀未成立嘅品牌，攞一股或等值現金。接到一間酒店就擴展，接到兩間或以上就合併。', 'An isolated tile stays independent. Joining only independent buildings lets you found an inactive brand and receive one share or its cash value. Joining one hotel expands it. Joining two or more triggers a merger.'],
    ['② 買股票（唔買都得）。有現金同庫存先可以買已成立酒店嘅股票，合共最多三股。確認買入或撳「完成回合」就交棒。有地塊剩會補返新位置。', '② Buy shares (optional). Buy up to three shares in total in active hotels, subject to cash and supply. Confirm or select Finish turn to pass play. Used spots are replenished while tiles remain.'],
    ['例：喺 5C 起樓令文華東方擴展一格，之後可以買兩股文華東方，再確認交棒。', 'Example: Build at 5C to expand Mandarin Oriental by one tile, then buy two Mandarin Oriental shares and confirm to pass play.'],
    ['合併：最大嗰間保留，同樣大由落地塊嘅人揀。被收購酒店先按合併前股價派獎金，之後有持股嘅玩家按座位處理股票，由落地塊嗰位開始。', 'Merger: The largest hotel survives. The tile placer breaks ties. The acquired hotel pays bonuses using its pre-merger price. Shareholders then act in seat order, starting with the tile placer.'],
    ['例：半島 6 格，星野 4 格。接通後半島保留。星野每股 $500，你有六股，可以賣兩股攞 $1,000、用兩股換一股半島（如有庫存）、保留兩股星野。標準獎金係股價 10 倍同 5 倍，如果你係唯一股東，另外攞 $7,500。自訂房間按設定倍數計。', 'Example: The Peninsula (six tiles) acquires Hoshino (four tiles). At $500 per Hoshino share, you can sell two for $1,000, swap two for one Peninsula share if available and keep two. Standard bonuses are 10× and 5× the share price. A sole shareholder receives both, $7,500 in this example. Custom rooms use their selected multipliers.'],
  ]],
  ['完場同計分', 'Game end and scoring', [
    ['一間酒店達 41 格，或場上至少一間已成立酒店而每間都達 11 格，就可以喺你嘅放置或買股階段宣告最後回合。完成回合後結算。', 'If a hotel reaches 41 tiles, or at least one hotel is active and all active hotels have 11 or more tiles, you may declare the final turn during placement or buying. Finish your turn before settlement.'],
    ['仍然成立嘅酒店會派獎金，股票按最後股價兌現。未成立嘅酒店股票值 $0。例：原有 $3,000 + 獎金 $6,000 + 三股每股 $600 = $10,800。最多錢嗰位贏，同分並列。', 'Active hotels pay bonuses and their shares cash out at final prices. Inactive shares are worth $0. Example: $3,000 cash + $6,000 bonus + three shares at $600 = $10,800. The highest total wins, with joint winners on a tie.'],
  ]],
  ['特殊情況', 'Special cases', [
    ['11 格或以上嘅酒店唔可以被收購。會連接兩間安全酒店嘅地塊永久用唔到，回合尾有剩餘地塊就會更換。七間酒店都成立咗，會成立新酒店嘅位置暫時用唔到。', 'Hotels of 11 or more tiles are safe from acquisition. Spots joining two safe hotels are permanently blocked and replaced at turn end if tiles remain. Founding spots are temporarily blocked when all seven hotels are active.'],
    ['完全冇格可用時可以跳過放置，仍然可以買股。所有玩家連續一輪都冇格可用就自動結算。', 'If you have no legal placement, skip it and proceed to buying. If everyone goes a full round without a legal placement, the game settles automatically.'],
    ['一次收購幾間，由原本最大嗰間被收購酒店開始處理。同格數由落地塊嘅玩家揀次序。', 'Resolve multiple acquired hotels in descending order of their original size. The tile placer breaks ties.'],
    ['唯一股東攞兩份獎金，並列第一平分兩份，並列第二平分第二份。每人分到嘅獎金向上取整至 $100。兩人局有地塊剩時，合併同結算會抽一塊地，用欄號做市場持股數。', 'A sole shareholder gets both bonuses. Tied leaders split both and tied runners-up split the second. Round split awards up to the next $100 increment. In two-player games, if tiles remain, a drawn tile’s column gives the market holding for merger and settlement bonuses.'],
  ]],
  ['一頁速查', 'Quick reference', [
    ['回合：起樓 → 處理酒店變化 → 買 0–3 股 → 交棒。', 'Turn: Build → resolve hotel changes → buy 0–3 shares → pass play.'],
    ['合併：決定邊間保留 → 派獎金 → 賣、換或留股。', 'Merger: Determine the survivor → pay bonuses → sell, exchange or keep shares.'],
    ['結算：原有現金 + 股東獎金 + 賣股所得。', 'Settlement: Cash on hand + shareholder bonuses + share proceeds.'],
  ]],
] as const;

export function RulebookPreview() {
  return <div className="rulebook-preview">
    {sections.map(([title, english, points], index) => <section className="rule-step" key={title}>
      <b aria-hidden="true">{index + 1}</b>
      <div>
        <h3>{title} · <span lang="en">{english}</span></h3>
        <ul>{points.map(([zh, en]) => <li key={zh}>
          <p>{hotelText(zh, true)}</p>
          <p lang="en">{hotelText(en, true)}</p>
        </li>)}</ul>
      </div>
    </section>)}
  </div>;
}
