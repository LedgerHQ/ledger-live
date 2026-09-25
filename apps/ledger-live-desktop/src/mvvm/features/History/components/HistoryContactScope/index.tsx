import React from "react";
import { ContactAvatar, useContactDisplayName } from "@features/platform-contacts";
import type { Contact } from "@domain/entity-contact";

type Props = Readonly<{ contact: Contact }>;

export function HistoryContactScope({ contact }: Props) {
  const getDisplayName = useContactDisplayName();

  return (
    <span className="inline-flex items-center gap-8 body-1" data-testid="history-contact-scope">
      {getDisplayName(contact)}
      <ContactAvatar contactId={contact.id} name={contact.name} size="xs" />
    </span>
  );
}
