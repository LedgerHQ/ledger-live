import { BroadcastEvmIntentComponentLWM } from "./componentLWM";
import { broadcastEvmIntentDefinition } from "./intentDefinition";
import type { BroadcastEvmIntentPlatformDefinition } from "./types";

export const broadcastEvmIntentLWMDefinition: BroadcastEvmIntentPlatformDefinition = {
  ...broadcastEvmIntentDefinition,
  component: BroadcastEvmIntentComponentLWM,
};
