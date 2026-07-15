import type { IntentDefinition } from "@ledgerhq/device-intent";
import type { Account } from "@ledgerhq/types-live";
import type { DexTransactionData } from "../../dex";

/**
 * Discriminated union of states emitted by {@link signSwapEvmJob}. Mirrors
 * {@link SignApprovalEvmJobState} so the orchestrator can reuse a single
 * sign-then-broadcast state machine.
 */
export type SignSwapEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

/**
 * Input passed to {@link signSwapEvmJob} at runtime. Captured upfront by
 * the orchestrator so the job is self-contained once the device flow starts.
 */
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

export type SignSwapEvmIntentDefinition = IntentDefinition<
  SignSwapEvmJobState,
  SignSwapEvmIntentInput
>;
