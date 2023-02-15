import React, { useCallback, useEffect } from "react";
import { NavigationState, useNavigation } from "@react-navigation/native";
import {
  FeatureToggle,
  useFeature,
} from "@ledgerhq/live-common/featureFlags/index";
import PushNotificationsModal from "../PushNotificationsModal";
import RatingsModal from "../RatingsModal";
import useRatings from "../../logic/ratings";
import useNotifications from "../../logic/notifications";
import DebugAppLevelDrawer from "../../components/DebugAppLevelDrawer";

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
  const { onRatingsRouteChange } = useRatings();

  const onRouteChange = useCallback(
    e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRouteName = getCurrentRouteName(navState);
        let isModalOpened = false;
        if (pushNotificationsFeature?.enabled) {
          isModalOpened = onPushNotificationsRouteChange(
            currentRouteName,
            isModalOpened,
          );
        }
        if (ratingsFeature?.enabled) {
          onRatingsRouteChange(currentRouteName, isModalOpened);
        }
      }
    },
    [
      onPushNotificationsRouteChange,
      onRatingsRouteChange,
      pushNotificationsFeature?.enabled,
      ratingsFeature?.enabled,
    ],
  );

  useEffect(() => {
    if (!pushNotificationsFeature?.enabled && !ratingsFeature?.enabled)
      return undefined;

    navigation.removeListener("state", onRouteChange);
    navigation.addListener("state", onRouteChange);

    return () => navigation.removeListener("state", onRouteChange);
  }, [
    navigation,
    onRouteChange,
    pushNotificationsFeature?.enabled,
    ratingsFeature?.enabled,
  ]);

  return (
    <>
      <FeatureToggle feature="brazePushNotifications">
        <PushNotificationsModal />
      </FeatureToggle>
      <FeatureToggle feature="ratingsPrompt">
        <RatingsModal />
      </FeatureToggle>
      <DebugAppLevelDrawer />
    </>
  );
};

export default Modals;
