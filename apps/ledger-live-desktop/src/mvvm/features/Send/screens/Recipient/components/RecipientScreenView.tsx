import React from "react";
import type { ReadyRecipientScreenViewModel } from "../hooks/useRecipientScreenViewModel";
import { RecipientAddressModal } from "./RecipientAddressModal";

type RecipientScreenViewProps = Readonly<{
  viewModel: ReadyRecipientScreenViewModel;
}>;

export function RecipientScreenView({ viewModel }: RecipientScreenViewProps) {
  return (
    <RecipientAddressModal
      isOpen
      onClose={viewModel.onClose}
      account={viewModel.account}
      parentAccount={viewModel.parentAccount}
      currency={viewModel.currency}
      onAddressSelected={viewModel.onAddressSelected}
      recipientSupportsDomain={viewModel.recipientSupportsDomain}
    />
  );
}
