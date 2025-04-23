import { useSelector } from "react-redux";
import { lastSeenDeviceSelector } from "~/renderer/reducers/settings";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { EntryPoint, EntryPointsData } from "../types";
import OnboardingEntryPoint from "../components/OnboardingEntryPoint";
import SettingsEntryPoint from "../components/SettingsEntryPoint";

export function useEntryPoint(entryPoint: EntryPoint, needEligibleDevice = true) {
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);

  const isDeviceEligible = Boolean(
    lastSeenDevice && lastSeenDevice.modelId !== DeviceModelId.nanoS,
  );

  const entryPointsData: EntryPointsData = {
    [EntryPoint.onboarding]: {
      enabled: true,
      onClick: () => {},
      component: OnboardingEntryPoint,
    },
    [EntryPoint.settings]: {
      enabled: true,
      onClick: () => {},
      component: SettingsEntryPoint,
    },
  };

  const entryPointData = entryPointsData[entryPoint];

  const shouldDisplayAnyEntryPoints = isDeviceEligible || !needEligibleDevice;

  const shouldDisplayEntryPoint = shouldDisplayAnyEntryPoints && entryPointData.enabled;

  return {
    shouldDisplayEntryPoint,
    entryPointData,
  };
}
