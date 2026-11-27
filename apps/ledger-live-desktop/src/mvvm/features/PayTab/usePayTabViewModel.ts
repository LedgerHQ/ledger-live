import { useContactsFeature } from "@features/platform-contacts";
import { usePayCardBalance } from "./hooks/usePayCardBalance";
import { usePayTabActionTiles } from "./hooks/usePayTabActionTiles";
import { usePayTabCardDisclaimer } from "./hooks/usePayTabCardDisclaimer";
import { usePayTabContacts } from "./hooks/usePayTabContacts";
import { usePayTabDepositOptions } from "./hooks/usePayTabDepositOptions";
import { usePayTabRequestReceive } from "./hooks/usePayTabRequestReceive";
import { usePayTabNewPayment } from "./hooks/usePayTabNewPayment";

export function usePayTabViewModel() {
  const balance = usePayCardBalance();
  const request = usePayTabRequestReceive();
  const deposit = usePayTabDepositOptions(request.open);
  const newPayment = usePayTabNewPayment();
  const actionTiles = usePayTabActionTiles(deposit.open, request.open, newPayment.open);
  const { contacts, ledgerSyncIntroduction, contactAddressPicker } = usePayTabContacts(
    newPayment.payFromAddress,
  );
  const { isEnabled: isContactsEnabled } = useContactsFeature("desktop");
  const cardDisclaimer = usePayTabCardDisclaimer();

  return {
    balance,
    actionTiles,
    depositOptions: deposit.depositOptions,
    bankTransferIntro: deposit.bankTransferIntro,
    contacts,
    ledgerSyncIntroduction,
    contactAddressPicker,
    isContactsEnabled,
    cardDisclaimer,
    trackRecipientAddressSelection: isContactsEnabled && contactAddressPicker.isOpen,
  };
}

export type PayTabViewModel = ReturnType<typeof usePayTabViewModel>;
