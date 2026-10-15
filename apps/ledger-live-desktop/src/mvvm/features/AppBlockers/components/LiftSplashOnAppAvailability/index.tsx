import React from "react";
import TriggerAppReady from "~/renderer/components/TriggerAppReady";
import { useLiftSplashOnAppAvailabilityViewModel } from "./useLiftSplashOnAppAvailabilityViewModel";

export function LiftSplashOnAppAvailability({ children }: React.PropsWithChildren) {
  const { holdSplash } = useLiftSplashOnAppAvailabilityViewModel();

  return (
    <>
      <TriggerAppReady holdSplash={holdSplash} />
      {children}
    </>
  );
}
