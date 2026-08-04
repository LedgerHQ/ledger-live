import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-react";
import type { Contact } from "@domain/entity-contact";
import { getContactAvatarColorClass } from "../../List/utils/getContactAvatarColorClass";
import { getContactInitial } from "../../../utils/getContactInitial";

type ContactDetailAvatarProps = Readonly<{
  contact: Contact;
  meAvatarSrc: string;
}>;

export function ContactDetailAvatar({
  contact,
  meAvatarSrc,
}: ContactDetailAvatarProps): React.ReactNode {
  if (contact.isMe) {
    return (
      <Avatar
        size="xl"
        src={meAvatarSrc}
        aria-hidden
        data-testid="contacts-detail-me-avatar"
      />
    );
  }

  const avatarColorClass = getContactAvatarColorClass(contact.id);
  const initial = getContactInitial(contact.name);

  return (
    <div
      className={`heading-3-semi-bold flex size-80 shrink-0 items-center justify-center rounded-full ${avatarColorClass}`}
      aria-hidden
      data-testid="contacts-detail-avatar"
    >
      {initial}
    </div>
  );
}
