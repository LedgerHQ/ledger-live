import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list/native";
import type { ContactsViewNativeProps } from "./ContactsView.types";

export function ContactsView({
  ledgerSyncStatus,
  featureIntroduction: _featureIntroduction,
  ledgerSyncIntroduction: _ledgerSyncIntroduction,
  ...listProps
}: ContactsViewNativeProps): React.ReactNode {
  return (
    <ContactsListFlowView {...listProps} isLedgerSyncChecking={ledgerSyncStatus === "checking"} />
  );
}
