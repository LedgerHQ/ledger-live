import { isCooldownElapsed } from "../internal/isCooldownElapsed";
import { resolveOnboardingDateForUpsell } from "../internal/legacyOnboardingDate";
import type {
  LargeScreenUpsellEligibility,
  LargeScreenUpsellEligibilityContext,
  LargeScreenUpsellEligibilityUserState,
  NanoDeviceModelId,
} from "../types";

const NANO_DEVICE_MODEL_IDS = [
  "nanoS",
  "nanoSP",
  "nanoX",
] as const satisfies readonly NanoDeviceModelId[];

function selectDeviceModelWithLongestCooldown(
  deviceModelIds: NanoDeviceModelId[],
  cooldownDays: LargeScreenUpsellEligibilityContext["cooldownDays"],
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

export function getLargeScreenUpsellEligibility(
  {
    seenNanoModelIds,
    hasSeenTouchscreenDevice,
    onboardingDate,
  }: LargeScreenUpsellEligibilityUserState,
  { audienceModels, cooldownDays, now }: LargeScreenUpsellEligibilityContext,
): LargeScreenUpsellEligibility {
  if (hasSeenTouchscreenDevice) {
    return { isEligible: false, reason: "touchscreen_seen" };
  }

  if (seenNanoModelIds.length === 0) {
    return { isEligible: false, reason: "no_nano" };
  }

  const enabledSeenNanoModelIds = seenNanoModelIds.filter(
    deviceModelId => audienceModels[deviceModelId],
  );

  if (enabledSeenNanoModelIds.length === 0) {
    return { isEligible: false, reason: "model_disabled" };
  }

  const { deviceModelId, days: resolvedCooldownDays } = selectDeviceModelWithLongestCooldown(
    enabledSeenNanoModelIds,
    cooldownDays,
  );
  const onboardingDateForEligibility = resolveOnboardingDateForUpsell(onboardingDate);

  if (
    !isCooldownElapsed({
      elapsedSinceDate: onboardingDateForEligibility,
      minimumDays: resolvedCooldownDays,
      now,
    })
  ) {
    return { isEligible: false, reason: "cooldown", deviceModelId };
  }

  return { isEligible: true, deviceModelId };
}
