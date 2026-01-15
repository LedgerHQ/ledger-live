import React, { useEffect } from "react";
import { View } from "react-native";
import { EventArg, NavigationState, useNavigation } from "@react-navigation/native";
import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import PushNotificationsModal from "../PushNotificationsModal";
import RatingsModal from "../RatingsModal";
import NpsRatingsModal from "../NpsRatingsModal";
import useRatings from "~/logic/ratings";
import DebugAppLevelDrawer from "LLM/components/QueuedDrawer/DebugAppLevelDrawer";
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

  const ratingsFeature = useFeature("ratingsPrompt");
  const npsRatingsFeature = useFeature("npsRatingsPrompt");
  const { onRatingsRouteChange } = useRatings();
  const { onRatingsRouteChange: npsOnRatingsRouteChange } = useNpsRatings();

  const activeRatings = npsRatingsFeature?.enabled
    ? "nps"
    : ratingsFeature?.enabled
      ? "no-nps"
      : null;

  useEffect(() => {
    const handleRouteChange = (
      e: EventArg<"state", false, { state: NavigationState | undefined }>,
    ) => {
      if (activeRatings === null) return;

      const navState = e.data.state;
      if (!navState?.routeNames) return;

      const currentRouteName = getCurrentRouteName(navState);
      if (!currentRouteName) return;

      if (activeRatings === "nps") {
        npsOnRatingsRouteChange(currentRouteName);
      }
      if (activeRatings === "no-nps") {
        onRatingsRouteChange(currentRouteName);
      }
    };

    const unsubscribe = navigation.addListener("state", handleRouteChange);

    return () => unsubscribe();
  }, [navigation, activeRatings, npsOnRatingsRouteChange, onRatingsRouteChange]);

  return (
    <>
      <FeatureToggle featureId="brazePushNotifications">
        <View>
          <PushNotificationsModal />
        </View>
      </FeatureToggle>
      {activeRatings === "no-nps" && <RatingsModal />}
      {activeRatings === "nps" && <NpsRatingsModal />}
      <DebugAppLevelDrawer />
    </>
  );
};

export default Modals;
