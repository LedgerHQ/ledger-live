import React from "react";
import { ContactAvatar } from "@features/platform-contacts";
import type { Contact } from "@domain/entity-contact";

type Props = Readonly<{ contact: Contact }>;

export function HistoryContactScope({ contact }: Props) {
  return (
    <span className="inline-flex items-center gap-8 body-1" data-testid="history-contact-scope">
      {contact.name}
      <ContactAvatar contactId={contact.id} name={contact.name} isMe={contact.isMe} size="sm" />
    </span>
  );
}
