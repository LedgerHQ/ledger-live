import React, { useEffect } from "react";
import { EventArg, NavigationState, useNavigation } from "@react-navigation/native";
import { useFeature } from "@features/platform-feature-flags";
import RatingsModal from "../RatingsModal";
import useRatings from "~/logic/ratings";
import DebugAppLevelDrawer from "LLM/components/QueuedDrawer/DebugAppLevelDrawer";

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
  const { onRatingsRouteChange } = useRatings();

  useEffect(() => {
    if (!ratingsFeature?.enabled) return;

    const handleRouteChange = (
      e: EventArg<"state", false, { state: NavigationState | undefined }>,
    ) => {
      const navState = e.data.state;
      if (!navState?.routeNames) return;

      const currentRouteName = getCurrentRouteName(navState);
      if (!currentRouteName) return;

      onRatingsRouteChange(currentRouteName);
    };

    const unsubscribe = navigation.addListener("state", handleRouteChange);

    return () => unsubscribe();
  }, [navigation, ratingsFeature?.enabled, onRatingsRouteChange]);

  return (
    <>
      {ratingsFeature?.enabled && <RatingsModal />}
      <DebugAppLevelDrawer />
    </>
  );
};

export default Modals;
