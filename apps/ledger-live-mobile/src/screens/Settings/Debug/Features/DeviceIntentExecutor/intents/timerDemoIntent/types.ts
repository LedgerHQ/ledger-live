import type { Intent, IntentDefinition, IntentPlatformDefinition } from "@ledgerhq/device-intent";

export type TimerDemoIntentJobState = { type: "tick"; count: number; total: number };

export type TimerDemoIntentInput = { tickCount: number };

export type TimerDemoIntentExtraProps = Record<string, never>;

export type TimerDemoIntentDefinition = IntentDefinition<
  TimerDemoIntentJobState,
  TimerDemoIntentInput
>;

export type TimerDemoIntentPlatformDefinition = IntentPlatformDefinition<
  TimerDemoIntentJobState,
  TimerDemoIntentInput,
  TimerDemoIntentExtraProps
>;

export type TimerDemoIntent = Intent<
  TimerDemoIntentJobState,
  TimerDemoIntentInput,
  TimerDemoIntentExtraProps
>;
