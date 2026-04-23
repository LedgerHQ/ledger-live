import { UninstallAppDemoIntentComponentLWM } from "./componentLWM";
import { uninstallAppDemoIntentDefinition } from "./intentDefinition";
import { type UninstallAppDemoIntentPlatformDefinition } from "./types";

export const uninstallAppDemoIntentLWMDefinition: UninstallAppDemoIntentPlatformDefinition = {
  ...uninstallAppDemoIntentDefinition,
  component: UninstallAppDemoIntentComponentLWM,
};
