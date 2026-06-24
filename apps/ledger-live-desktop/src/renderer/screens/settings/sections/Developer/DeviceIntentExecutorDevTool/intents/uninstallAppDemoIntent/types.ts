import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type UninstallAppDemoIntentJobState =
  | { type: "promptUninstall"; confirm: () => void; skip: () => void }
  | { type: "uninstalling"; userInteraction?: string }
  | { type: "uninstallSuccess" }
  | { type: "uninstallFailed"; error: unknown };

export type UninstallAppDemoIntentInput = { appName: string };

export type UninstallAppDemoIntentExtraProps = { appName: string };

export type UninstallAppDemoIntentDefinition = IntentDefinition<
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentInput
>;

export type UninstallAppDemoIntentPlatformDefinition = IntentPlatformDefinition<
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentInput,
  UninstallAppDemoIntentExtraProps
>;

export type UninstallAppDemoIntent = Intent<
  UninstallAppDemoIntentJobState,
  UninstallAppDemoIntentInput,
  UninstallAppDemoIntentExtraProps
>;
