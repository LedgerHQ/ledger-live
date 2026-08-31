import React from "react";
import { Navigate } from "react-router";
import { useContactsFeature } from "@features/platform-contacts";
import { ContactsView } from "./ContactsView";
import { useAddContactDialogAdapter } from "./useAddContactDialogAdapter";
import { useContactsViewModel } from "./useContactsViewModel";

function ContactsScreen() {
  const pageViewModel = useContactsViewModel();
  const addContactDialog = useAddContactDialogAdapter(contact => {
    pageViewModel.onClearSearch();
    pageViewModel.onSelectContact(contact.id);
  });
  const viewModel = {
    ...pageViewModel,
    onAddContact: () => pageViewModel.onRequestAddContact(addContactDialog.onOpen),
    addContactDialog,
  };

  return <ContactsView {...viewModel} />;
}

const Contacts = () => {
  const { isEnabled } = useContactsFeature("desktop");

  if (!isEnabled) {
    return <Navigate to="/" replace />;
  }

  return <ContactsScreen />;
};

export default Contacts;
