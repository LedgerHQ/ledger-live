import React from "react";
import { ContactsView } from "@features/flow-contacts";
import { ContactsAddContactDrawerSheet } from "../ContactsAddContactDrawerSheet";
import { ContactsFeatureIntroductionSheet } from "../ContactsFeatureIntroductionSheet";
import { ContactsLedgerSyncIntroductionSheet } from "../ContactsLedgerSyncIntroductionSheet";
import type { ContactsPageContentProps } from "../../types";

export function ContactsPageContent({
  ledgerSyncIntroductionContent,
  addContactDrawer,
  ...pageProps
}: ContactsPageContentProps): React.JSX.Element {
  return (
    <>
      <ContactsView {...pageProps} />
      <ContactsFeatureIntroductionSheet {...pageProps.featureIntroduction} />
      <ContactsLedgerSyncIntroductionSheet
        {...pageProps.ledgerSyncIntroduction}
        {...ledgerSyncIntroductionContent}
      />
      <ContactsAddContactDrawerSheet {...addContactDrawer} />
    </>
  );
}
