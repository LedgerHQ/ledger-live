import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list";
import {
  ContactsFeatureIntroductionDialog,
  ContactsLedgerSyncIntroductionDialog,
} from "@features/flow-contacts-introduction";
import { ContactDetailView } from "./steps/Detail/ContactDetailView.web";
import type { ContactsViewProps } from "./ContactsView.types";

export function ContactsView({
  ledgerSyncStatus,
  featureIntroduction,
  ledgerSyncIntroduction,
  detail,
  ...listProps
}: ContactsViewProps): React.ReactNode {
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
