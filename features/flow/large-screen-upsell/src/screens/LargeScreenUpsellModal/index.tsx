import React from "react";
import { LargeScreenUpsellModalView } from "./LargeScreenUpsellModalView";
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
