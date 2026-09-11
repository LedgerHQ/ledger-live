import React from "react";
import {
  Table,
  TableBody,
  TableHeader,
  TableHeaderCell,
  TableHeaderRow,
  TableRoot,
} from "@ledgerhq/lumen-ui-react";
import { ContactTile } from "../ContactTile/ContactTile.web";
import type { ContactsViewProps } from "../../types";

type ContactsTableProps = Pick<
  ContactsViewProps,
  "rows" | "labels" | "renderAddresses" | "onContactPress" | "onViewContact" | "onViewTransactions"
>;

export function ContactsTable({
  rows,
  labels,
  renderAddresses,
  onContactPress,
  onViewContact,
  onViewTransactions,
}: ContactsTableProps) {
  return (
    <TableRoot appearance="plain" data-testid="pay-contacts-list">
      <Table>
        <TableHeader>
          <TableHeaderRow>
            <TableHeaderCell>{labels.name}</TableHeaderCell>
            <TableHeaderCell align="end">{labels.addresses}</TableHeaderCell>
            <TableHeaderCell align="end">{labels.transactions}</TableHeaderCell>
            <TableHeaderCell align="end" />
          </TableHeaderRow>
        </TableHeader>
        <TableBody>
          {rows.map(({ contact, transactionCount }) => (
            <ContactTile
              key={contact.id}
              contact={contact}
              transactionCount={transactionCount}
              labels={labels}
              renderAddresses={renderAddresses}
              onContactPress={onContactPress}
              onViewContact={onViewContact}
              onViewTransactions={onViewTransactions}
            />
          ))}
        </TableBody>
      </Table>
    </TableRoot>
  );
}
