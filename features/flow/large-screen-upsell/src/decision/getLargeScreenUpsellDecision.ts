import { isCooldownElapsed } from "../internal/isCooldownElapsed";
import { getLargeScreenUpsellEligibility } from "./getLargeScreenUpsellEligibility";
import type {
  LargeScreenUpsellContext,
  LargeScreenUpsellDecision,
  LargeScreenUpsellUserState,
} from "../types";

export function getLargeScreenUpsellDecision(
  {
    seenNanoModelIds,
    hasSeenTouchscreenDevice,
    onboardingDate,
    frequency,
  }: LargeScreenUpsellUserState,
  {
    isFeatureEnabled,
    isModalEnabled,
    audienceModels,
    cooldownDays,
    killThreshold,
    cadenceDays,
    now,
  }: LargeScreenUpsellContext,
): LargeScreenUpsellDecision {
  if (!isFeatureEnabled) {
    return { shouldShow: false, reason: "feature_disabled" };
  }

  if (!isModalEnabled) {
    return { shouldShow: false, reason: "modal_disabled" };
  }

  const eligibility = getLargeScreenUpsellEligibility(
    { seenNanoModelIds, hasSeenTouchscreenDevice, onboardingDate },
    { audienceModels, cooldownDays, now },
  );

  if (!eligibility.isEligible) {
    if (eligibility.reason === "cooldown") {
      return { shouldShow: false, reason: "cooldown", deviceModelId: eligibility.deviceModelId };
    }

    return { shouldShow: false, reason: eligibility.reason };
  }

  if (
    frequency.retries >= killThreshold &&
    frequency.lastSeenAt !== null &&
    !isCooldownElapsed({
      elapsedSinceDate: new Date(frequency.lastSeenAt),
      minimumDays: cadenceDays,
      now,
    })
  ) {
    return { shouldShow: false, reason: "throttled", deviceModelId: eligibility.deviceModelId };
  }

  return { shouldShow: true, deviceModelId: eligibility.deviceModelId };
}
