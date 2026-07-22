import type { SignerContext as FrameworkSignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type {
  PcztTransaction,
  SignPcztTransactionResult,
  ZcashAddress,
  ZcashViewKey,
} from "@ledgerhq/live-signer-zcash";

// Option D: coin-zcash carries its own signer type contracts instead of
// importing them from @ledgerhq/coin-bitcoin. Unlike coin-bitcoin's
// BitcoinSigner (hw-app-btc-shaped, PSBT/legacy signing, and a 3-arg
// SignerContext carrying a per-call `crypto` for its multi-currency
// dispatch), coin-zcash is single-currency and never falls back to the
// legacy transparent PSBT path -- every flow is signed as a V5 PCZT -- so it
// uses the standard framework `SignerContext<T>` (2-arg: deviceId, fn) like
// every other modern coin-module (kaspa, aleo), and the surface this package
// actually calls is the DMK Zcash signer kit's own methods (getAddress /
// getFullViewingKey / signPcztTransaction). Kept named `BitcoinSigner` for
// continuity with the copied adapter code and tests.

export type BitcoinXPub = string;
export type BitcoinAddress = {
  publicKey: string;
  bitcoinAddress: string;
  chainCode: string;
};

export interface BitcoinSigner {
  getAddress(path: string, display?: boolean): Promise<ZcashAddress>;
  getFullViewingKey(path: string): Promise<ZcashViewKey>;
  signPcztTransaction(pczt: PcztTransaction): Promise<SignPcztTransactionResult>;
}

export type SignerContext = FrameworkSignerContext<BitcoinSigner>;
