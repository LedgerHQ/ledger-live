import { useEffect, useState } from "react";
import { useAppAvailability, useCalCheck } from "@features/flow-app-availability";

const SPLASH_CAP_MS = 3_000;

export function useLiftSplashOnAppAvailabilityViewModel(): {
  holdSplash: boolean;
  showServiceUnavailable: boolean;
} {
  const availability = useAppAvailability();
  const cal = useCalCheck();
  const [capReached, setCapReached] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setCapReached(true), SPLASH_CAP_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  const calPending = cal.status === "pending";
  const showServiceUnavailable = capReached && calPending && availability.status === "pending";
  const holdSplash = calPending && !capReached;

  useEffect(() => {
    if (holdSplash) return;
    if (availability.status === "pending" && !showServiceUnavailable) return;
    window.api?.appLoaded();
  }, [availability.status, holdSplash, showServiceUnavailable]);

  return { holdSplash, showServiceUnavailable };
}
