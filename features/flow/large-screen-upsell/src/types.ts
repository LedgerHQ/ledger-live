import type { RestorableLargeScreenUpsellModalState } from "@domain/entity-large-screen-upsell-modal";
import type { Features } from "@shared/feature-flags";

type LargeScreenUpsellParams = NonNullable<Features["largeScreenUpsell"]["params"]>;

export type NanoDeviceModelId = keyof LargeScreenUpsellParams["audience"]["models"];

export type TouchscreenDeviceModelId = "stax" | "europa" | "apex";

export type LargeScreenUpsellDecision =
  | { shouldShow: true; deviceModelId: NanoDeviceModelId }
  | {
      shouldShow: false;
      reason:
        | "feature_disabled"
        | "modal_disabled"
        | "no_nano"
        | "touchscreen_seen"
        | "model_disabled";
    }
  | { shouldShow: false; reason: "cooldown" | "throttled"; deviceModelId: NanoDeviceModelId };

export type LargeScreenUpsellUserState = {
  seenNanoModelIds: NanoDeviceModelId[];
  hasSeenTouchscreenDevice: boolean;
  onboardingDate: Date | null;
  frequency: RestorableLargeScreenUpsellModalState;
};

export type LargeScreenUpsellContext = {
  isFeatureEnabled: boolean;
  isModalEnabled: boolean;
  audienceModels: LargeScreenUpsellParams["audience"]["models"];
  cooldownDays: LargeScreenUpsellParams["cooldownDays"];
  killThreshold: number;
  cadenceDays: number;
  now: Date;
};
