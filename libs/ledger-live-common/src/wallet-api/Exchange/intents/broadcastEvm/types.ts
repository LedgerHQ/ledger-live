import type { IntentDefinition } from "@ledgerhq/device-intent";

/**
 * Discriminated union of states emitted by {@link broadcastEvmJob}.
 *
 * The job broadcasts a pre-signed transaction and polls the node for the
 * receipt. Errors are surfaced as a terminal `failed` value so the
 * orchestrator can react in `onIntentJobComplete`.
 */
export type BroadcastEvmJobState =
  | { type: "broadcasting" }
  | { type: "broadcasted"; hash: string }
  | { type: "waiting-receipt"; hash: string; pollCount: number }
  | { type: "confirmed"; hash: string; blockHeight: number }
  | { type: "failed"; error: Error };

export type BroadcastEvmIntentInput = {
  /** Fully signed (RLP-serialised) EVM transaction hex, as produced by the sign intent. */
  signedTxHex: string;
  /** Currency id of the parent EVM chain (e.g. `"ethereum"`). */
  currencyId: string;
};

export type BroadcastEvmIntentDefinition = IntentDefinition<
  BroadcastEvmJobState,
  BroadcastEvmIntentInput
>;
