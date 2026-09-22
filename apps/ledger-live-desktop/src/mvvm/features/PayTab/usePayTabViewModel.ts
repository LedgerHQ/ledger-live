import { useContactsFeature } from "@features/platform-contacts";
import { usePayAnalyticsContext } from "@features/platform-pay-analytics";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabContacts } from "./hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "./hooks/usePayTabRequestReceive";
import { usePayTabNewPayment } from "./hooks/usePayTabNewPayment";
import { usePayTabVerifyAddress } from "./hooks/usePayTabVerifyAddress";

export function usePayTabViewModel() {
  const analytics = usePayAnalyticsContext();
  const balance = usePayCardBalance(analytics.trackEvent);
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
  const { contacts, ledgerSyncIntroduction, contactAddressPicker } = usePayTabContacts(
    newPayment.payFromAddress,
  );
  const { isEnabled: isContactsEnabled } = useContactsFeature("desktop");

  return {
    balance,
    actionTiles,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
    requestReceive: request.requestReceive,
    verifyPhase: verify.phase,
    verifyAddress: verify.verifyAddress,
    deviceIntent: verify.deviceIntent,
    contacts,
    ledgerSyncIntroduction,
    contactAddressPicker,
    isContactsEnabled,
    trackRequestAddressVerification: verify.phase === "intro",
    trackRecipientAddressSelection: isContactsEnabled && contactAddressPicker.isOpen,
  };
}

export type PayTabViewModel = ReturnType<typeof usePayTabViewModel>;
