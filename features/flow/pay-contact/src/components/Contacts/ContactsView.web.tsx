import React from "react";
import { ContactsAddContactDialog } from "@features/flow-contacts-add-contact/web";
import { EmptyState } from "../EmptyState/EmptyState";
import { ContactsTable } from "../ContactsTable/ContactsTable";
import type { AddContactDialogViewModel } from "@features/flow-contacts-add-contact";
import type { ContactRowViewModel, ContactsTableLabels, EmptyStateProps } from "../../types";
import type { ContactsProps } from "./Contacts";

export type ContactsViewProps = Pick<
  ContactsProps,
  "renderAddresses" | "onContactPress" | "onViewTransactions" | "onViewContact"
> &
  Readonly<{
    title: string;
    labels: ContactsTableLabels;
    isEmpty: boolean;
    rows: readonly ContactRowViewModel[];
    emptyState: EmptyStateProps;
    addContactDialog: AddContactDialogViewModel;
  }>;

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
