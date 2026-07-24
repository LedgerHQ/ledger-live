import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-rnative";
import type { Contact } from "@domain/entity-contact";
import { ContactAvatar } from "../../../components/ContactAvatar/ContactAvatar.native";

type ContactDetailAvatarProps = Readonly<{
  contact: Contact;
  meAvatarSrc: string;
}>;

export function ContactDetailAvatar({
  contact,
  meAvatarSrc,
}: ContactDetailAvatarProps): React.JSX.Element {
  if (contact.isMe) {
    return (
      <Avatar size="xl" src={meAvatarSrc} alt={contact.name} testID="contacts-detail-me-avatar" />
    );
  }

  return (
    <ContactAvatar
      contactId={contact.id}
      name={contact.name}
      size="xl"
      testID="contacts-detail-avatar"
    />
  );
}
