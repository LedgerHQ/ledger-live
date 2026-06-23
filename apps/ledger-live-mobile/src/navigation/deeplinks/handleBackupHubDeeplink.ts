import { getStateFromPath } from "@react-navigation/native";
import type { AppDispatch } from "~/state-manager/configureStore";
import { tickBackupHubFeatureIntroDeeplink } from "~/reducers/backupHubFeatureIntro";

export function handleBackupHubDeeplink({
  isLwmBackupHubEnabled,
  hasCompletedOnboarding,
  dispatch,
  config,
}: {
  isLwmBackupHubEnabled: boolean;
  hasCompletedOnboarding: boolean;
  dispatch: AppDispatch;
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  if (!isLwmBackupHubEnabled) return undefined;
  if (!hasCompletedOnboarding) return undefined;

  dispatch(tickBackupHubFeatureIntroDeeplink());

  return getStateFromPath("portfolio", config);
}
