import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useCallback } from "react";

export enum Location {
  ADD_ACCOUNT = "add_account",
  EARN_FLOW = "earn_flow",
  LIVE_APP = "live_app",
  RECEIVE_FLOW = "receive_flow",
  SEND_FLOW = "send_flow",
}
export function useModularDrawerVisibility() {
  const featureModularDrawer = useFeature("lldModularDrawer");

  const isModularDrawerVisible = useCallback(
    (location: Location) => {
      if (!featureModularDrawer?.enabled) return false;
      return featureModularDrawer.params?.[location] ?? false;
    },
    [featureModularDrawer],
  );

  return {
    isModularDrawerVisible,
  };
}
