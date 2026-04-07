import type { AlpacaSigner } from "./types";

/**
 * Lazy-load Alpaca signer modules so wallet-cli (EVM-only flows) does not bundle XRP/Stellar/Tezos HW stacks.
 */
// TODO: we could also use dynamic import here but we need to update everything to async/await where getSigner is used
export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      return require("./families/xrp/signer").default;
    }
    case "stellar": {
      return require("./families/stellar/signer").default;
    }
    case "tezos": {
      return require("./families/tezos/signer").default;
    }
    case "evm": {
      return require("./families/evm/signer").default;
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
