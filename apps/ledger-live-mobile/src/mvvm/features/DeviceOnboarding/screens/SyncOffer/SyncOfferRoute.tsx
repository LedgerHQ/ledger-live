import React from "react";
import { SyncOfferScreen } from "./index";
import { useSyncOfferRouteViewModel } from "./useSyncOfferRouteViewModel";

export function SyncOfferRoute() {
  const props = useSyncOfferRouteViewModel();
  return <SyncOfferScreen {...props} />;
}
