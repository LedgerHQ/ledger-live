import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type { Account } from "@ledgerhq/types-live";
import type { QuoteApprovalTransaction } from "@ledgerhq/live-common/wallet-api/Exchange/quotes/types";

export type SignApprovalEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signedTxHex: string }
  | { type: "failed"; error: Error };

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
