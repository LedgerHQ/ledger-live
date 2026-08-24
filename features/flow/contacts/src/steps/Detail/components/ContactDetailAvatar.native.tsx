import React from "react";
import type { Contact } from "@domain/entity-contact";
import { ContactAvatar } from "@features/platform-contacts";

type ContactDetailAvatarProps = Readonly<{
  contact: Contact;
  meAvatarSrc: string;
}>;

export function ContactDetailAvatar({
  contact,
  meAvatarSrc,
}: ContactDetailAvatarProps): React.JSX.Element {
  return (
    <ContactAvatar
      contactId={contact.id}
      name={contact.name}
      isMe={contact.isMe}
      src={meAvatarSrc}
      size="xl"
      testId={contact.isMe ? "contacts-detail-me-avatar" : "contacts-detail-avatar"}
    />
  );
}
