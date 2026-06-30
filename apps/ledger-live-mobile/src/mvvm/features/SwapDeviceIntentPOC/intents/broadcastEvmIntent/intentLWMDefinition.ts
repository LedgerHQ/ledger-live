import { broadcastEvmIntentDefinition } from "@ledgerhq/live-common/wallet-api/Exchange/intents/broadcastEvm/index";
import { BroadcastEvmIntentComponentLWM } from "./componentLWM";
import type { BroadcastEvmIntentPlatformDefinition } from "./types";

export const broadcastEvmIntentLWMDefinition: BroadcastEvmIntentPlatformDefinition = {
  ...broadcastEvmIntentDefinition,
  component: BroadcastEvmIntentComponentLWM,
};
