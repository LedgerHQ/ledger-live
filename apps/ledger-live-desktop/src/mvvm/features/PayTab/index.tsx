import React from "react";
import { Balance } from "@features/flow-pay-balance";
import { Contacts } from "@features/flow-pay-contact";
import { ContactsLedgerSyncIntroductionDialog } from "@features/flow-contacts-introduction";
import { DepositOptions } from "@features/flow-pay-deposit";
import { RequestReceive, VerifyAddress } from "@features/flow-pay-request";
import TrackPage from "~/renderer/analytics/TrackPage";
import PayTabHeader from "./components/PayTabHeader";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { FeatureTour } from "@features/flow-pay-feature-tour";
import { usePayTabFeatureTour } from "./hooks/usePayTabFeatureTour";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabContacts } from "./hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "./hooks/usePayTabRequestReceive";
import { usePayTabNewPayment } from "./hooks/usePayTabNewPayment";
import { usePayTabVerifyAddress } from "./hooks/usePayTabVerifyAddress";
import { VerifyAddressExecutorLWD } from "./verifyAddressIntent/VerifyAddressExecutorLWD";

const PayTab = () => {
  const balance = usePayCardBalance();
  const featureTour = usePayTabFeatureTour();
  const deposit = usePayTabDepositOptions(balance.onTrackEvent);
  const verify = usePayTabVerifyAddress(balance.onTrackEvent);
  const request = usePayTabRequestReceive(balance.onTrackEvent, verify.openIntro);
  const newPayment = usePayTabNewPayment();
  const actionTiles = usePayTabActionTiles(
    balance.onTrackEvent,
    deposit.open,
    request.open,
    newPayment.open,
  );
  const { contacts, ledgerSyncIntroduction } = usePayTabContacts();

  return (
    <div className="flex flex-col gap-24">
      <TrackPage category="Pay" balance_filter={balance.filter} />
      {verify.phase === "intro" && <TrackPage category="Request Address Verification" />}
      <PayTabHeader />
      <Balance {...balance} actionTiles={actionTiles} />

      <Contacts {...contacts} />
      <ContactsLedgerSyncIntroductionDialog {...ledgerSyncIntroduction} />

      <DepositOptions {...deposit.depositOptions} />
      <RequestReceive {...request.requestReceive} />

      <VerifyAddress {...verify.verifyAddress} />
      {verify.deviceIntent.active && verify.deviceIntent.selection && (
        <VerifyAddressExecutorLWD
          selection={verify.deviceIntent.selection}
          onReady={verify.deviceIntent.onReady}
          onExit={verify.deviceIntent.onExit}
        />
      )}
      <FeatureTour {...featureTour} />
    </div>
  );
};

export default PayTab;
