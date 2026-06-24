import { UninstallAppDemoIntentComponentLWD } from "./componentLWD";
import { uninstallAppDemoIntentDefinition } from "./intentDefinition";
import { type UninstallAppDemoIntentPlatformDefinition } from "./types";

export const uninstallAppDemoIntentLWDDefinition: UninstallAppDemoIntentPlatformDefinition = {
  ...uninstallAppDemoIntentDefinition,
  component: UninstallAppDemoIntentComponentLWD,
};
