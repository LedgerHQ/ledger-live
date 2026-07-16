import type { IntentDefinition } from "@ledgerhq/device-intent";
import type { Account, EIP712Message } from "@ledgerhq/types-live";

/**
 * Discriminated union of states emitted by {@link signPermit2EvmJob}.
 *
 * Mirrors {@link SignApprovalEvmJobState} so the orchestrator can reuse a
 * single sign-result state machine: emits an initial `preparing` value
 * synchronously, surfaces device-driven progress as the DMK signer does,
 * and converts errors into a terminal `failed` state instead of an
 * observable error.
 *
 * Permit2 produces a 65-byte signature (`0x` + r + s + v) that is fed
 * back into {@link DexBuildContext.permitSignature} when the DEX
 * transaction is built.
 */
export type SignPermit2EvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signatureHex: string }
  | { type: "failed"; error: Error };

/**
 * Input passed to {@link signPermit2EvmJob} at runtime. Captured upfront
 * by the orchestrator so the job is self-contained once the device flow
 * starts. `typedData` is the wallet-side normalised EIP-712 payload
 * (built by `toEIP712Message` from `quote.quoteDetails.permitData.typedData`).
 */
export type SignPermit2EvmIntentInput = {
  /** Main EVM account that owns the spending allowance (signer source). */
  account: Account;
  /** EVM crypto-currency id (`mainAccount.currency.id`) for analytics / logging. */
  currencyId: string;
  /** BIP-44 derivation path used by the device when signing (`mainAccount.freshAddressPath`). */
  derivationPath: string;
  /** Normalised EIP-712 typed-data payload (Permit2 `PermitSingle`). */
  typedData: EIP712Message;
};

export type SignPermit2EvmIntentDefinition = IntentDefinition<
  SignPermit2EvmJobState,
  SignPermit2EvmIntentInput
>;
