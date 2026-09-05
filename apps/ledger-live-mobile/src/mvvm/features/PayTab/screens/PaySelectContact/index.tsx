import React from "react";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { ContactsPage } from "LLM/features/Contacts";
import { usePaySelectContactViewModel } from "./usePaySelectContactViewModel";

export function PaySelectContactScreen() {
  const { title, onSelectContact, contactAddressPicker } = usePaySelectContactViewModel();

  return (
    <>
      <ContactsPage title={title} onSelectContact={onSelectContact} />
      <ContactAddressPicker {...contactAddressPicker} />
    </>
  );
}
