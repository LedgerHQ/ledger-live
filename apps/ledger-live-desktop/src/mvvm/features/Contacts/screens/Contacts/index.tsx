import React from "react";
import { Navigate } from "react-router";
import { useContactsFeature } from "@features/flow-contacts/featureFlags";
import { ContactsView } from "./ContactsView";
import { useContactsViewModel } from "./useContactsViewModel";

function ContactsScreen() {
  const viewModel = useContactsViewModel();

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
