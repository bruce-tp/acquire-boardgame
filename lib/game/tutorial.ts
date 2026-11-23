import {createGame, makePlayer, type Game} from './engine.ts';

export const HOSHINO = 2;
export const PENINSULA = 1;
export const MANDARIN = 0;
export const PLACEMENT_TILE = 28;
export const FOUNDING_TILE = 29;
export const MERGER_TILE = 28;
export const FINAL_TILE = 93;
const ROSEWOOD = 3;

export type TutorialExercise = 'place' | 'found' | 'merge' | 'settle';

export function createTutorialGame(exercise: TutorialExercise): Game {
  const game = createGame('TUTORIAL', 'you', 'You');
  game.players.push(makePlayer('jamie', 'Jamie'), makePlayer('oliver', 'Oliver'));

  if (exercise === 'place' || exercise === 'found') {
    for (const tile of [0, 26, 107]) game.board[tile] = 7;
    if (exercise === 'found') game.board[PLACEMENT_TILE] = 7;
    game.players[0].hand = [exercise === 'place' ? PLACEMENT_TILE : FOUNDING_TILE];
  } else if (exercise === 'merge') {
    for (const tile of [26, 27, 38, 39, 50, 51]) game.board[tile] = PENINSULA;
    for (const tile of [29, 30, 41, 42]) game.board[tile] = HOSHINO;
    game.players[0].hand = [MERGER_TILE];
    game.players[0].shares[HOSHINO] = 4;
    game.players[1].shares[HOSHINO] = 2;
    game.bank[HOSHINO] -= 6;
  } else {
    const hotels = [
      {id: MANDARIN, tiles: [0, 1, 2, 12, 13, 14, 15, 24, 25, 27, 28, 36, 37, 39, 40], shares: [7, 4, 0]},
      {id: PENINSULA, tiles: [8, 9, 10, 11, 19, 20, 21, 23, 31, 32, 35, 43, 44, 45], shares: [0, 3, 0]},
      {id: HOSHINO, tiles: [60, 61, 72, 73, 74, 75, 85, 86, 87, 97, 99, 100], shares: [2, 0, 3]},
      {id: ROSEWOOD, tiles: [67, 68, 79, 80, 81, 82, 91, 92, 94, 106], shares: [0, 1, 2]},
    ];
    for (const {id, tiles, shares} of hotels) {
      for (const tile of tiles) game.board[tile] = id;
      shares.forEach((count, index) => { game.players[index].shares[id] = count; });
      game.bank[id] -= shares.reduce((total, count) => total + count, 0);
    }
    for (const tile of [5, 54, 102]) game.board[tile] = 7;
    game.players[0].cash = 1800;
    game.players[0].hand = [FINAL_TILE];
  }

  game.phase = 'place';
  game.deck = Array.from({length: game.board.length}, (_, tile) => tile)
    .filter(tile => game.board[tile] === -1 && !game.players[0].hand.includes(tile));
  if (exercise === 'place' || exercise === 'found') {
    for (const player of game.players) player.hand.push(...game.deck.splice(-(6 - player.hand.length)));
  }
  return game;
}
