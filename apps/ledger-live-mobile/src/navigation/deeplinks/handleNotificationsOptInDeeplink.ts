import { getStateFromPath } from "@react-navigation/native";
import type { AppDispatch } from "~/state-manager/configureStore";
import {
  setNotificationsDrawerPromptTarget,
  setNotificationsDrawerSource,
  setNotificationsModalOpen,
} from "~/actions/notifications";

/**
 * ledgerlive://notifications-opt-in opens the push notifications opt-in drawer.
 * Used by Braze in-app messages to re-prompt users whose OS permission was never granted.
 */
export function handleNotificationsOptInDeeplink({
  isPushNotificationsEnabled,
  hasCompletedOnboarding,
  dispatch,
  config,
}: {
  isPushNotificationsEnabled: boolean;
  hasCompletedOnboarding: boolean;
  dispatch: AppDispatch;
  config: Parameters<typeof getStateFromPath>[1];
}): ReturnType<typeof getStateFromPath> | undefined {
  if (!isPushNotificationsEnabled) return undefined;
  if (!hasCompletedOnboarding) return undefined;

  dispatch(setNotificationsDrawerSource("deeplink"));
  dispatch(setNotificationsDrawerPromptTarget("globalPushNotifications"));
  dispatch(setNotificationsModalOpen(true));

  return getStateFromPath("portfolio", config);
}
