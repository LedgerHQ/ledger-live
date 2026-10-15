import React from "react";
import { SyncOfferView } from "./SyncOfferView";
import {
  useSyncOfferScreenViewModel,
  type SyncOfferScreenProps,
} from "./useSyncOfferScreenViewModel";

export function SyncOfferScreen(props: SyncOfferScreenProps) {
  const viewModel = useSyncOfferScreenViewModel(props);
  return <SyncOfferView {...viewModel} />;
}
