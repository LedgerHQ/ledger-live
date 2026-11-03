import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list/web";
import { ContactDetailView } from "@features/flow-contacts-detail";
import type { ContactsViewProps } from "./ContactsView.types";

export function ContactsView({
  ledgerSyncStatus,
  onSearchQueryChange,
  onOpenContact,
  detail,
  ...listProps
}: ContactsViewProps): React.ReactNode {
  return (
    <ContactsListFlowView
      {...listProps}
      onOpenContact={onOpenContact}
      onOpenMe={onOpenContact}
      isLedgerSyncChecking={ledgerSyncStatus === "checking"}
      detail={detail ? <ContactDetailView {...detail} /> : undefined}
      onSearchInputChange={event => onSearchQueryChange(event.target.value)}
    />
  );
}
