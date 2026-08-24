import React from "react";
import { isContactsSearchNoResultsViewModel, type ContactsListViewProps } from "./types";
import { ContactsLedgerSyncLoadingPane } from "./components/LedgerSyncLoadingPane/ContactsLedgerSyncLoadingPane";
import { ContactsList } from "./components/ContactsList/ContactsList";
import { ContactsPageLayout } from "./components/PageLayout/ContactsPageLayout";

function renderContactsDetailPane(
  isLedgerSyncChecking: boolean,
  detail: ContactsListViewProps["detail"],
): React.ReactNode {
  if (isLedgerSyncChecking) {
    return <ContactsLedgerSyncLoadingPane testId="contacts-ledger-sync-detail-loading" />;
  }

  if (!detail) {
    return undefined;
  }

  return detail;
}

export function ContactsListView(props: ContactsListViewProps): React.ReactNode {
  const { isLedgerSyncChecking } = props;
  const showAddContact = !isContactsSearchNoResultsViewModel(props.viewModel);
  const contactsList = <ContactsList {...props} />;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-32" data-testid="contacts-page">
      <div
        aria-busy={isLedgerSyncChecking}
        className={`flex min-h-0 flex-1 flex-col${isLedgerSyncChecking ? " pointer-events-none" : ""}`}
        inert={isLedgerSyncChecking}
      >
        <ContactsPageLayout
          title={props.labels.title}
          addContactLabel={props.labels.addContact}
          showAddContact={showAddContact}
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
          detail={renderContactsDetailPane(isLedgerSyncChecking, props.detail)}
        />
      </div>
      {props.featureIntroduction}
      {props.ledgerSyncIntroduction}
    </div>
  );
}
