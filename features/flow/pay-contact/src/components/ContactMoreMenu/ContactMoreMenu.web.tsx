import React from "react";
import { IconButton, Menu, MenuContent, MenuItem, MenuTrigger } from "@ledgerhq/lumen-ui-react";
import { Clock, MoreHorizontal } from "@ledgerhq/lumen-ui-react/symbols";
import type { Contact } from "@domain/entity-contact";
import type { ContactsTableLabels } from "../../types";

type ContactMoreMenuProps = Readonly<{
  contact: Contact;
  labels: Pick<ContactsTableLabels, "moreAction" | "viewTransactions">;
  onViewTransactions?: (contact: Contact) => void;
}>;

export function ContactMoreMenu({ contact, labels, onViewTransactions }: ContactMoreMenuProps) {
  return (
    <Menu>
      <MenuTrigger
        render={
          <IconButton
            appearance="gray"
            size="sm"
            icon={MoreHorizontal}
            aria-label={labels.moreAction}
            disabled={!onViewTransactions}
            data-testid={`pay-contacts-more-action-${contact.id}`}
          />
        }
      />
      <MenuContent side="bottom" align="end">
        <MenuItem
          className="cursor-pointer"
          onClick={() => onViewTransactions?.(contact)}
          data-testid={`pay-contacts-view-transactions-${contact.id}`}
        >
          <Clock size={20} />
          {labels.viewTransactions}
        </MenuItem>
      </MenuContent>
    </Menu>
  );
}
