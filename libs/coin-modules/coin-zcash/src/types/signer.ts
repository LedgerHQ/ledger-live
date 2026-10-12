import type { SignerContext as FrameworkSignerContext } from "@ledgerhq/ledger-wallet-framework/signer";
import type {
  BitcoinCreateTransactionLike,
  PcztTransaction,
  SignPcztTransactionResult,
  ZcashAddress,
  ZcashShieldedAddress,
  ZcashViewKey,
} from "@ledgerhq/live-signer-zcash";

// Option D: coin-zcash carries its own signer type contracts instead of
// importing them from @ledgerhq/coin-bitcoin. Unlike coin-bitcoin's
// BitcoinSigner (hw-app-btc-shaped, and a 3-arg SignerContext carrying a
// per-call `crypto` for its multi-currency dispatch), coin-zcash is
// single-currency, so it uses the standard framework `SignerContext<T>`
// (2-arg: deviceId, fn) like every other modern coin-module (kaspa, aleo).
// Which signing path a send takes depends on the bridge's mode: with the
// shielded engine every flow is signed as a PCZT (signPcztTransaction);
// without it (transparent-only mode, `src/legacy`) a transparent send is
// signed by the device's legacy transaction path (createPaymentTransaction).
// Kept named `BitcoinSigner` for continuity with the copied adapter code and
// tests.

export type BitcoinAddress = {
  publicKey: string;
  bitcoinAddress: string;
  chainCode: string;
};

export interface BitcoinSigner {
  getAddress(path: string, display?: boolean): Promise<ZcashAddress>;
  getFullViewingKey(path: string): Promise<ZcashViewKey>;
  getShieldedAddress(path: string, display?: boolean): Promise<ZcashShieldedAddress>;
  signPcztTransaction(pczt: PcztTransaction): Promise<SignPcztTransactionResult>;
  /** Transparent send signed by the device, for hosts without the shielded engine (`src/legacy`). */
  createPaymentTransaction(arg: BitcoinCreateTransactionLike): Promise<string>;
}

export type SignerContext = FrameworkSignerContext<BitcoinSigner>;
