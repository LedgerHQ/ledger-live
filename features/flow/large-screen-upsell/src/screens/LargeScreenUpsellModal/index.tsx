import React from "react";
import { LargeScreenUpsellModalView } from "./LargeScreenUpsellModalView.web";
import {
  useLargeScreenUpsellModalViewModel,
  type UseLargeScreenUpsellModalViewModelInput,
} from "./useLargeScreenUpsellModalViewModel";

export type LargeScreenUpsellModalProps = UseLargeScreenUpsellModalViewModelInput;

export function LargeScreenUpsellModal(props: LargeScreenUpsellModalProps) {
  const viewModel = useLargeScreenUpsellModalViewModel(props);

  if (!viewModel.isOpen) {
    return null;
  }

  return <LargeScreenUpsellModalView {...viewModel} />;
}
