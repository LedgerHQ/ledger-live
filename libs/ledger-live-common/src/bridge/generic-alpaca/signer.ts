import type { AlpacaSigner } from "./types";
import evmSigner from "./families/evm/signer";
import xrpSigner from "./families/xrp/signer";
import stellarSigner from "./families/stellar/signer";
import tezosSigner from "./families/tezos/signer";

export function getSigner(network: string): AlpacaSigner {
  switch (network) {
    case "ripple":
    case "xrp": {
      return xrpSigner;
    }
    case "stellar": {
      return stellarSigner;
    }
    case "tezos": {
      return tezosSigner;
    }
    case "evm": {
      return evmSigner;
    }
  }
  throw new Error(`signer for ${network} not implemented`);
}
