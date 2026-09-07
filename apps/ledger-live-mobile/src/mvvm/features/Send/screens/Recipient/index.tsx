import React from "react";
import { RecipientContactsFirstView } from "./components/RecipientContactsFirstView";
import { RecipientScreenContainer } from "./components/RecipientScreenContainer";
import { useRecipientScreenViewModel } from "./hooks/useRecipientScreenViewModel";

export function RecipientScreen() {
  const viewModel = useRecipientScreenViewModel();

  if (!viewModel.ready) {
    return null;
  }

  if (viewModel.mode === "selectContactBeforeAccount") {
    return (
      <RecipientContactsFirstView
        contacts={viewModel.contacts}
        onSelectContact={viewModel.onSelectContact}
        contactAddressPicker={viewModel.contactAddressPicker}
      />
    );
  }

  return <RecipientScreenContainer screenViewModel={viewModel} />;
}
