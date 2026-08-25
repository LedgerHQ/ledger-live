import React from "react";
import { AddNewContactView } from "./AddNewContactView";
import { AddNewContactAddressView } from "./AddNewContactAddressView";
import { useAddNewContactViewModel } from "./hooks/useAddNewContactViewModel";

export function AddNewContactScreen() {
  const viewModel = useAddNewContactViewModel();

  if (viewModel.addressPhase) {
    return <AddNewContactAddressView addressPhase={viewModel.addressPhase} />;
  }

  return (
    <AddNewContactView
      isConfirmEnabled={viewModel.isConfirmEnabled}
      isSaving={viewModel.isSaving || viewModel.isOpeningAddressFlow}
      draftName={viewModel.draftName}
      avatarInitial={viewModel.avatarInitial}
      invalidNameError={viewModel.invalidNameError}
      labels={viewModel.labels}
      onDraftNameChange={viewModel.onDraftNameChange}
      onConfirm={viewModel.onConfirm}
      reset={viewModel.reset}
    />
  );
}
