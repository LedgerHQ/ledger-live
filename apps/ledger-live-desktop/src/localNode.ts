/**
 * Currencies that run on their local node (coin-sandbox's `scripts/chain <currency> up`), from
 * `LEDGER_LOCAL_NODE`, comma-separated: `LEDGER_LOCAL_NODE=base,sonic`.
 *
 * Read by the main process, which gives local mode its own profile, and by the renderer, which
 * points those currencies at localhost.
 */
export const LOCAL_NODE_CURRENCIES: readonly string[] = (process.env.LEDGER_LOCAL_NODE ?? "")
  .split(",")
  .map(id => id.trim())
  .filter(Boolean);
