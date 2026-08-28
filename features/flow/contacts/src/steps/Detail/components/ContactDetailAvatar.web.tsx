import React from "react";
import type { Contact } from "@domain/entity-contact";
import { ContactAvatar, type ContactAvatarProps } from "@features/platform-contacts";

type ContactDetailAvatarProps = Readonly<{
  contact: Contact;
  meAvatarSrc: string;
  size?: ContactAvatarProps["size"];
}>;

export function ContactDetailAvatar({
  contact,
  meAvatarSrc,
  size = "xl",
}: ContactDetailAvatarProps): React.ReactNode {
  const isCompact = size === "md";

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full motion-safe:transition-[width,height] motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
        isCompact ? "size-48" : "size-72"
      }`}
    >
      <div
        className={`origin-top-left motion-safe:transition-transform motion-safe:duration-[400ms] motion-safe:ease-in-out motion-reduce:transition-none ${
          isCompact ? "scale-[0.666667]" : "scale-100"
        }`}
      >
        <ContactAvatar
          contactId={contact.id}
          name={contact.name}
          isMe={contact.isMe}
          src={meAvatarSrc}
          ariaHidden
          size="xl"
          testId={contact.isMe ? "contacts-detail-me-avatar" : "contacts-detail-avatar"}
        />
      </div>
    </div>
  );
}
