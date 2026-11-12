import React from "react";
import { SyncOfferScreen } from "./index";
import { useSyncOfferRouteViewModel } from "./useSyncOfferRouteViewModel";

export function SyncOfferRoute() {
  const { deviceIntentStepElement, ...props } = useSyncOfferRouteViewModel();
  return (
    <>
      <SyncOfferScreen {...props} />
      {deviceIntentStepElement}
    </>
  );
}
