import { useCallback, useState } from "react";
import type {
  BankTransferIntroLabels,
  BankTransferIntroProps,
  BankTransferIntroViewModel,
  PayCardTrackEvent,
} from "../../types";
import { useBankTransferIntroViewModel } from "./useBankTransferIntroViewModel";

export type UseBankTransferIntroAdapterParams = Readonly<{
  labels: BankTransferIntroLabels;
  onBankTransfer: () => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type UseBankTransferIntroAdapter = Readonly<{
  open: () => void;
  bankTransferIntro: BankTransferIntroProps;
}> &
  BankTransferIntroViewModel;

export function useBankTransferIntroAdapter({
  labels,
  onBankTransfer,
  onTrackEvent,
}: UseBankTransferIntroAdapterParams): UseBankTransferIntroAdapter {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  const bankTransferIntro: BankTransferIntroProps = {
    isOpen,
    labels,
    onBankTransfer,
    onClose,
    onTrackEvent,
  };

  const viewModel = useBankTransferIntroViewModel(bankTransferIntro);

  return { open, bankTransferIntro, ...viewModel };
}
