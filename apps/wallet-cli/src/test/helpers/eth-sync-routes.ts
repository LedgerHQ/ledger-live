import type { Route } from "./mock-server";

// HTTP routes required by EVM bridge sync (getAccountShape + getTokensSyncHash).
// Used by discover, receive --verify, and send command contract tests.
export const ETH_SYNC_ROUTES: Route[] = [
  {
    method: "GET",
    match: /\/block\/current$/,
    response: {
      hash: "0x0000000000000000000000000000000000000000000000000000000000000001",
      height: 20_000_000,
      time: "2024-01-01T00:00:00.000Z",
      txs: [],
    },
  },
  {
    method: "GET",
    match: /\/address\/[^/]+\/balance$/,
    response: { balance: "0" },
  },
  {
    method: "GET",
    match: /\/address\/[^/]+\/txs/,
    response: { data: [], token: null },
  },
  {
    method: "POST",
    match: /erc20\/balances/,
    response: [],
  },
  {
    method: "GET",
    match: /\/v1\/currencies/,
    response: [{ id: "ethereum" }],
    headers: { "X-Ledger-Commit": "mock-sync-hash-0000000000000000" },
  },
];
