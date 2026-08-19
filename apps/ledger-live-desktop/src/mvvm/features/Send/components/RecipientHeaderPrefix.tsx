import React from "react";
import { ContactAvatar } from "@features/platform-contacts/web";
import type { RecipientHeaderContact } from "@ledgerhq/live-common/flows/send/recipient/utils/getRecipientHeaderPresentation";
import type { ContactId } from "@domain/entity-contact";

type RecipientHeaderPrefixProps = Readonly<{
  contact: RecipientHeaderContact | undefined;
  children: React.ReactNode;
}>;

export function RecipientHeaderPrefix({ contact, children }: RecipientHeaderPrefixProps) {
  return (
    <span className="flex items-center gap-8">
      {children}
      {contact && (
        <ContactAvatar
          contactId={contact.id as ContactId}
          name={contact.name}
          size="xs"
          ariaHidden
          testId="send-recipient-contact-avatar"
        />
      )}
    </span>
  );
}
