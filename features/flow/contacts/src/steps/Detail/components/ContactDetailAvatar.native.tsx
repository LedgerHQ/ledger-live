import React from "react";
import type { Contact } from "@domain/entity-contact";
import { ContactAvatar } from "@features/platform-contacts";

type ContactDetailAvatarProps = Readonly<{
  contact: Contact;
}>;

export function ContactDetailAvatar({ contact }: ContactDetailAvatarProps): React.JSX.Element {
  return (
    <ContactAvatar
      contactId={contact.id}
      name={contact.name}
      size="xl"
      testId={contact.isMe ? "contacts-detail-me-avatar" : "contacts-detail-avatar"}
    />
  );
}
