import type { Intent, IntentPlatformDefinition } from "@ledgerhq/device-intent";
import type {
  BroadcastEvmIntentDefinition,
  BroadcastEvmIntentInput,
  BroadcastEvmJobState,
} from "@ledgerhq/live-common/wallet-api/Exchange/intents/broadcastEvm/index";

export type {
  BroadcastEvmIntentDefinition,
  BroadcastEvmIntentInput,
  BroadcastEvmJobState,
};

export type BroadcastEvmIntentExtraProps = Record<string, never>;

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
