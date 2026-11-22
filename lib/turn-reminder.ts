export const TURN_REMINDER_DELAY = 20_000;

/** Ring once after an idle period. Actual player input starts a new period. */
export function createTurnReminder(remind: () => void) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;

  const activity = () => {
    if (stopped) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      if (!stopped) remind();
    }, TURN_REMINDER_DELAY);
  };

  const stop = () => {
    stopped = true;
    clearTimeout(timer);
  };

  activity();
  return { activity, stop };
}
