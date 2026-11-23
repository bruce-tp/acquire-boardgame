import type {DeliveredPurchaseAnnouncement} from './game/purchase-announcements.ts';
import {announcementDisplayMs} from './game/purchase-announcements.ts';

export type VisiblePurchase = DeliveredPurchaseAnnouncement & {expiresAt: number};

/** Delivery can change without a turn/version change (for example after a retry). */
export function acceptRoomView<T extends {code: string; version: number; purchaseAnnouncements: DeliveredPurchaseAnnouncement[]}>(previous: T | null, incoming: T): T {
  if (previous?.code === incoming.code) {
    if (previous.version > incoming.version) return previous;
    if (previous.version === incoming.version) {
      const before = previous.purchaseAnnouncements.map(notice => notice.id).join(',');
      const after = incoming.purchaseAnnouncements.map(notice => notice.id).join(',');
      return before === after ? previous : {...previous, purchaseAnnouncements: incoming.purchaseAnnouncements};
    }
  }
  return incoming;
}

/** Each ID gets one deadline; another poll or another purchase never extends it. */
export function createPurchaseNoticeQueue(onChange: (visible: VisiblePurchase[]) => void) {
  const seen = new Set<string>();
  const active = new Map<string, VisiblePurchase>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  function refresh() {
    if (stopped) return;
    clearTimeout(timer);
    const now = Date.now();
    for (const [id, notice] of active) if (notice.expiresAt <= now) active.delete(id);
    onChange([...active.values()]);
    if (active.size) {
      const deadline = Math.min(...[...active.values()].map(notice => notice.expiresAt));
      timer = setTimeout(refresh, Math.max(0, deadline - now));
    }
  }
  return {
    receive(incoming: DeliveredPurchaseAnnouncement[]) {
      if (stopped) return;
      let added = false;
      const now = Date.now();
      for (const notice of incoming) {
        if (seen.has(notice.id)) continue;
        seen.add(notice.id);
        const duration = Math.min(announcementDisplayMs(notice), notice.remainingMs);
        if (!(duration > 0)) continue;
        active.set(notice.id, {...notice, expiresAt: now + duration});
        added = true;
      }
      if (added) refresh();
    },
    dismiss(ids: string[]) {
      for (const id of ids) active.delete(id);
      refresh();
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      active.clear();
      seen.clear();
    },
  };
}
