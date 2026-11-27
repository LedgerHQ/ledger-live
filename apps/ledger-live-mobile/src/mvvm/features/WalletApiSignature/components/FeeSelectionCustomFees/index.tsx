import React from "react";
import {
  useFeeSelectionCustomFeesViewModel,
  type FeeSelectionCustomFeesProps,
} from "./useFeeSelectionCustomFeesViewModel";
import { FeeSelectionCustomFeesView } from "./FeeSelectionCustomFeesView";

export function FeeSelectionCustomFees(props: FeeSelectionCustomFeesProps) {
  const viewModel = useFeeSelectionCustomFeesViewModel(props);

  return (
    <FeeSelectionCustomFeesView
      inputs={viewModel.inputs}
      fiatLabel={viewModel.fiatLabel}
      fiatValue={viewModel.fiatValue}
      isConfirmDisabled={viewModel.isConfirmDisabled}
      onInputChange={viewModel.onInputChange}
      onInputClear={viewModel.onInputClear}
      onConfirm={viewModel.onConfirm}
      hasCustomAssets={viewModel.hasCustomAssets}
      assetOptions={viewModel.assetOptions}
      selectedAssetId={viewModel.selectedAssetId}
      onAssetChange={viewModel.onAssetChange}
      confirmLabel={viewModel.confirmLabel}
      suggestedLabel={viewModel.suggestedLabel}
      payFeesInLabel={viewModel.payFeesInLabel}
    />
  );
}
