import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type { QuoteApprovalTransaction } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";

export type SignApprovalEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

export type SignApprovalEvmIntentInput = {
  /** Derivation path of the EVM account that owns the spending allowance. */
  derivationPath: string;
  /** Currency id of the parent EVM chain (e.g. `"ethereum"`). */
  currencyId: string;
  /** Approval transaction blob coming from the swap quote. */
  approvalTransaction: QuoteApprovalTransaction;
};

export type SignApprovalEvmIntentExtraProps = Record<string, never>;

export type SignApprovalEvmIntentDefinition = IntentDefinition<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput
>;

export type SignApprovalEvmIntentPlatformDefinition = IntentPlatformDefinition<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput,
  SignApprovalEvmIntentExtraProps
>;

export type SignApprovalEvmIntent = Intent<
  SignApprovalEvmJobState,
  SignApprovalEvmIntentInput,
  SignApprovalEvmIntentExtraProps
>;
