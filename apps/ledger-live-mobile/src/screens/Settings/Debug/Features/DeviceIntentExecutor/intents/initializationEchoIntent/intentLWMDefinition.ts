import { InitializationEchoIntentComponentLWM } from "./componentLWM";
import { initializationEchoIntentDefinition } from "./intentDefinition";
import type { InitializationEchoIntentPlatformDefinition } from "./types";

export const initializationEchoIntentLWMDefinition: InitializationEchoIntentPlatformDefinition = {
  ...initializationEchoIntentDefinition,
  component: InitializationEchoIntentComponentLWM,
};
