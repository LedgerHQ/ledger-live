import { useCallback } from "react";
import type {
  BankTransferHandoff,
  BankTransferIntroProps,
  BankTransferIntroViewModel,
} from "../../types";

export const BANK_TRANSFER_INTRO_PAGE_EVENT = "Page cash to stable";
export const BANK_TRANSFER_INTRO_PAGE = "cash to stable";
export const BANK_TRANSFER_INTRO_FLOW = "C2S";

const TRACK_BUTTON = {
  createAccount: "create an account",
  logIn: "log in to noah",
  close: "close",
} as const;

export function useBankTransferIntroViewModel({
  isOpen,
  labels,
  heroImage,
  bottomInset = 0,
  onBankTransfer,
  onClose,
  onTrackEvent,
}: BankTransferIntroProps): BankTransferIntroViewModel {
  const onShown = useCallback(() => {
    onTrackEvent?.(BANK_TRANSFER_INTRO_PAGE_EVENT, { flow: BANK_TRANSFER_INTRO_FLOW });
  }, [onTrackEvent]);

  const trackCta = useCallback(
    (button: (typeof TRACK_BUTTON)[keyof typeof TRACK_BUTTON]) => {
      onTrackEvent?.("button_clicked", {
        button,
        flow: BANK_TRANSFER_INTRO_FLOW,
        page: BANK_TRANSFER_INTRO_PAGE,
      });
    },
    [onTrackEvent],
  );

  const handOffToPartner = useCallback(
    (button: (typeof TRACK_BUTTON)[keyof typeof TRACK_BUTTON], handoff: BankTransferHandoff) => {
      trackCta(button);
      onBankTransfer(handoff);
      onClose();
    },
    [trackCta, onBankTransfer, onClose],
  );

  const onCreateAccountPress = useCallback(() => {
    handOffToPartner(TRACK_BUTTON.createAccount, "createAccount");
  }, [handOffToPartner]);

  const onLogInPress = useCallback(() => {
    handOffToPartner(TRACK_BUTTON.logIn, "logIn");
  }, [handOffToPartner]);

  const onClosePress = useCallback(() => {
    trackCta(TRACK_BUTTON.close);
    onClose();
  }, [trackCta, onClose]);

  const onDismiss = useCallback(() => {
    onClose();
  }, [onClose]);

  return {
    isOpen,
    title: labels.title,
    description: labels.description,
    createAccountLabel: labels.createAccountLabel,
    logInLabel: labels.logInLabel,
    providedBy: labels.providedBy,
    heroImage,
    rows: labels.rows,
    bottomInset,
    onShown,
    onCreateAccountPress,
    onLogInPress,
    onClosePress,
    onDismiss,
  };
}
