import React from "react";
import { LargeScreenUpsellModalView } from "./LargeScreenUpsellModalView.web";
import { useLargeScreenUpsellModalViewModel } from "./useLargeScreenUpsellModalViewModel";
import type { UseLargeScreenUpsellModalViewModelInput } from "./types";

export type LargeScreenUpsellModalProps = UseLargeScreenUpsellModalViewModelInput;

export function LargeScreenUpsellModal(props: LargeScreenUpsellModalProps) {
  const viewModel = useLargeScreenUpsellModalViewModel(props);

  if (!viewModel.isOpen) {
    return null;
  }

  return <LargeScreenUpsellModalView {...viewModel} />;
}
