import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type { DexTransactionData } from "@ledgerhq/live-common/wallet-api/Exchange/dex/index";
import type { Account } from "@ledgerhq/types-live";

export type SignSwapEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

export type SignSwapEvmIntentInput = {
  /** Main EVM account that owns the source funds (signer + nonce source). */
  account: Account;
  /** Provider-built swap transaction blob, as returned by `buildProviderTransactionData()`. */
  transactionData: DexTransactionData;
  /** EVM crypto-currency id (`mainAccount.currency.id`) for chainId + node lookup. */
  currencyId: string;
  /** BIP-44 derivation path used by the device when signing (`mainAccount.freshAddressPath`). */
  derivationPath: string;
};

export type SignSwapEvmIntentExtraProps = Record<string, never>;

export type SignSwapEvmIntentDefinition = IntentDefinition<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput
>;

export type SignSwapEvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput,
  SignSwapEvmIntentExtraProps
>;

export type SignSwapEvmIntent = Intent<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput,
  SignSwapEvmIntentExtraProps
>;
