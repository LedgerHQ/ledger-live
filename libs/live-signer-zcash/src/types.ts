/**
 * PCZT signing types are re-exported straight from the DMK Zcash signer so the
 * app-facing `ZcashSigner` contract and `DmkSignerZcash` share the exact shapes
 * the device action consumes/produces — no local mirror to keep in sync.
 */
import type {
  OrchardActionSignature,
  PcztTransaction,
  SignPcztTransactionResult,
} from "@ledgerhq/device-signer-kit-zcash";

export type { OrchardActionSignature, PcztTransaction, SignPcztTransactionResult };

export type ZcashAppConfig = {
  version: string;
};

export type ZcashAddress = {
  publicKey: string;
  address: string;
  chainCode: string;
};

export type ZcashViewKey = {
  viewKey: string;
};

export type ZcashTrustedInput = {
  trustedInput: string;
};

export type ZcashSignature = {
  s: string;
  v: string | number;
  r: string;
};

/**
 * Structural mirror of the previous-transaction shape produced by the Bitcoin
 * signer's `splitTransaction` (`@ledgerhq/coin-bitcoin`'s `SignerTransaction`).
 *
 * Declared locally because `@ledgerhq/coin-bitcoin` already depends on this
 * package — importing its types here would create a circular dependency. The
 * `createSigner` augmentation site in coin-bitcoin verifies, via structural
 * typing, that this stays assignable to the `BitcoinSigner` contract.
 */
export type SignerTransactionLike = {
  version: Uint8Array;
  inputs: {
    prevout: Uint8Array;
    script: Uint8Array;
    sequence: Uint8Array;
    tree?: Uint8Array;
  }[];
  outputs?: { amount: Uint8Array; script: Uint8Array }[];
  locktime?: Uint8Array;
  timestamp?: Uint8Array;
  nVersionGroupId?: Uint8Array;
  nExpiryHeight?: Uint8Array;
  extraData?: Uint8Array;
  // Raw hex of the source transaction. Set by the Zcash createSigner wrapper
  // around splitTransaction so toLegacyTransaction can populate
  // serializedPreviousTransactionOverride — required for any source tx that
  // carries a shielded bundle (Orchard), whose bytes are stripped by
  // serializeTransaction, causing the device to compute a wrong ZIP-244 txid.
  rawTxHex?: string;
};

/**
 * Structural mirror of `@ledgerhq/coin-bitcoin`'s `CreateTransaction` (the
 * argument of `BitcoinSigner.createPaymentTransaction`). Only the fields the
 * Zcash transparent signing flow needs are modelled. The 5th element of each
 * input tuple is the previous output's block height — the DMK signer derives
 * the Zcash consensus branch id from it.
 */
export type BitcoinCreateTransactionLike = {
  inputs: Array<
    [
      SignerTransactionLike,
      number,
      string | null | undefined,
      number | null | undefined,
      (number | null | undefined)?,
    ]
  >;
  associatedKeysets: string[];
  changePath?: string;
  outputScriptHex: string;
  lockTime?: number;
  blockHeight?: number;
  sigHashType?: number;
  segwit?: boolean;
  additionals: string[];
  expiryHeight?: Uint8Array;
  onDeviceStreaming?: (arg: { progress: number; total: number; index: number }) => void;
  onDeviceSignatureRequested?: () => void;
  onDeviceSignatureGranted?: () => void;
};

export type ZcashSigner = {
  getAppConfig: () => Promise<ZcashAppConfig>;
  getAddress: (path: string, display?: boolean) => Promise<ZcashAddress>;
  getFullViewingKey: (path: string) => Promise<ZcashViewKey>;
  createPaymentTransaction: (arg: BitcoinCreateTransactionLike) => Promise<string>;
  signPcztTransaction: (pczt: PcztTransaction) => Promise<SignPcztTransactionResult>;
  signMessage: (path: string, messageHex: string) => Promise<ZcashSignature>;
};
