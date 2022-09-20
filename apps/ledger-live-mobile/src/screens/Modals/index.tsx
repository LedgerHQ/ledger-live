import React, { useEffect } from "react";
import { NavigationState, useNavigation } from "@react-navigation/native";
import {
  FeatureToggle,
  useFeature,
} from "@ledgerhq/live-common/featureFlags/index";
import PushNotificationsModal from "../PushNotificationsModal";
import RatingsModal from "../RatingsModal";
import useRatings from "../../logic/ratings";
import useNotifications from "../../logic/notifications";

const getCurrentRouteName = (
  state: NavigationState | Required<NavigationState["routes"][0]>["state"],
): Routes | undefined => {
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

  const pushNotificationsFeature = useFeature("pushNotifications");
  const { onPushNotificationsRouteChange } = useNotifications();

  const ratingsFeature = useFeature("ratings");
  const { onRatingsRouteChange } = useRatings();

  useEffect(() => {
    if (!pushNotificationsFeature?.enabled && !ratingsFeature?.enabled) return;

    navigation.removeListener("state");
    navigation.addListener("state", e => {
      const navState = e?.data?.state;
      if (navState && navState.routeNames) {
        const currentRouteName = getCurrentRouteName(navState);
        if (pushNotificationsFeature?.enabled) {
          onPushNotificationsRouteChange(currentRouteName);
        }
        if (ratingsFeature?.enabled) {
          onRatingsRouteChange(currentRouteName);
        }
      }
    });

    return () => navigation.removeListener("state");
  }, [
    navigation,
    onPushNotificationsRouteChange,
    onRatingsRouteChange,
    pushNotificationsFeature?.enabled,
    ratingsFeature?.enabled,
  ]);

  return (
    <>
      <FeatureToggle feature="pushNotifications">
        <PushNotificationsModal />
      </FeatureToggle>
      <FeatureToggle feature="ratings">
        <RatingsModal />
      </FeatureToggle>
    </>
  );
};

export default Modals;
