import type { AlpacaSigner } from "./types";

// TODO: convert to async import() — needs async/await at all getSigner call sites
export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp":
      return require("./loaders/xrp").signer;
    case "stellar":
      return require("./loaders/stellar").signer;
    case "tezos":
      return require("./loaders/tezos").signer;
    case "evm":
      return require("./loaders/evm").signer;
    case "solana":
      return require("./loaders/solana").signer;
  }
  throw new Error(`signer for ${network} not implemented`);
}
