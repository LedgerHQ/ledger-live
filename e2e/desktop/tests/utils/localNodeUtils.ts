/** Currencies the app runs on their coin-sandbox local node, as passed to it in `LEDGER_LOCAL_NODE`. */
const LOCAL_NODE_CURRENCIES: ReadonlySet<string> = new Set(
  (process.env.LEDGER_LOCAL_NODE ?? "")
    .split(",")
    .map(id => id.trim())
    .filter(Boolean),
);

/**
 * Whether a test on `currencyId` belongs to this run: all of them on the real networks, only the
 * local ones when `LEDGER_LOCAL_NODE` is set, so a local run never also hits mainnet.
 */
export const isInLocalNodeRun = (currencyId: string): boolean =>
  LOCAL_NODE_CURRENCIES.size === 0 || LOCAL_NODE_CURRENCIES.has(currencyId);
