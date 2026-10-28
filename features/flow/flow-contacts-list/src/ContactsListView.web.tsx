import React, { type ChangeEvent, type ReactNode } from "react";
import { cn } from "@ledgerhq/lumen-design-core/cn";
import type { ContactId } from "@domain/entity-contact";
import { isContactsSearchNoResultsViewModel, type ContactsPageSharedProps } from "./types";
import { useContactsListCopy } from "./copy/useContactsListCopy";
import { ContactsLedgerSyncLoadingPane } from "./components/LedgerSyncLoadingPane/ContactsLedgerSyncLoadingPane";
import { ContactsList } from "./components/ContactsList/ContactsList";
import { ContactsPageLayout } from "./components/PageLayout/ContactsPageLayout";

export type ContactsListViewProps = ContactsPageSharedProps &
  Readonly<{
    onSearchInputChange: (event: ChangeEvent<HTMLInputElement>) => void;
    onOpenMe: (contactId: ContactId) => void;
    detail?: ReactNode;
    featureIntroduction?: ReactNode;
    ledgerSyncIntroduction?: ReactNode;
  }>;

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
  const labels = useContactsListCopy();
  const showAddContact = !isContactsSearchNoResultsViewModel(props.viewModel);
  const contactsList = <ContactsList {...props} labels={labels} />;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-32" data-testid="contacts-page">
      <div
        aria-busy={isLedgerSyncChecking}
        className={cn(
          "flex min-h-0 flex-1 flex-col",
          isLedgerSyncChecking && "pointer-events-none",
        )}
        inert={isLedgerSyncChecking}
      >
        <ContactsPageLayout
          title={labels.title}
          addContactLabel={labels.addContact}
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
