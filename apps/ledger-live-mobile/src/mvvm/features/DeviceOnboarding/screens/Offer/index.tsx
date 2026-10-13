import React from "react";
import { OfferView } from "./OfferView";
import { useOfferScreenViewModel, type OfferScreenProps } from "./useOfferScreenViewModel";

export function OfferScreen(props: OfferScreenProps) {
  const viewModel = useOfferScreenViewModel(props);
  return <OfferView {...viewModel} />;
}
