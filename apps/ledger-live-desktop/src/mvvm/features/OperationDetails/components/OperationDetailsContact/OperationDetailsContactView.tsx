import React from "react";
import { ContactAvatar } from "@features/platform-contacts";
import type { OperationDetailsContact } from "./useOperationDetailsContactViewModel";

type OperationDetailsContactViewProps = Readonly<{
  contact: OperationDetailsContact;
}>;

export function OperationDetailsContactView({ contact }: OperationDetailsContactViewProps) {
  return (
    <span
      className="inline-flex h-[30px] max-w-full items-center gap-8 body-3-semi-bold text-base"
      data-testid="operation-details-contact"
    >
      <span className="truncate">{contact.name}</span>
      <span className="shrink-0">
        <ContactAvatar
          contactId={contact.contactId}
          name={contact.rawName}
          isMe={contact.isMe}
          size="xs"
          ariaHidden
        />
      </span>
    </span>
  );
}
