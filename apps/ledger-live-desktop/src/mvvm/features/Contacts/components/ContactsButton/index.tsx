import React from "react";
import { ContactsButton as ContactsButtonView } from "@features/flow-contacts/components/ContactsButton";
import { useContactsButtonViewModel } from "./useContactsButtonViewModel";

export function ContactsButton() {
  const { isEnabled, title, description, newBadgeLabel, handleClick } =
    useContactsButtonViewModel();

  if (!isEnabled) {
    return null;
  }

  return (
    <ContactsButtonView
      title={title}
      description={description}
      newBadgeLabel={newBadgeLabel}
      onClick={handleClick}
    />
  );
}
