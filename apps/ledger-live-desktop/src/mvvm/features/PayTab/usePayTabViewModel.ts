import { useContactsFeature } from "@features/platform-contacts";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { usePayTabFeatureTour } from "./hooks/usePayTabFeatureTour";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabContacts } from "./hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "./hooks/usePayTabRequestReceive";
import { usePayTabNewPayment } from "./hooks/usePayTabNewPayment";
import { usePayTabVerifyAddress } from "./hooks/usePayTabVerifyAddress";

export function usePayTabViewModel() {
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
  const { contacts, ledgerSyncIntroduction, contactAddressPicker } = usePayTabContacts();
  const { isEnabled: isContactsEnabled } = useContactsFeature("desktop");

  return {
    balance,
    featureTour,
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
  };
}

export type PayTabViewModel = ReturnType<typeof usePayTabViewModel>;
