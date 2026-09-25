import { useCallback, useState } from "react";
import type {
  BankTransferHandoff,
  BankTransferIntroProps,
  BankTransferIntroViewModel,
} from "../../types";
import { useBankTransferIntroViewModel } from "./useBankTransferIntroViewModel";

export type UseBankTransferIntroAdapterParams = Readonly<{
  heroImage?: BankTransferIntroProps["heroImage"];
  onBankTransfer: (handoff: BankTransferHandoff) => void;
}>;

export type UseBankTransferIntroAdapter = Readonly<{
  open: () => void;
  bankTransferIntro: BankTransferIntroProps;
}> &
  BankTransferIntroViewModel;

export function useBankTransferIntroAdapter({
  heroImage,
  onBankTransfer,
}: UseBankTransferIntroAdapterParams): UseBankTransferIntroAdapter {
  const [isOpen, setIsOpen] = useState(false);

  const open = useCallback(() => setIsOpen(true), []);
  const onClose = useCallback(() => setIsOpen(false), []);

  const bankTransferIntro: BankTransferIntroProps = { isOpen, heroImage, onBankTransfer, onClose };

  const viewModel = useBankTransferIntroViewModel(bankTransferIntro);

  return { open, bankTransferIntro, ...viewModel };
}
