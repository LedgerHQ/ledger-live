import { useEffect, useRef } from "react";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { isCooldownElapsed } from "@ledgerhq/live-common/postOnboarding/logic/upsellFrequency";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { DeviceModelId, DevicesWithTouchScreen } from "@ledgerhq/types-devices";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { knownDeviceModelIdsSelector } from "~/reducers/settings";

const NANO_DEVICE_MODEL_IDS = [
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
] as const;

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
  const dispatch = useDispatch();
  const feature = useFeature("largeScreenUpsell");
  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const onboardingDate = useSelector(onboardingDateSelector);
  const hasBackfilledOnboardingDateRef = useRef(false);

  const params = feature?.params;
  const hasSeenTouchscreen = hasSeenTouchscreenDevice(knownDeviceModelIds);
  const seenNanoDeviceModelIds = getSeenNanoDeviceModelIds(knownDeviceModelIds);
  const enabledNanoDeviceModelIds = params
    ? seenNanoDeviceModelIds.filter(deviceModelId => params.audience.models[deviceModelId])
    : [];

  const shouldBackfillOnboardingDate = Boolean(
    feature?.enabled &&
    params &&
    onboardingDate === null &&
    !hasSeenTouchscreen &&
    enabledNanoDeviceModelIds.length > 0,
  );

  useEffect(() => {
    if (!shouldBackfillOnboardingDate) {
      hasBackfilledOnboardingDateRef.current = false;
      return;
    }

    if (hasBackfilledOnboardingDateRef.current) {
      return;
    }

    hasBackfilledOnboardingDateRef.current = true;
    dispatch(setPostOnboardingDate({ onboardingDate: new Date() }));
  }, [dispatch, shouldBackfillOnboardingDate]);

  if (!feature?.enabled || !params) {
    return { isEligible: false, reason: "feature_disabled" };
  }

  if (hasSeenTouchscreen) {
    return { isEligible: false, reason: "touchscreen_seen" };
  }

  if (seenNanoDeviceModelIds.length === 0) {
    return { isEligible: false, reason: "no_nano" };
  }

  if (enabledNanoDeviceModelIds.length === 0) {
    return { isEligible: false, reason: "model_disabled" };
  }

  const deviceModelId = selectCooldownDeviceModelId(enabledNanoDeviceModelIds, params.cooldownDays);
  const cooldownDays = resolveCooldownDays(params.cooldownDays, deviceModelId);
  const onboardingDateForEligibility = onboardingDate ?? new Date();

  if (!isCooldownElapsed(onboardingDateForEligibility, cooldownDays, new Date())) {
    return { isEligible: false, reason: "cooldown", deviceModelId, cooldownDays };
  }

  return { isEligible: true, deviceModelId, cooldownDays };
}
