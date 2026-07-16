import React from "react";
import { ContactsLedgerSyncIntroductionDialog } from "../../ledgerSync/ContactsLedgerSyncIntroductionDialog.web";
import { ContactsLedgerSyncLoadingOverlay } from "../../ledgerSync/ContactsLedgerSyncLoadingOverlay.web";
import type { ContactsPageWebProps } from "../../ledgerSync/types";
import { ContactsList } from "../ContactsList/ContactsList.web";
import { ContactsPageLayout } from "../ContactsPageLayout/ContactsPageLayout.web";

export function ContactsPage(props: ContactsPageWebProps): React.ReactNode {
  const isIntroductionOpen =
    props.ledgerSyncStatus === "inactive" && props.ledgerSyncIntroduction.isOpen;

  return (
    <div className="relative flex min-h-0 flex-1 flex-col px-24 pb-32" data-testid="contacts-page">
      <ContactsPageLayout
        title={props.labels.title}
        addContactLabel={props.labels.addContact}
        onAddContact={props.onAddContact}
        list={<ContactsList {...props} />}
      />
      {props.ledgerSyncStatus === "checking" ? <ContactsLedgerSyncLoadingOverlay /> : null}
      <ContactsLedgerSyncIntroductionDialog
        open={isIntroductionOpen}
        {...props.ledgerSyncIntroduction}
      />
    </div>
  );
}
