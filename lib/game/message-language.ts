import {HOTELS} from './engine';

type Language = 'zh' | 'en';
const han = /\p{Script=Han}/u;
const translations: [RegExp, string][] = [
  [/^(.+): opening tile (\w+)$/, '$1：起始地塊 $2'],
  [/^(.+) starts$/, '$1 首先行動'],
  [/^Market holds (\d+) (.+)$/, '市場持有 $1 股$2'],
  [/^(.+): (.+) bonus$/, '$1：$2 股東獎金'],
  [/^(.+) survives$/, '$1 在合併中保留'],
  [/^(.+): no shares bought$/, '$1 本回合未購買股票'],
  [/^(.+): replaced (\d+) blocked tile\(s\)$/, '$1：已更換 $2 個永久不可用地塊'],
  [/^(.+) announces the final turn$/, '$1 宣告本回合後結束'],
  [/^(.+): (\d+[A-I])$/, '$1：放置 $2'],
  [/^(.+) founded (.+)$/, '$1 成立$2，獲創辦獎勵'],
  [/^(.+): purchased (.+)$/, '$1：買入$2股票'],
  [/^(.+) has no playable tile$/, '$1 沒有可放置的地塊'],
  [/^(.+) win$/, '$1 勝出'],
];

export function localiseGameMessage(message: string, language: Language) {
  const parts = message.split(' · ');
  if (parts.length < 2) return message;
  if (message.includes(' · 賣出 Sold ')) {
    return language === 'zh'
      ? message.replace('賣出 Sold', '賣出').replace('換股 Exchanged', '換股').replace('保留 Kept', '保留')
          .replace(/[^·]+/g, segment => HOTELS.reduce((text, hotel) => text.replace(hotel.name, hotel.zh), segment))
      : message.replace('賣出 Sold', 'Sold').replace('換股 Exchanged', 'Exchanged').replace('保留 Kept', 'Kept');
  }
  const [first, second] = parts;
  if (language === 'en') return han.test(second) ? first : parts.slice(1).join(' · ');
  if (han.test(first) && !han.test(second)) return first;
  for (const [pattern, replacement] of translations) {
    if (!pattern.test(first)) continue;
    const text = first.replace(pattern, replacement);
    const localised = HOTELS.reduce((value, hotel) => value.replace(hotel.name, hotel.zh), text);
    if (second.startsWith('勝出 ')) return localised + second.slice(2);
    return localised;
  }
  return han.test(second) ? parts.slice(1).join(' · ') : first;
}
