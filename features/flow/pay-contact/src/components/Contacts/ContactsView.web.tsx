import React from "react";
import { ContactsAddContactDialog } from "@features/flow-contacts-add-contact";
import { EmptyState } from "../EmptyState/EmptyState.web";
import { ContactsTable } from "../ContactsTable/ContactsTable.web";
import type { ContactsViewProps } from "../../types";

export function ContactsView({
  title,
  isEmpty,
  emptyState,
  addContactDialog,
  ...table
}: ContactsViewProps) {
  return (
    <div className="mt-40 flex flex-col" data-testid="pay-contacts">
      <p className="mb-12 heading-5-semi-bold text-base">{title}</p>
      {isEmpty ? <EmptyState {...emptyState} /> : <ContactsTable {...table} />}
      <ContactsAddContactDialog {...addContactDialog} />
    </div>
  );
}
