import React, { useCallback, useEffect } from "react";
import { NavigationState, useNavigation } from "@react-navigation/native";
import { FeatureToggle, useFeature } from "@ledgerhq/live-config/featureFlags/index";
import PushNotificationsModal from "../PushNotificationsModal";
import RatingsModal from "../RatingsModal";
import NpsRatingsModal from "../NpsRatingsModal";
import useRatings from "~/logic/ratings";
import useNotifications from "~/logic/notifications";
import DebugAppLevelDrawer from "~/components/DebugAppLevelDrawer";
import useNpsRatings from "~/logic/npsRatings";

const getCurrentRouteName = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): string | undefined => {
  if (state.index === undefined || state.index < 0) {
    return undefined;
  }
  const nestedState = state.routes[state.index].state;
  if (nestedState !== undefined) {
    return getCurrentRouteName(nestedState);
  }
  return state.routes[state.index].name;
};

const Modals = () => {
  const navigation = useNavigation();

  const pushNotificationsFeature = useFeature("brazePushNotifications");
  const { onPushNotificationsRouteChange } = useNotifications();

  const ratingsFeature = useFeature("ratingsPrompt");
  const npsRatingsFeature = useFeature("npsRatingsPrompt");
  const { onRatingsRouteChange } = useRatings();
  const { onRatingsRouteChange: npsOnRatingsRouteChange } = useNpsRatings();

  const activeRatings = npsRatingsFeature?.enabled
    ? "nps"
    : ratingsFeature?.enabled
    ? "no-nps"
    : "none";

  const onRouteChange = useCallback(
    // @ts-expect-error cannot find the correct event there
    e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRouteName = getCurrentRouteName(navState) as string;
        let isModalOpened = false;
        if (pushNotificationsFeature?.enabled) {
          isModalOpened = onPushNotificationsRouteChange(currentRouteName, isModalOpened);
        }
        if (activeRatings === "nps") {
          npsOnRatingsRouteChange(currentRouteName, isModalOpened);
        }
        if (activeRatings === "no-nps") {
          onRatingsRouteChange(currentRouteName, isModalOpened);
        }
      }
    },
    [
      activeRatings,
      npsOnRatingsRouteChange,
      onPushNotificationsRouteChange,
      onRatingsRouteChange,
      pushNotificationsFeature?.enabled,
    ],
  );

  useEffect(() => {
    if (!pushNotificationsFeature?.enabled && !ratingsFeature?.enabled) return undefined;

    navigation.removeListener("state", onRouteChange);
    navigation.addListener("state", onRouteChange);

    return () => navigation.removeListener("state", onRouteChange);
  }, [navigation, onRouteChange, pushNotificationsFeature?.enabled, ratingsFeature?.enabled]);

  return (
    <>
      <FeatureToggle featureId="brazePushNotifications">
        <PushNotificationsModal />
      </FeatureToggle>
      {activeRatings === "no-nps" && <RatingsModal />}
      {activeRatings === "nps" && <NpsRatingsModal />}
      <DebugAppLevelDrawer />
    </>
  );
};

export default Modals;
