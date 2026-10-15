import { useEffect, useState } from "react";
import { useCalCheck } from "@features/flow-app-availability";

const SPLASH_CAP_MS = 3_000;

export function useLiftSplashOnAppAvailabilityViewModel(): {
  holdSplash: boolean;
} {
  const cal = useCalCheck();
  const [capReached, setCapReached] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setCapReached(true), SPLASH_CAP_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  const holdSplash = cal.status === "pending" && !capReached;

  useEffect(() => {
    if (holdSplash) return;
    window.api?.appLoaded();
  }, [holdSplash]);

  return { holdSplash };
}
