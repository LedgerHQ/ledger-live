import React from "react";
import {
  IconButton,
  TableCell,
  TableCellContent,
  TableCellContentTitle,
  TableCellItem,
  TableRow,
} from "@ledgerhq/lumen-ui-react";
import { Telegram } from "@ledgerhq/lumen-ui-react/symbols";
import { ContactAvatar } from "@features/platform-contacts";
import { ContactMoreMenu } from "../ContactMoreMenu/ContactMoreMenu.web";
import type { Contact } from "@domain/entity-contact";
import type { ContactsTableLabels } from "../../types";

type ContactTileProps = Readonly<{
  contact: Contact;
  transactionCount: number;
  labels: ContactsTableLabels;
  renderAddresses: (addresses: Contact["addresses"]) => React.ReactNode;
  onContactPress?: (contact: Contact) => void;
  onViewContact?: (contact: Contact) => void;
  onViewTransactions?: (contact: Contact) => void;
}>;

export function ContactTile({
  contact,
  transactionCount,
  labels,
  renderAddresses,
  onContactPress,
  onViewContact,
  onViewTransactions,
}: ContactTileProps) {
  return (
    <TableRow
      clickable={Boolean(onContactPress)}
      onClick={onContactPress ? () => onContactPress(contact) : undefined}
      data-testid={`pay-contacts-tile-${contact.id}`}
    >
      <TableCell>
        <TableCellItem>
          <ContactAvatar contactId={contact.id} name={contact.name} size="sm" ariaHidden />
          <TableCellContent>
            <TableCellContentTitle>{contact.name}</TableCellContentTitle>
          </TableCellContent>
        </TableCellItem>
      </TableCell>
      <TableCell align="end">{renderAddresses(contact.addresses)}</TableCell>
      <TableCell align="end">{labels.formatTransactionCount(transactionCount)}</TableCell>
      <TableCell align="end">
        <div
          className="flex items-center justify-end gap-8"
          onClick={e => e.stopPropagation()}
          role="presentation"
        >
          <IconButton
            appearance="gray"
            size="sm"
            icon={Telegram}
            aria-label={labels.payAction}
            disabled={!onContactPress}
            onClick={() => onContactPress?.(contact)}
            data-testid={`pay-contacts-pay-action-${contact.id}`}
          />
          <ContactMoreMenu
            contact={contact}
            labels={labels}
            onViewContact={onViewContact}
            onViewTransactions={onViewTransactions}
          />
        </div>
      </TableCell>
    </TableRow>
  );
}
