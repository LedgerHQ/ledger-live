// Outlives the Send flow so a reopened Send can't rent twice (LIVE-38598 item 6). In memory only.
export const PENDING_RENT_MIN_WINDOW_MS = 180_000;
// Our clock and the chain's may disagree, and a payment takes a few blocks to land. The in-flow
// retry lock uses it too, so this hold never ends before the lock.
export const PENDING_RENT_EXPIRY_MARGIN_MS = 30_000;
// On-chain re-read cadence once the provider's wait ends before the rent's window does.
export const PENDING_RENT_RECHECK_INTERVAL_MS = 10_000;

export type PendingRent = Readonly<{
  mainAccountId: string;
  orderId: string;
  payerAddress: string;
  paymentTxId: string;
  receiverAddress: string;
  energyNeeded: bigint;
  expiresAt: number;
  /** Held before its submit returned: energy already on-chain can't be its delivery. */
  submitting?: boolean;
}>;

const pendingRents = new Map<string, PendingRent>();
// The last rent seen landing per account, so every Send watching it learns of it, not only the one
// that saw it. Expiry isn't a delivery and doesn't land here.
const deliveries = new Map<string, RentDelivery>();

export type RentDelivery = Readonly<{ paymentTxId: string; at: number }>;
const listeners = new Set<(mainAccountId: string) => void>();

function notify(mainAccountId: string): void {
  for (const listener of listeners) listener(mainAccountId);
}

// Lets a watcher re-read when a rent is recorded after its first look.
export function subscribePendingRents(listener: (mainAccountId: string) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function recordPendingRent(
  rent: Omit<PendingRent, "expiresAt">,
  paymentExpiresAt: number,
  now: number = Date.now(),
): void {
  const expiresAt = Math.max(
    paymentExpiresAt + PENDING_RENT_EXPIRY_MARGIN_MS,
    now + PENDING_RENT_MIN_WINDOW_MS,
  );
  pendingRents.set(rent.mainAccountId, { ...rent, expiresAt });
  notify(rent.mainAccountId);
}

export function getPendingRent(
  mainAccountId: string,
  now: number = Date.now(),
): PendingRent | null {
  const rent = pendingRents.get(mainAccountId);
  if (!rent) return null;
  if (now >= rent.expiresAt) {
    pendingRents.delete(mainAccountId);
    notify(mainAccountId);
    return null;
  }
  return rent;
}

/** Ends the hold because the rent's energy landed. Returns the delivery, or null when the account
 * holds no rent, or another one than `paymentTxId`. */
export function markPendingRentDelivered(
  mainAccountId: string,
  paymentTxId?: string,
  now: number = Date.now(),
): RentDelivery | null {
  const rent = pendingRents.get(mainAccountId);
  if (!rent || (paymentTxId !== undefined && rent.paymentTxId !== paymentTxId)) return null;
  const delivery = { paymentTxId: rent.paymentTxId, at: now };
  pendingRents.delete(mainAccountId);
  deliveries.set(mainAccountId, delivery);
  notify(mainAccountId);
  return delivery;
}

export function getRentDelivery(mainAccountId: string): RentDelivery | null {
  return deliveries.get(mainAccountId) ?? null;
}

export function resetPendingRentsForTests(): void {
  pendingRents.clear();
  deliveries.clear();
  listeners.clear();
}
