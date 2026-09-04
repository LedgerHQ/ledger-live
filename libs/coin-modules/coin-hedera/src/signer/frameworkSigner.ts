import {
  deserializeTransaction,
  getHederaTransactionBodyBytes,
  serializeSignature,
} from "../logic/utils";
import type { HederaSigner } from "../types";

export type HederaFrameworkSigner = {
  getAddress(path: string): Promise<{ path: string; address: string; publicKey: string }>;
  signTransaction(path: string, unsignedTxHex: string): Promise<string>;
};

/** Adapts the device-level {@link HederaSigner} to the generic framework. */
export function createFrameworkSigner(signer: HederaSigner): HederaFrameworkSigner {
  return {
    async getAddress(path) {
      const publicKey = await signer.getPublicKey(path);
      // Hedera has no derivable address; the 0.0.x id comes from the discovery scan.
      return { path, address: publicKey, publicKey };
    },
    // The framework passes a path and an options object; hw-app-hedera takes neither and signs
    // from account index 0 only (device-app limit), so both are dropped — as in the legacy bridge.
    async signTransaction(_path, unsignedTxHex) {
      const tx = deserializeTransaction(unsignedTxHex);
      const signature = await signer.signTransaction(getHederaTransactionBodyBytes(tx));
      return serializeSignature(signature);
    },
  };
}
