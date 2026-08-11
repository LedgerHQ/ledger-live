export type ProductionErrorEntry = {
  chain: "ethereum" | "solana" | "bitcoin";
  errorPattern: string;
  count_14d?: number;
  source: string;
  note?: string;
};

/** Embedded catalog from vault Errors/*.md snapshots (2026-07-24 to 2026-08-03). */
export const PRODUCTION_ERROR_CATALOG: ProductionErrorEntry[] = [
  {
    chain: "ethereum",
    errorPattern: "insufficient funds",
    count_14d: 774,
    source: "Errors/ETH.md",
  },
  {
    chain: "ethereum",
    errorPattern: "nonce too low",
    count_14d: 47,
    source: "Errors/ETH.md",
  },
  {
    chain: "ethereum",
    errorPattern: "intrinsic gas too low",
    source: "Errors/ETH.md",
    note: "LIVE-26166 shipped",
  },
  {
    chain: "ethereum",
    errorPattern: "replacement transaction underpriced",
    source: "Errors/ETH.md",
  },
  {
    chain: "ethereum",
    errorPattern: "already known",
    source: "Errors/ETH.md",
    note: "LIVE-26161",
  },
  {
    chain: "solana",
    errorPattern: "blockhash not found",
    source: "Errors/Solana.md",
    note: "LIVE-32551",
  },
  {
    chain: "solana",
    errorPattern: "already been processed",
    source: "Errors/Solana.md",
    note: "LIVE-32549",
  },
  {
    chain: "solana",
    errorPattern: "insufficient funds",
    source: "Errors/Solana.md",
    note: "ATA rent; MS report 361/15d pre-broadcast gap",
  },
  {
    chain: "solana",
    errorPattern: "simulation failed",
    source: "MS team SOL report (2026-08-07)",
    count_14d: 406,
    note: "L2 classification; includes pending-op variant",
  },
  {
    chain: "bitcoin",
    errorPattern: "bad-txns-inputs-missingorspent",
    source: "Errors/BTC.md",
    note: "Server-side dominated",
  },
  {
    chain: "bitcoin",
    errorPattern: "txn-mempool-conflict",
    count_14d: 89,
    source: "Errors/BTC.md",
    note: "TxReplacementError",
  },
];
