import React from "react";
import { ServiceUnavailable } from "@features/flow-app-availability";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import { useLiftSplashOnAppAvailabilityViewModel } from "./useLiftSplashOnAppAvailabilityViewModel";

export function LiftSplashOnAppAvailability({ children }: React.PropsWithChildren) {
  const { holdSplash, showServiceUnavailable } = useLiftSplashOnAppAvailabilityViewModel();

  return (
    <>
      <TriggerAppReady holdSplash={holdSplash} />
      {showServiceUnavailable ? <ServiceUnavailable /> : children}
    </>
  );
}
