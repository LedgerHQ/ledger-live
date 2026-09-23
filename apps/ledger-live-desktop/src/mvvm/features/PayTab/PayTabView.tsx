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
  actionTiles,
  depositOptions,
  bankTransferIntro,
  requestReceive,
  verifyAddress,
  deviceIntent,
  contacts,
  ledgerSyncIntroduction,
  contactAddressPicker,
  isContactsEnabled,
  trackRequestAddressVerification,
  trackRecipientAddressSelection,
}: Readonly<PayTabViewModel>) {
  return (
    <div className="flex flex-col pb-32">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      {requestReceive.isOpen && requestReceive.address ? (
        <TrackPage
          category="Request complete"
          flow="request"
          asset={requestReceive.asset.ticker}
          network={requestReceive.network}
        />
      ) : null}
      {trackRequestAddressVerification && <TrackPage category="Request Address Verification" />}
      <div className="flex flex-col gap-24">
        <PayTabHeader />
        <Balance {...balance} actionTiles={actionTiles} />
      </div>

      {isContactsEnabled && (
        <>
          <Contacts {...contacts} />
          {trackRecipientAddressSelection && (
            <TrackPage category="Recipient address selection" refreshSource={false} />
          )}
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
          onTrackEvent={verifyAddress.onTrackEvent}
        />
      )}
      <FeatureTour />
    </div>
  );
}
