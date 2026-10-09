import type { LocalChain } from ".";

/**
 * What coin-sandbox's server answers at `GET /<family>/chains`, for a few chains of each family
 * Ledger Live runs locally: copied from a running server, for tests that load local chains.
 */
export const LOCAL_CHAINS: Readonly<Record<string, LocalChain[]>> = {
  evm: [
    { family: "evm", network: "sonic", ui: 3000, api: 4000, rpc: 8545, status: "up" },
    { family: "evm", network: "base", ui: 3003, api: 4003, rpc: 8548, status: "up" },
    // Atlas: no UI
    { family: "evm", network: "ethereum", api: 4032, rpc: 8577, status: "up" },
  ],
  solana: [{ family: "solana", network: "solana", ui: 3100, ws: 8900, rpc: 8899, status: "up" }],
  xrp: [{ family: "xrp", network: "ripple", rpc: 5005, status: "up" }],
  tron: [{ family: "tron", network: "tron", api: 9090, status: "up" }],
};
