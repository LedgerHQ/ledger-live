export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type BankTransferIntroRowIcon = "Bank" | "Globe" | "CreditCard";

export type BankTransferIntroRow = Readonly<{
  icon: BankTransferIntroRowIcon;
  title: string;
  description: string;
}>;

export type BankTransferIntroLabels = Readonly<{
  title: string;
  description: string;
  continueLabel: string;
  rows: readonly BankTransferIntroRow[];
}>;

export type BankTransferIntroProps = Readonly<{
  isOpen: boolean;
  labels: BankTransferIntroLabels;
  bottomInset?: number;
  /** Host-owned partner handoff (Noah / Trading). This package never navigates. */
  onBankTransfer: () => void;
  onClose: () => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type BankTransferIntroViewModel = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  continueLabel: string;
  rows: readonly BankTransferIntroRow[];
  bottomInset: number;
  onShown: () => void;
  onContinuePress: () => void;
  onClosePress: () => void;
}>;

export type BankTransferIntroViewProps = BankTransferIntroViewModel;
