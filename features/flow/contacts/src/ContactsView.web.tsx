import React from "react";
import { ContactsListView as ContactsListFlowView } from "@features/flow-contacts-list";
import {
  ContactsFeatureIntroductionDialog,
  ContactsLedgerSyncIntroductionDialog,
  isContactsLedgerSyncActivationRequired,
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
          open={
            isContactsLedgerSyncActivationRequired(ledgerSyncStatus) &&
            ledgerSyncIntroduction.isOpen
          }
          title={ledgerSyncIntroduction.title}
          description={ledgerSyncIntroduction.description}
          activateLabel={ledgerSyncIntroduction.activateLabel}
          dismissLabel={ledgerSyncIntroduction.dismissLabel}
          onActivate={ledgerSyncIntroduction.onActivate}
          onDismiss={ledgerSyncIntroduction.onDismiss}
        />
      }
    />
  );
}
