import { useEffect } from "react";
import { useAppAvailability } from "@features/flow-app-availability";

export function useLiftSplashOnAppAvailabilityViewModel(): void {
  const availability = useAppAvailability();

  useEffect(() => {
    if (availability.status === "pending") return;
    globalThis.api?.appLoaded();
  }, [availability.status]);
}
