import { getStateFromPath } from "@react-navigation/native";
import type { AppDispatch } from "~/state-manager/configureStore";
import { tickProductTourDeeplink } from "~/actions/appstate";

export function handleProductTourDeeplink({
  isLwmProductTourEnabled,
  hasCompletedOnboarding,
  dispatch,
  config,
}: {
  isLwmProductTourEnabled: boolean;
  hasCompletedOnboarding: boolean;
  dispatch: AppDispatch;
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  if (!isLwmProductTourEnabled) return undefined;
  if (!hasCompletedOnboarding) return undefined;

  dispatch(tickProductTourDeeplink());

  return getStateFromPath("portfolio", config);
}
