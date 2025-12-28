import React from "react";
import { useSelector } from "react-redux";
import { deepLinkUrlSelector, hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import Track from "~/renderer/analytics/Track";
const TrackAppStart = () => {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const deepLinkUrl = useSelector(deepLinkUrlSelector);
  const isDeeplinkSession = !!deepLinkUrl;
  return hasCompletedOnboarding ? (
    <Track onMount event="App Starts" isDeeplinkSession={isDeeplinkSession} />
  ) : null;
};
export default TrackAppStart;
