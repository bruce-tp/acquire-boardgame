export const PURCHASE_DISPLAY_MS = 15_000;
export const MERGER_DISPLAY_MS = 25_000;

export type ShareholderAward = {amount: number; rank: 'majority' | 'minority' | 'both' | 'tied-majority' | 'tied-minority'};

export type MergerDecision = {
  playerName: string;
  starting: number;
  sold: number | null;
  received: number | null;
  kept: number;
  award?: ShareholderAward | null;
};

export const PURCHASE_BUFFER_MS = 5 * 60_000;

export type PurchaseAnnouncement = {
  id: string;
  playerName: string;
  items: {chain: number; quantity: number; unitPrice: number}[];
  total: number;
  createdAt: number;
  mergerResult?: {acquirer: number; acquired: number; decisions: MergerDecision[]};
  bonus?: {chain: number; payouts: {playerName: string; amount: number}[]};
};
export type DeliveredPurchaseAnnouncement = PurchaseAnnouncement & {remainingMs: number};

export function announcementDisplayMs(event: PurchaseAnnouncement) {
  return event.mergerResult ? MERGER_DISPLAY_MS : PURCHASE_DISPLAY_MS;
}

export function recentPurchases(events: PurchaseAnnouncement[] = [], now = Date.now()) {
  return events.filter(event => now - event.createdAt < PURCHASE_BUFFER_MS).slice(-256);
}

/** Receipt times live separately from the game, so polling cannot invalidate a turn. */
export async function deliverPurchases(db: D1Database, code: string, viewer: number, events: PurchaseAnnouncement[] = []) {
  const now = Date.now();
  const recent = recentPurchases(events, now);
  if (!recent.length) return [];
  const key = `!purchase-receipts:${code}:${viewer}`;
  for (let attempt = 0; attempt < 5; attempt++) {
    const row = await db.prepare('SELECT state,version FROM rooms WHERE code=?').bind(key)
      .first<{state: string; version: number}>();
    const seen: Record<string, number> = row ? JSON.parse(row.state) : {};
    const updated: Record<string, number> = {};
    let changed = false;
    for (const event of recent) {
      const known = Object.hasOwn(seen, event.id);
      updated[event.id] = known ? seen[event.id] : now;
      if (!known) changed = true;
    }
    if (changed) {
      const result = row
        ? await db.prepare('UPDATE rooms SET state=?,version=?,updated_at=? WHERE code=? AND version=?')
          .bind(JSON.stringify(updated), row.version + 1, now, key, row.version).run()
        : await db.prepare('INSERT OR IGNORE INTO rooms(code,state,version,updated_at) VALUES(?,?,?,?)')
          .bind(key, JSON.stringify(updated), 0, now).run();
      if (!result.meta.changes) continue;
    }
    return recent.flatMap(event => {
      const remainingMs = announcementDisplayMs(event) - (now - updated[event.id]);
      return remainingMs > 0 ? [{...event, remainingMs}] : [];
    });
  }
  // A later poll retries delivery if several tabs updated receipts simultaneously.
  return [];
}
