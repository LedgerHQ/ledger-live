import { InitializationEchoIntentComponentLWD } from "./componentLWD";
import { initializationEchoIntentDefinition } from "./intentDefinition";
import { type InitializationEchoIntentPlatformDefinition } from "./types";

export const initializationEchoIntentLWDDefinition: InitializationEchoIntentPlatformDefinition = {
  ...initializationEchoIntentDefinition,
  component: InitializationEchoIntentComponentLWD,
};
