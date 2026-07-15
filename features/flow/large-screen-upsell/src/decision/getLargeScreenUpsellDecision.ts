import { isCooldownElapsed } from "../internal/isCooldownElapsed";
import type {
  LargeScreenUpsellContext,
  LargeScreenUpsellDecision,
  LargeScreenUpsellUserState,
  NanoDeviceModelId,
} from "../types";

// Canonical order (same as mobile) so longest-cooldown ties are order-independent.
const NANO_DEVICE_MODEL_IDS = [
  "nanoS",
  "nanoSP",
  "nanoX",
] as const satisfies readonly NanoDeviceModelId[];

function selectDeviceModelWithLongestCooldown(
  deviceModelIds: NanoDeviceModelId[],
  cooldownDays: LargeScreenUpsellContext["cooldownDays"],
): { deviceModelId: NanoDeviceModelId; days: number } {
  const resolveDays = (deviceModelId: NanoDeviceModelId) =>
    cooldownDays[deviceModelId] ?? cooldownDays.default;

  const seenIds = new Set(deviceModelIds);
  const orderedDeviceModelIds = NANO_DEVICE_MODEL_IDS.filter(deviceModelId =>
    seenIds.has(deviceModelId),
  );

  const deviceModelId = orderedDeviceModelIds.reduce((longestId, candidateId) =>
    resolveDays(candidateId) > resolveDays(longestId) ? candidateId : longestId,
  );

  return { deviceModelId, days: resolveDays(deviceModelId) };
}

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

  if (hasSeenTouchscreenDevice) {
    return { shouldShow: false, reason: "touchscreen_seen" };
  }

  if (seenNanoModelIds.length === 0) {
    return { shouldShow: false, reason: "no_nano" };
  }

  const enabledSeenNanoModelIds = seenNanoModelIds.filter(
    deviceModelId => audienceModels[deviceModelId],
  );

  if (enabledSeenNanoModelIds.length === 0) {
    return { shouldShow: false, reason: "model_disabled" };
  }

  const { deviceModelId, days: resolvedCooldownDays } = selectDeviceModelWithLongestCooldown(
    enabledSeenNanoModelIds,
    cooldownDays,
  );
  const onboardingDateForEligibility = onboardingDate ?? now;

  if (
    !isCooldownElapsed({
      elapsedSinceDate: onboardingDateForEligibility,
      minimumDays: resolvedCooldownDays,
      now,
    })
  ) {
    return { shouldShow: false, reason: "cooldown", deviceModelId };
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
    return { shouldShow: false, reason: "throttled", deviceModelId };
  }

  return { shouldShow: true, deviceModelId };
}
