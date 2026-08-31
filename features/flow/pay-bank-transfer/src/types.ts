export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type BankTransferIntroRowIcon = "Bank" | "Coins" | "Chart5";

export type BankTransferIntroRow = Readonly<{
  icon: BankTransferIntroRowIcon;
  title: string;
  description: string;
}>;

export type BankTransferHandoff = "createAccount" | "logIn";

export type BankTransferIntroLabels = Readonly<{
  title: string;
  description: string;
  createAccountLabel: string;
  logInLabel: string;
  providedBy: string;
  rows: readonly BankTransferIntroRow[];
}>;

export type BankTransferIntroProps = Readonly<{
  isOpen: boolean;
  labels: BankTransferIntroLabels;
  bottomInset?: number;
  /** Host-owned partner handoff (Noah / Trading). This package never navigates. */
  onBankTransfer: (handoff: BankTransferHandoff) => void;
  onClose: () => void;
  onTrackEvent?: PayCardTrackEvent;
}>;

export type BankTransferIntroViewModel = Readonly<{
  isOpen: boolean;
  title: string;
  description: string;
  createAccountLabel: string;
  logInLabel: string;
  providedBy: string;
  rows: readonly BankTransferIntroRow[];
  bottomInset: number;
  onShown: () => void;
  onCreateAccountPress: () => void;
  onLogInPress: () => void;
  onClosePress: () => void;
  onDismiss: () => void;
}>;

export type BankTransferIntroViewProps = BankTransferIntroViewModel;
