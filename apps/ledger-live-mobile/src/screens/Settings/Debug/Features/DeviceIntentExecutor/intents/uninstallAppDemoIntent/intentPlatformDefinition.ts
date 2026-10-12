import { UninstallAppDemoIntentComponent } from "./component";
import { uninstallAppDemoIntentDefinition } from "./intentDefinition";
import { type UninstallAppDemoIntentPlatformDefinition } from "./types";

export const uninstallAppDemoIntentPlatformDefinition: UninstallAppDemoIntentPlatformDefinition = {
  ...uninstallAppDemoIntentDefinition,
  component: UninstallAppDemoIntentComponent,
};
