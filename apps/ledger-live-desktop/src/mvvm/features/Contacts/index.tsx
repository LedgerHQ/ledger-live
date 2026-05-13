import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import ContactsView from "./ContactsView";
import { useContactsViewModel } from "./hooks/useContactsViewModel";

export const Contacts = () => {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const viewModel = useContactsViewModel();

  if (!contactsAlpha) return null;
  return <ContactsView {...viewModel} />;
};

export default Contacts;
