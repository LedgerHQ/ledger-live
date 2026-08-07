import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list";
import { ContactDetailView } from "../steps/Detail/ContactDetailView.web";
import { ContactsFeatureIntroductionDialog } from "../steps/Introduction/Feature/ContactsFeatureIntroductionDialog.web";
import { ContactsLedgerSyncIntroductionDialog } from "../steps/Introduction/LedgerSync/ContactsLedgerSyncIntroductionDialog.web";
import type { ContactsListViewProps } from "./ContactsListView.types";

export function ContactsListView({
  ledgerSyncStatus,
  featureIntroduction,
  ledgerSyncIntroduction,
  detail,
  ...listProps
}: ContactsListViewProps): React.ReactNode {
  return (
    <ContactsListFlowView
      {...listProps}
      isLedgerSyncChecking={ledgerSyncStatus === "checking"}
      detail={detail ? <ContactDetailView {...detail} /> : undefined}
      featureIntroduction={<ContactsFeatureIntroductionDialog {...featureIntroduction} />}
      ledgerSyncIntroduction={
        <ContactsLedgerSyncIntroductionDialog
          open={ledgerSyncStatus === "inactive" && ledgerSyncIntroduction.isOpen}
          description={ledgerSyncIntroduction.description}
          dismissLabel={ledgerSyncIntroduction.dismissLabel}
          onDismiss={ledgerSyncIntroduction.onDismiss}
        />
      }
    />
  );
}
