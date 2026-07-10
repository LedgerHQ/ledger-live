import { isCooldownElapsed } from "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { DeviceModelId, DevicesWithTouchScreen } from "@ledgerhq/types-devices";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { knownDeviceModelIdsSelector } from "~/reducers/settings";

const NANO_DEVICE_MODEL_IDS = [
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
] as const;

const FORCE_NANO_S_IN_DEV = __DEV__ && process.env.NODE_ENV !== "test";
const FORCE_LARGE_SCREEN_UPSELL_IN_DEV = __DEV__ && process.env.NODE_ENV !== "test";

type NanoDeviceModelId = (typeof NANO_DEVICE_MODEL_IDS)[number];

type CooldownDays = { default: number } & Partial<Record<NanoDeviceModelId, number>>;

export type LargeScreenUpsellIneligibilityReason =
  | "feature_disabled"
  | "no_nano"
  | "touchscreen_seen"
  | "model_disabled"
  | "cooldown";

export type LargeScreenUpsellEligibility =
  | { isEligible: true; deviceModelId: NanoDeviceModelId; cooldownDays: number }
  | { isEligible: false; reason: Exclude<LargeScreenUpsellIneligibilityReason, "cooldown"> }
  | {
      isEligible: false;
      reason: "cooldown";
      deviceModelId: NanoDeviceModelId;
      cooldownDays: number;
    };

function resolveCooldownDays(cooldownDays: CooldownDays, deviceModelId: NanoDeviceModelId): number {
  return cooldownDays[deviceModelId] ?? cooldownDays.default;
}

function getSeenNanoDeviceModelIds(
  knownDeviceModelIds: Record<DeviceModelId, boolean>,
): NanoDeviceModelId[] {
  return NANO_DEVICE_MODEL_IDS.filter(deviceModelId => knownDeviceModelIds[deviceModelId]);
}

function hasSeenTouchscreenDevice(knownDeviceModelIds: Record<DeviceModelId, boolean>): boolean {
  return DevicesWithTouchScreen.some(deviceModelId => knownDeviceModelIds[deviceModelId]);
}

function selectCooldownDeviceModelId(
  deviceModelIds: NanoDeviceModelId[],
  cooldownDays: CooldownDays,
): NanoDeviceModelId {
  const [firstDeviceModelId, ...restDeviceModelIds] = deviceModelIds;

  return restDeviceModelIds.reduce((selectedDeviceModelId, deviceModelId) => {
    const selectedCooldownDays = resolveCooldownDays(cooldownDays, selectedDeviceModelId);
    const candidateCooldownDays = resolveCooldownDays(cooldownDays, deviceModelId);

    return candidateCooldownDays > selectedCooldownDays ? deviceModelId : selectedDeviceModelId;
  }, firstDeviceModelId);
}

export function useLargeScreenUpsellEligibility(): LargeScreenUpsellEligibility {
  const feature = useFeature("largeScreenUpsell");
  const storedKnownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const onboardingDate = useSelector(onboardingDateSelector);

  const knownDeviceModelIds = FORCE_NANO_S_IN_DEV
    ? {
        ...storedKnownDeviceModelIds,
        [DeviceModelId.nanoS]: true,
        [DeviceModelId.stax]: false,
        [DeviceModelId.europa]: false,
        [DeviceModelId.apex]: false,
      }
    : storedKnownDeviceModelIds;

  const params = feature?.params;
  if (!(feature?.enabled || FORCE_LARGE_SCREEN_UPSELL_IN_DEV) || !params) {
    return { isEligible: false, reason: "feature_disabled" };
  }

  if (hasSeenTouchscreenDevice(knownDeviceModelIds)) {
    return { isEligible: false, reason: "touchscreen_seen" };
  }

  const seenNanoDeviceModelIds = getSeenNanoDeviceModelIds(knownDeviceModelIds);
  if (seenNanoDeviceModelIds.length === 0) {
    return { isEligible: false, reason: "no_nano" };
  }

  const enabledNanoDeviceModelIds = seenNanoDeviceModelIds.filter(
    deviceModelId => params.audience.models[deviceModelId],
  );

  if (enabledNanoDeviceModelIds.length === 0) {
    return { isEligible: false, reason: "model_disabled" };
  }

  const deviceModelId = selectCooldownDeviceModelId(enabledNanoDeviceModelIds, params.cooldownDays);
  const cooldownDays = resolveCooldownDays(params.cooldownDays, deviceModelId);

  if (!isCooldownElapsed(onboardingDate, cooldownDays, new Date())) {
    return { isEligible: false, reason: "cooldown", deviceModelId, cooldownDays };
  }

  return { isEligible: true, deviceModelId, cooldownDays };
}
