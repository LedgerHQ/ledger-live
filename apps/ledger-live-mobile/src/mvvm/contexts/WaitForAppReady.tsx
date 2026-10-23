import React, { useEffect } from "react";
import { useAppAvailability } from "@features/flow-app-availability";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { useSelector } from "~/context/hooks";
import { markAppLetThrough } from "~/context/startCountervaluesWhenReady";
import LoadingApp from "~/components/LoadingApp";
import { useWait } from "../hooks/useWait";
import { logStartupEvent } from "../utils/logStartupTime";

const MAX_WAIT = 1_000;

const conditionsMet = new Set<string>();
function logWhenFirstMet(met: boolean, event: string) {
  if (!met || conditionsMet.has(event)) return;
  conditionsMet.add(event);
  logStartupEvent(event);
}

export function WaitForAppReady({
  children,
  currencyInitialized,
}: React.PropsWithChildren<{ currencyInitialized: boolean }>) {
  logStartupEvent("WaitForAppReady render");

  const availability = useAppAvailability();
  const pendingAvailabilityCheck = availability.status === "pending";
  const remoteFlagsReady = useSelector(selectRemoteFlagsReady);
  const isLoaded = currencyInitialized && !pendingAvailabilityCheck && remoteFlagsReady;

  logWhenFirstMet(currencyInitialized, "WaitForAppReady currencies ready");
  logWhenFirstMet(remoteFlagsReady, "WaitForAppReady remote flags ready");
  logWhenFirstMet(!pendingAvailabilityCheck, "WaitForAppReady availability checked");

  const timedOut = useWait<boolean>(resolve => setTimeout(() => resolve(true), MAX_WAIT)) ?? false;
  const letThrough = timedOut || isLoaded;

  useEffect(() => {
    if (letThrough) markAppLetThrough();
  }, [letThrough]);

  if (!letThrough) {
    return <LoadingApp />;
  }

  logStartupEvent("WaitForAppReady done");
  return children;
}
