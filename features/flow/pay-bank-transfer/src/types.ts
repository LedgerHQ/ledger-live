export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type BankTransferIntroRowIcon = "Bank" | "Coins" | "Chart5";

export type BankTransferIntroRow = Readonly<{
  icon: BankTransferIntroRowIcon;
  title: string;
  description: string;
}>;

export type BankTransferHandoff = "createAccount" | "logIn";

export type BankTransferIntroHeroImage = number | { readonly uri: string };

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
  /** Host-bundled image source. Re.pack only resolves assets required from the app. */
  heroImage?: BankTransferIntroHeroImage;
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
  heroImage?: BankTransferIntroHeroImage;
  rows: readonly BankTransferIntroRow[];
  bottomInset: number;
  onShown: () => void;
  onCreateAccountPress: () => void;
  onLogInPress: () => void;
  onClosePress: () => void;
  onDismiss: () => void;
}>;

export type BankTransferIntroViewProps = BankTransferIntroViewModel;
