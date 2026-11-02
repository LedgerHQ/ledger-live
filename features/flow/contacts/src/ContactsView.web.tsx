import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list/web";
import { isContactsLedgerSyncActivationRequired } from "@features/flow-contacts-introduction";
import {
  ContactsFeatureIntroductionDialog,
  ContactsLedgerSyncIntroductionDialog,
} from "@features/flow-contacts-introduction/web";
import { ContactDetailView } from "@features/flow-contacts-detail";
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
          open={
            isContactsLedgerSyncActivationRequired(ledgerSyncStatus) &&
            ledgerSyncIntroduction.isOpen
          }
          onActivate={ledgerSyncIntroduction.onActivate}
          onDismiss={ledgerSyncIntroduction.onDismiss}
        />
      }
    />
  );
}
