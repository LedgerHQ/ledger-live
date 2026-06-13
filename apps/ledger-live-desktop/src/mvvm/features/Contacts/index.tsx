import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { showContactsTestPanelSelector } from "~/renderer/reducers/settings";
import ContactsView from "./ContactsView";
import { useContactsViewModel } from "./hooks/useContactsViewModel";

export const Contacts = () => {
  const showContactsTestPanel = useSelector(showContactsTestPanelSelector);
  const viewModel = useContactsViewModel();

  if (!showContactsTestPanel) return null;
  return <ContactsView {...viewModel} />;
};

export default Contacts;
