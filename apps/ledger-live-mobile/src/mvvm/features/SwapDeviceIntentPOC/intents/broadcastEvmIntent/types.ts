import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

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

export type BroadcastEvmIntentExtraProps = Record<string, never>;

export type BroadcastEvmIntentDefinition = IntentDefinition<
  BroadcastEvmJobState,
  BroadcastEvmIntentInput
>;

export type BroadcastEvmIntentPlatformDefinition = IntentPlatformDefinition<
  BroadcastEvmJobState,
  BroadcastEvmIntentInput,
  BroadcastEvmIntentExtraProps
>;

export type BroadcastEvmIntent = Intent<
  BroadcastEvmJobState,
  BroadcastEvmIntentInput,
  BroadcastEvmIntentExtraProps
>;
