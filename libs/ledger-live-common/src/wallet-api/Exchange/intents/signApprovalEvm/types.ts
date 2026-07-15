import type { IntentDefinition } from "@ledgerhq/device-intent";
import type { Account } from "@ledgerhq/types-live";
import type { QuoteApprovalTransaction } from "../../quotes/types";

/**
 * Discriminated union of states emitted by {@link signApprovalEvmJob}.
 *
 * Mirrors the surfaceable steps of the DMK Ethereum signer plus a
 * synchronous `preparing` value emitted before the first device call so
 * the executor never renders the intent component with `jobState: undefined`.
 */
export type SignApprovalEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

/**
 * Input passed to {@link signApprovalEvmJob} at runtime. Captured upfront
 * by the orchestrator so the job is self-contained (no live-app round-trip
 * once the device flow starts).
 */
export type SignApprovalEvmIntentInput = {
  /** Main EVM account that owns the spending allowance (signer + nonce source). */
  account: Account;
  /** Approval transaction blob coming from the swap quote. */
  approvalTransaction: QuoteApprovalTransaction;
  /** EVM crypto-currency id (`mainAccount.currency.id`) for chainId + node lookup. */
  currencyId: string;
  /** BIP-44 derivation path used by the device when signing (`mainAccount.freshAddressPath`). */
  derivationPath: string;
};

export type SignApprovalEvmIntentDefinition = IntentDefinition<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput
>;
