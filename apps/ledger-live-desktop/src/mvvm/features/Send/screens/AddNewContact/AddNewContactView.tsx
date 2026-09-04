import React from "react";
import { Avatar } from "@ledgerhq/lumen-ui-react";
import {
  ContactsAddContactContent,
  type ContactsAddContactContentProps,
} from "@features/flow-contacts-add-contact";

export type AddNewContactViewProps = ContactsAddContactContentProps;

export function AddNewContactView(props: AddNewContactViewProps) {
  return (
    <div data-testid="send-add-new-contact-step">
      <div className="flex justify-center pt-12">
        <Avatar size="lg" fallbackText={props.avatarInitial} aria-hidden />
      </div>
      <ContactsAddContactContent {...props} />
    </div>
  );
}
