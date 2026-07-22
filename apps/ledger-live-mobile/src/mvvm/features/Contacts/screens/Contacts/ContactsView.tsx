import React from "react";
import { ContactsPage } from "@features/flow-contacts";
import { ContactsAddContactDrawerSheet } from "./components/ContactsAddContactDrawerSheet";
import { ContactsLedgerSyncIntroductionSheet } from "./components/ContactsLedgerSyncIntroductionSheet";
import type { ContactsViewModel } from "./useContactsViewModel";

export function ContactsView({
  ledgerSyncIntroductionSheet,
  addContactDrawer,
  ...pageProps
}: ContactsViewModel) {
  return (
    <>
      <ContactsPage {...pageProps} />
      <ContactsLedgerSyncIntroductionSheet
        {...pageProps.ledgerSyncIntroduction}
        {...ledgerSyncIntroductionSheet}
      />
      <ContactsAddContactDrawerSheet {...addContactDrawer} />
    </>
  );
}
