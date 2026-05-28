import type { IntentDefinition } from "@ledgerhq/device-intent";
import type { Account, EIP712Message } from "@ledgerhq/types-live";

/**
 * Discriminated union of states emitted by {@link signRfqOrderEvmJob}.
 *
 * Mirrors {@link SignPermit2EvmJobState} so the orchestrator can reuse a
 * single sign-result state machine: emits an initial `preparing` value
 * synchronously, surfaces device-driven progress as the DMK signer does,
 * and converts errors into a terminal `failed` state instead of an
 * observable error.
 *
 * The RFQ flow forwards the 65-byte signature to the partner's `/submit`
 * endpoint instead of feeding it back into a DEX builder context.
 */
export type SignRfqOrderEvmJobState =
  | { type: "preparing" }
  | { type: "loading-context" }
  | { type: "awaiting-confirmation" }
  | { type: "signing" }
  | { type: "signed"; signatureHex: string }
  | { type: "failed"; error: Error };

/**
 * Input passed to {@link signRfqOrderEvmJob} at runtime.
 *
 * `typedData` is the wallet-side normalised EIP-712 payload built by
 * {@link toRfqEIP712Message} from `quote.quoteDetails.permitData.typedData`,
 * with `primaryType` pinned for UniswapX (`"PermitWitnessTransferFrom"`)
 * and preserved for 1inch Fusion.
 */
export type SignRfqOrderEvmIntentInput = {
  /** Main EVM account that signs the RFQ order. */
  account: Account;
  /** EVM crypto-currency id (`mainAccount.currency.id`) for analytics / logging. */
  currencyId: string;
  /** BIP-44 derivation path used by the device when signing (`mainAccount.freshAddressPath`). */
  derivationPath: string;
  /** Normalised EIP-712 typed-data payload for the RFQ order. */
  typedData: EIP712Message;
};

export type SignRfqOrderEvmIntentDefinition = IntentDefinition<
  SignRfqOrderEvmJobState,
  SignRfqOrderEvmIntentInput
>;
