import React from "react";
import { LargeScreenUpsellQaView } from "./LargeScreenUpsellQaView";
import { useLargeScreenUpsellQaViewModel } from "./useLargeScreenUpsellQaViewModel";

export default function LargeScreenUpsellQa() {
  const viewModel = useLargeScreenUpsellQaViewModel();
  return <LargeScreenUpsellQaView {...viewModel} />;
}
