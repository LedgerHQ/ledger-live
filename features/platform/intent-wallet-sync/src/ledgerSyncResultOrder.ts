/** Orders late results across runs. Each host creates one and passes it in every add member and remove member input. */
export type LedgerSyncResultOrder = Readonly<{
  /** Called when a run starts. Returns its ticket, newer than every ticket taken before. */
  take: () => number;
  /** True when a newer ticket was already delivered: the result of this one must be dropped. */
  isStale: (ticket: number) => boolean;
  /** Called when the result of the run that took `ticket` was delivered. */
  markDelivered: (ticket: number) => void;
}>;

/**
 * Orders late results across runs. Each host creates one and passes it in every add member and
 * remove member input. After a disconnect, the executor's Retry starts a new job and the
 * disconnected one can still answer late: its result is dropped once a newer run delivered.
 */
export function createLedgerSyncResultOrder(): LedgerSyncResultOrder {
  let issued = 0;
  let delivered = 0;
  return {
    take: () => ++issued,
    isStale: ticket => ticket < delivered,
    markDelivered: ticket => {
      delivered = Math.max(delivered, ticket);
    },
  };
}
