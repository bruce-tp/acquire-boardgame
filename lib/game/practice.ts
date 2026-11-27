import {createGame, makePlayer, startGame, price} from './engine.ts';
import type {GameSettings} from './settings.ts';

export function createPracticeGame(playerName = 'You · 你', settings?: GameSettings, showBlockedSpace = false) {
  const g=createGame('DEMO','you',playerName,settings);
  g.players.push(makePlayer('bot1','Evelyn'),makePlayer('bot2','Oliver'));
  startGame(g);
  g.board=Array(108).fill(-1);
  const groups=[[26,27,38],[66,67,78],[44,45]];
  if (showBlockedSpace) {
    // Leave 5E between two safe chains, so the opening board demonstrates a blocked space.
    groups[0].push(13, 14, 15, 25, 37, 39, 50, 51);
    groups[1].push(53, 64, 65, 76, 77, 88, 89, 90);
  }
  groups.forEach((ts,c)=>ts.forEach(t=>g.board[t]=c));
  [5,31,72].forEach(t=>g.board[t]=7);
  const used=new Set(g.board.map((v,i)=>v>=0?i:-1).filter(i=>i>=0));
  g.deck=Array.from({length:108},(_,i)=>i).filter(i=>!used.has(i));
  for(const p of g.players)p.hand=[];
  g.players[0].hand=showBlockedSpace ? [28,54,52,79,19,91] : [28,54,56,79,19,91];
  g.deck=g.deck.filter(t=>!g.players[0].hand.includes(t));
  for(let i=1; i<3; i++)g.players[i].hand=g.deck.splice(-6);
  for(let i=0; i<3; i++){g.players[i].shares[i]=2;
  g.bank[i]=23;
  g.players[i].cash=6000-price(g,i)*2;
  }g.turn=0;
  g.phase='place';
  g.log=['Practice table · 練習桌：兩位電腦對手會自動操作。','Build your empire · 選一塊地塊，開始建立酒店帝國。'];
  return g;
}
