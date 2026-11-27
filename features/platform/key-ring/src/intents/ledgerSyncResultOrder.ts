/**
 * Orders late results across runs. Each host creates one and passes it in every add member and
 * remove member input. After a disconnect, the executor's Retry starts a new job and the
 * disconnected one can still answer late: its result is dropped once a newer run delivered.
 *
 * @example
 * ```ts
 * // Module scope of the host: one order for both intents.
 * const ledgerSyncResultOrder = createLedgerSyncResultOrder();
 *
 * createIntent(addMemberIntentLWMDefinition, {
 *   session,
 *   client: keyRing,
 *   resultOrder: ledgerSyncResultOrder,
 * });
 * ```
 */
export function createLedgerSyncResultOrder(): LedgerSyncResultOrder {
  let issued = 0;
  let delivered = 0;
  return {
    take() {
      return ++issued;
    },
    isStale(ticket) {
      return ticket < delivered;
    },
    markDelivered(ticket) {
      delivered = Math.max(delivered, ticket);
    },
  };
}

/** The tickets of `createLedgerSyncResultOrder`. The Ledger Sync jobs call it; apps only pass it. */
export type LedgerSyncResultOrder = Readonly<{
  /** Called when a run starts. Returns its ticket, newer than every ticket taken before. */
  take: () => number;
  /** True when a newer ticket was already delivered: the result of this one must be dropped. */
  isStale: (ticket: number) => boolean;
  /** Called when the result of the run that took `ticket` was delivered. */
  markDelivered: (ticket: number) => void;
}>;
