import React from "react";
import { Balance } from "@features/flow-pay-balance";
import { Contacts, ContactAddressPicker } from "@features/flow-pay-contact";
import { ContactsLedgerSyncIntroductionDialog } from "@features/flow-contacts-introduction";
import { DepositOptions } from "@features/flow-pay-deposit";
import { BankTransferIntro } from "@features/flow-pay-bank-transfer";
import { RequestReceive, VerifyAddress } from "@features/flow-pay-request";
import { FeatureTour } from "@features/flow-pay-feature-tour";
import TrackPage from "~/renderer/analytics/TrackPage";
import PayTabHeader from "./components/PayTabHeader";
import { VerifyAddressExecutorLWD } from "./verifyAddressIntent/VerifyAddressExecutorLWD";
import type { PayTabViewModel } from "./usePayTabViewModel";

export function PayTabView({
  balance,
  featureTour,
  actionTiles,
  depositOptions,
  bankTransferIntro,
  requestReceive,
  verifyPhase,
  verifyAddress,
  deviceIntent,
  contacts,
  ledgerSyncIntroduction,
  contactAddressPicker,
  isContactsEnabled,
}: Readonly<PayTabViewModel>) {
  return (
    <div className="flex flex-col gap-24">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      {verifyPhase === "intro" && <TrackPage category="Request Address Verification" />}
      <PayTabHeader />
      <Balance {...balance} actionTiles={actionTiles} />

      {isContactsEnabled && (
        <>
          <Contacts {...contacts} />
          <ContactAddressPicker {...contactAddressPicker} />
          <ContactsLedgerSyncIntroductionDialog {...ledgerSyncIntroduction} />
        </>
      )}

      <DepositOptions {...depositOptions} />
      <BankTransferIntro {...bankTransferIntro} />
      <RequestReceive {...requestReceive} />

      <VerifyAddress {...verifyAddress} />
      {deviceIntent.active && deviceIntent.selection && (
        <VerifyAddressExecutorLWD
          selection={deviceIntent.selection}
          onReady={deviceIntent.onReady}
          onExit={deviceIntent.onExit}
        />
      )}
      <FeatureTour {...featureTour} />
    </div>
  );
}
