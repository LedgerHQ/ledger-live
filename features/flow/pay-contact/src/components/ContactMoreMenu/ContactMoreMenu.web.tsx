import React from "react";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger } from "@ledgerhq/lumen-ui-react";
import { Clock, Contact as ContactIcon, MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact } from "@domain/entity-contact";
import type { ContactsTableLabels } from "../../types";

type ContactMoreMenuProps = Readonly<{
  contact: Contact;
  labels: Pick<ContactsTableLabels, "moreAction" | "viewContact" | "viewTransactions">;
  onViewContact?: (contact: Contact) => void;
  onViewTransactions?: (contact: Contact) => void;
}>;

export function ContactMoreMenu({
  contact,
  labels,
  onViewContact,
  onViewTransactions,
}: ContactMoreMenuProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            appearance="gray"
            size="sm"
            icon={MoreHorizontal}
            aria-label={labels.moreAction}
            disabled={!onViewContact && !onViewTransactions}
            data-testid={`pay-contacts-more-action-${contact.id}`}
          />
        }
      />
      <MenuContent side="bottom" align="end">
        {onViewContact && (
          <MenuItem
            className="cursor-pointer"
            onClick={() => onViewContact(contact)}
            data-testid={`pay-contacts-view-contact-${contact.id}`}
          >
            <ContactIcon size={20} />
            {labels.viewContact}
          </MenuItem>
        )}
        {onViewTransactions && (
          <MenuItem
            className="cursor-pointer"
            onClick={() => onViewTransactions(contact)}
            data-testid={`pay-contacts-view-transactions-${contact.id}`}
          >
            <Clock size={20} />
            {labels.viewTransactions}
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  );
}
