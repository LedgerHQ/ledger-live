import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list/native";
import type { ContactsViewProps } from "./ContactsView.types";

export function ContactsView({
  ledgerSyncStatus,
  detail: _detail,
  ...listProps
}: ContactsViewProps): React.ReactNode {
  return (
    <ContactsListFlowView {...listProps} isLedgerSyncChecking={ledgerSyncStatus === "checking"} />
  );
}
