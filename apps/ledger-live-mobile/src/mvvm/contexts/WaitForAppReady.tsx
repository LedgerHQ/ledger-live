import React from "react";
import { useAppAvailability } from "@features/flow-app-availability";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { useSelector } from "~/context/hooks";
import LoadingApp from "~/components/LoadingApp";
import { useHideSplashScreen } from "../features/LaunchScreen/useHideSplashScreen";
import { useWait } from "../hooks/useWait";
import { logStartupEvent } from "../utils/logStartupTime";

const MAX_WAIT = 1_000;

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");

  const availability = useAppAvailability();
  const pendingAvailabilityCheck = availability.status === "pending";
  const remoteFlagsReady = useSelector(selectRemoteFlagsReady);
  const isLoaded = currencyInitialized && !pendingAvailabilityCheck && remoteFlagsReady;

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;
  const showsChildren = timedOut || isLoaded;

  // The unavailable screen replaces the app, so the app never hides the splash itself.
  useHideSplashScreen(showsChildren && availability.status === "unavailable");

  if (!showsChildren) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
