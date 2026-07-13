import React from "react";
import { ContactsButton as ContactsButtonView } from "@features/flow-contacts";
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
      onPress={handleClick}
    />
  );
}
