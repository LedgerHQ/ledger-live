import React from "react";
import { ContactsView } from "./ContactsView";
import { useContactsViewModel } from "./hooks/useContactsViewModel";

export function Contacts() {
  const { title, description, handleClick } = useContactsViewModel();

  return <ContactsView title={title} description={description} onClick={handleClick} />;
}
