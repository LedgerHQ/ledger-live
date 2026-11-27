import React, { useState } from "react";
import { Balance } from "@features/flow-pay-balance";
import { Contacts } from "@features/flow-pay-contact/web";
import { ContactAddressPicker } from "@features/flow-pay-contact";
import { ContactsLedgerSyncIntroductionDialog } from "@features/flow-contacts-introduction/web";
import { DepositOptions } from "@features/flow-pay-deposit";
import { BankTransferIntro } from "@features/flow-pay-bank-transfer";
import { FeatureTour } from "@features/flow-pay-feature-tour";
import { TrackScreen } from "@shared/analytics-react";
import PayTabHeader from "./components/PayTabHeader";
import { PayCardDisclaimer } from "./components/PayCardDisclaimer";
import type { PayTabViewModel } from "./usePayTabViewModel";

export function PayTabView({
  balance,
  actionTiles,
  depositOptions,
  bankTransferIntro,
  contacts,
  ledgerSyncIntroduction,
  contactAddressPicker,
  isContactsEnabled,
  cardDisclaimer,
  trackRecipientAddressSelection,
}: Readonly<PayTabViewModel>) {
  const [initialBalanceFilter] = useState(balance.filter);

  return (
    <div className="flex flex-col pb-32" data-testid="paytab-screen">
      <TrackScreen category="Pay" balance_filter={initialBalanceFilter} />
      <div className="flex flex-col gap-24">
        <PayTabHeader />
        <Balance {...balance} actionTiles={actionTiles} />
      </div>

      {isContactsEnabled && (
        <>
          <Contacts {...contacts} />
          {trackRecipientAddressSelection && (
            <TrackScreen category="Recipient address selection" refreshSource={false} />
          )}
          <ContactAddressPicker {...contactAddressPicker} />
          <ContactsLedgerSyncIntroductionDialog {...ledgerSyncIntroduction} />
        </>
      )}

      {cardDisclaimer.isVisible && <PayCardDisclaimer onOpenCardApp={cardDisclaimer.openCardApp} />}

      <DepositOptions {...depositOptions} />
      <BankTransferIntro {...bankTransferIntro} />
      <FeatureTour />
    </div>
  );
}
