import { useCallback } from "react";
import type { BankTransferIntroProps, BankTransferIntroViewModel } from "../../types";

export const BANK_TRANSFER_INTRO_PAGE_EVENT = "Page cash to stable";
export const BANK_TRANSFER_INTRO_PAGE = "cash to stable";
export const BANK_TRANSFER_INTRO_FLOW = "C2S";

const TRACK_BUTTON = {
  continue: "continue",
  close: "close",
} as const;

export function useBankTransferIntroViewModel({
  isOpen,
  labels,
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

  const onContinuePress = useCallback(() => {
    trackCta(TRACK_BUTTON.continue);
    onBankTransfer();
    onClose();
  }, [trackCta, onBankTransfer, onClose]);

  const onClosePress = useCallback(() => {
    trackCta(TRACK_BUTTON.close);
    onClose();
  }, [trackCta, onClose]);

  return {
    isOpen,
    title: labels.title,
    description: labels.description,
    continueLabel: labels.continueLabel,
    rows: labels.rows,
    bottomInset,
    onShown,
    onContinuePress,
    onClosePress,
  };
}
