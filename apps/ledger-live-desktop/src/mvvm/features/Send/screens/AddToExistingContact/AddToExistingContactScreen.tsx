import React from "react";
import { AddNewContactAddressView } from "LLD/features/Send/screens/AddNewContact/AddNewContactAddressView";
import { AddToExistingContactView } from "./AddToExistingContactView";
import { useAddToExistingContactViewModel } from "./hooks/useAddToExistingContactViewModel";

export function AddToExistingContactScreen() {
  const viewModel = useAddToExistingContactViewModel();

  if (viewModel.addressPhase) {
    return <AddNewContactAddressView addressPhase={viewModel.addressPhase} />;
  }

  return (
    <AddToExistingContactView
      viewModel={viewModel.listViewModel}
      searchQuery={viewModel.searchQuery}
      searchPlaceholder={viewModel.labels.searchPlaceholder}
      searchNoResults={viewModel.labels.searchNoResults}
      formatAddressCount={viewModel.labels.formatAddressCount}
      meAvatarSrc={viewModel.meAvatarSrc}
      isOpeningAddressFlow={viewModel.isOpeningAddressFlow}
      onSearchInputChange={viewModel.onSearchInputChange}
      onSelectContact={viewModel.onSelectContact}
    />
  );
}
