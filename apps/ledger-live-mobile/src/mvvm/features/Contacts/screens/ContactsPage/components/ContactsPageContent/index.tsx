import React from "react";
import { ContactsView } from "@features/flow-contacts";
import { ContactsLedgerSyncActivationDrawer } from "LLM/features/Contacts/components/ContactsLedgerSyncActivationDrawer";
import { ContactsLedgerSyncIntroductionSheet } from "LLM/features/Contacts/components/ContactsLedgerSyncIntroductionSheet";
import { ContactsAddContactDrawerSheet } from "../ContactsAddContactDrawerSheet";
import { ContactsFeatureIntroductionSheet } from "../ContactsFeatureIntroductionSheet";
import type { ContactsPageContentProps } from "../../types";

export function ContactsPageContent({
  addContactDrawer,
  ledgerSyncActivationDrawer,
  ...pageProps
}: ContactsPageContentProps): React.JSX.Element {
  return (
    <>
      <ContactsView {...pageProps} />
      <ContactsFeatureIntroductionSheet {...pageProps.featureIntroduction} />
      <ContactsLedgerSyncIntroductionSheet {...pageProps.ledgerSyncIntroduction} />
      <ContactsLedgerSyncActivationDrawer {...ledgerSyncActivationDrawer} />
      <ContactsAddContactDrawerSheet {...addContactDrawer} />
    </>
  );
}
