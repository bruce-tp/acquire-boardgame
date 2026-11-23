import {createGame, makePlayer, type Game} from './engine.ts';

export const HOSHINO = 2;
export const PENINSULA = 1;
export const MANDARIN = 0;
export const FOUNDING_TILE = 29;
export const MERGER_TILE = 28;

export type TutorialExercise = 'found' | 'merge' | 'settle';

export function createTutorialGame(exercise: TutorialExercise): Game {
  const game = createGame('TUTORIAL', 'you', 'You');
  game.players.push(makePlayer('jamie', 'Jamie'), makePlayer('oliver', 'Oliver'));

  if (exercise === 'found') {
    game.board[28] = 7;
    game.players[0].hand = [FOUNDING_TILE];
  } else if (exercise === 'merge') {
    for (const tile of [26, 27, 38, 39, 50, 51]) game.board[tile] = PENINSULA;
    for (const tile of [29, 30, 41, 42]) game.board[tile] = HOSHINO;
    game.players[0].hand = [MERGER_TILE];
    game.players[0].shares[HOSHINO] = 4;
    game.players[1].shares[HOSHINO] = 2;
    game.bank[HOSHINO] -= 6;
  } else {
    game.board.fill(MANDARIN, 0, 41);
    game.players[0].cash = 1800;
    game.players[0].shares[MANDARIN] = 7;
    game.players[1].shares[MANDARIN] = 4;
    game.bank[MANDARIN] -= 11;
  }

  game.phase = exercise === 'settle' ? 'buy' : 'place';
  game.deck = Array.from({length: game.board.length}, (_, tile) => tile)
    .filter(tile => game.board[tile] === -1 && !game.players[0].hand.includes(tile));
  return game;
}
