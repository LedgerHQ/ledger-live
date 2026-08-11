import { useSelector } from "react-redux";
import { useFeature } from "@features/platform-feature-flags";
import { getLargeScreenUpsellDecision } from "../decision/getLargeScreenUpsellDecision";
import { lastSeenUpsellModalSelector, retriesUpsellModalSelector } from "../state";
import type { LargeScreenUpsellVariant } from "../utils/upsellContent";
import type { LargeScreenUpsellDecision, NanoDeviceModelId } from "../types";

export type UseLargeScreenUpsellDecisionInput = {
  seenNanoModelIds: NanoDeviceModelId[];
  hasSeenTouchscreenDevice: boolean;
  onboardingDate: Date | null;
  variant: LargeScreenUpsellVariant;
  now?: Date;
};

export function useLargeScreenUpsellDecision(
  input: UseLargeScreenUpsellDecisionInput,
): LargeScreenUpsellDecision {
  const feature = useFeature("largeScreenUpsell");
  const retries = useSelector(retriesUpsellModalSelector);
  const lastSeenAt = useSelector(lastSeenUpsellModalSelector);
  const params = feature?.params;

  return getLargeScreenUpsellDecision(
    {
      seenNanoModelIds: input.seenNanoModelIds,
      hasSeenTouchscreenDevice: input.hasSeenTouchscreenDevice,
      onboardingDate: input.onboardingDate,
      frequency: { retries, lastSeenAt },
    },
    {
      isFeatureEnabled: Boolean(feature?.enabled && params?.[input.variant].enabled),
      isModalEnabled: Boolean(params?.modal.enabled),
      audienceModels: params?.audience.models ?? {
        nanoS: false,
        nanoSP: false,
        nanoX: false,
      },
      cooldownDays: params?.cooldownDays ?? { default: Infinity },
      killThreshold: params?.modal.killThreshold ?? Infinity,
      cadenceDays: params?.modal.cadenceDays ?? 0,
      now: input.now ?? new Date(),
    },
  );
}
