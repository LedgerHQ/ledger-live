import React from "react";
import { ContactsFeatureIntroductionDialog } from "../ContactsFeatureIntroduction/ContactsFeatureIntroductionDialog.web";
import { ContactsLedgerSyncIntroductionDialog } from "../ContactsLedgerSyncIntroduction/ContactsLedgerSyncIntroductionDialog.web";
import type { ContactsPageProps } from "../../types";
import { ContactsLedgerSyncLoadingPane } from "./ContactsLedgerSyncLoadingPane.web";
import { ContactsList } from "../ContactsList/ContactsList.web";
import { ContactsPageLayout } from "../ContactsPageLayout/ContactsPageLayout.web";

export function ContactsPage(props: ContactsPageProps): React.ReactNode {
  const isLedgerSyncChecking = props.ledgerSyncStatus === "checking";
  const isLedgerSyncIntroductionOpen =
    props.ledgerSyncStatus === "inactive" && props.ledgerSyncIntroduction.isOpen;
  const contactsList = <ContactsList {...props} />;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-24 pb-32" data-testid="contacts-page">
      <div
        aria-busy={isLedgerSyncChecking}
        className={`flex min-h-0 flex-1 flex-col${isLedgerSyncChecking ? " pointer-events-none" : ""}`}
        inert={isLedgerSyncChecking}
      >
        <ContactsPageLayout
          title={props.labels.title}
          addContactLabel={props.labels.addContact}
          onAddContact={props.onAddContact}
          list={
            isLedgerSyncChecking ? (
              <ContactsLedgerSyncLoadingPane testId="contacts-ledger-sync-list-loading">
                {contactsList}
              </ContactsLedgerSyncLoadingPane>
            ) : (
              contactsList
            )
          }
          detail={
            isLedgerSyncChecking ? (
              <ContactsLedgerSyncLoadingPane testId="contacts-ledger-sync-detail-loading" />
            ) : undefined
          }
        />
      </div>
      <ContactsFeatureIntroductionDialog {...props.featureIntroduction} />
      <ContactsLedgerSyncIntroductionDialog
        open={isLedgerSyncIntroductionOpen}
        description={props.ledgerSyncIntroduction.description}
        dismissLabel={props.ledgerSyncIntroduction.dismissLabel}
        onDismiss={props.ledgerSyncIntroduction.onDismiss}
      />
    </div>
  );
}
