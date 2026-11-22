export type GameSettings = { edition:'classic'; bonusMode:'standard'|'custom'; majorityMultiplier:5|7|10 };
export const STANDARD_SETTINGS:GameSettings = {edition:'classic',bonusMode:'standard',majorityMultiplier:10};
// Missing settings belong to rooms created before custom bonuses were introduced.
export function gameSettings(settings?:GameSettings):GameSettings {return settings??STANDARD_SETTINGS;}
export function parseSettings(input:unknown):GameSettings {
  if(input===undefined)return {...STANDARD_SETTINGS};
  if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid game settings · 遊戲設定不正確');
  const s=input as Record<string,unknown>;
  if(s.edition!=='classic'||!['standard','custom'].includes(s.bonusMode as string)||![5,7,10].includes(s.majorityMultiplier as number)||(s.bonusMode==='standard'&&s.majorityMultiplier!==10))throw Error('Invalid game settings · 遊戲設定不正確');
  return {edition:'classic',bonusMode:s.bonusMode as GameSettings['bonusMode'],majorityMultiplier:s.majorityMultiplier as GameSettings['majorityMultiplier']};
}
export function bonusAmounts(sharePrice:number,settings?:GameSettings){const majority=sharePrice*gameSettings(settings).majorityMultiplier;return {majority,minority:majority/2};}
