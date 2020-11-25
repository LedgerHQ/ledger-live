import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { hasCompletedOnboardingSelector } from "../reducers/settings";
import { start } from "./segment";

const HookAnalytics = ({ store }: { store: * }) => {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const [analyticsStarted, setAnalyticsStarted] = useState(false);

  const sync = useCallback(() => {
    if (analyticsStarted || !hasCompletedOnboarding) return;
    setAnalyticsStarted(true);
    start(store);
  }, [analyticsStarted, hasCompletedOnboarding, store]);

  useEffect(sync, [hasCompletedOnboarding, sync]);

  return null;
};

export default HookAnalytics;
