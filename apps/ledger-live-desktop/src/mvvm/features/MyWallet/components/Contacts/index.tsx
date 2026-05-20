import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { contactsAlphaSelector } from "~/renderer/reducers/settings";
import { ContactsView } from "./ContactsView";
import { useContactsViewModel } from "./hooks/useContactsViewModel";

export function Contacts() {
  const contactsAlpha = useSelector(contactsAlphaSelector);
  const { title, description, handleClick } = useContactsViewModel();

  if (!contactsAlpha) return null;
  return <ContactsView title={title} description={description} onClick={handleClick} />;
}
