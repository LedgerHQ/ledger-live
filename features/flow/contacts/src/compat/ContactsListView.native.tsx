import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list/native";
import type { ContactsListViewNativeProps } from "./ContactsListView.types";

export function ContactsListView({
  ledgerSyncStatus,
  featureIntroduction: _featureIntroduction,
  ledgerSyncIntroduction: _ledgerSyncIntroduction,
  ...listProps
}: ContactsListViewNativeProps): React.ReactNode {
  return (
    <ContactsListFlowView {...listProps} isLedgerSyncChecking={ledgerSyncStatus === "checking"} />
  );
}
