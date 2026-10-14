import React, { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";
import {
  ServiceUnavailable,
  useAppAvailability,
  useCalCheck,
} from "@features/flow-app-availability";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { useSelector } from "~/context/hooks";
import LoadingApp from "~/components/LoadingApp";
import { useWait } from "../hooks/useWait";
import { logStartupEvent } from "../utils/logStartupTime";

const MAX_WAIT = 1_000;

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");

  const availability = useAppAvailability();
  const cal = useCalCheck();
  const pendingAvailabilityCheck = availability.status === "pending";
  const remoteFlagsReady = useSelector(selectRemoteFlagsReady);
  const isLoaded = currencyInitialized && !pendingAvailabilityCheck && remoteFlagsReady;

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;
  const unavailableWithoutNavigator =
    availability.status === "unavailable" || (timedOut && cal.status === "pending");

  useEffect(() => {
    if (!unavailableWithoutNavigator) return;
    void SplashScreen.hide();
  }, [unavailableWithoutNavigator]);

  if (availability.status === "unavailable") {
    return children;
  }

  if (timedOut && cal.status === "pending") {
    return <ServiceUnavailable />;
  }

  if (!timedOut && !isLoaded) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
