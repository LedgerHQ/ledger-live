export type PayCardTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type BankTransferIntroRowIcon = "Bank" | "Coins" | "Chart5";

export type BankTransferIntroRow = Readonly<{
  icon: BankTransferIntroRowIcon;
  title: string;
  description: string;
}>;

export type BankTransferHandoff = "createAccount" | "logIn";

export type BankTransferIntroHeroImage = number | { readonly uri: string };

/**
 * Copy is resolved inside this package through `@shared/i18n`; the host only injects
 * analytics, open state, and partner handoff. Keys live under `payTab.bankTransferIntro.*`
 * in each app's default namespace.
 */
export type BankTransferIntroProps = Readonly<{
  isOpen: boolean;
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
