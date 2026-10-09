import type { ExplorerView } from "@domain/entity-currency-crypto";
import { getLocalNodeChain } from ".";

/**
 * Where to show `currencyId`'s transactions and addresses on its local node, `undefined` when
 * nothing local can: its default explorer only knows the real network. Only the chains whose
 * family lists a UI port have one.
 */
export function getLocalNodeExplorerView(currencyId: string): ExplorerView | undefined {
  const chain = getLocalNodeChain(currencyId);
  if (chain?.ui === undefined) return undefined;
  const ui = `http://localhost:${chain.ui}`;
  switch (chain.family) {
    // Blockscout
    case "evm":
      return { tx: `${ui}/tx/$hash`, address: `${ui}/address/$address` };
    // The Solana Explorer, on the local validator rather than a public cluster
    case "solana": {
      const cluster = `?cluster=custom&customUrl=${encodeURIComponent(`http://localhost:${chain.rpc}`)}`;
      return { tx: `${ui}/tx/$hash${cluster}`, address: `${ui}/address/$address${cluster}` };
    }
    default:
      return undefined;
  }
}
