import type { OpenHostedLogin } from "../../state/hostTypes";
import type { CardLoginProps } from "./CardLogin.types";

export type MobileWallet = "applePay" | "googlePay" | "both";

export type CardLoginViewModelParams = CardLoginProps & {
  readonly openHostedLogin: OpenHostedLogin;
  readonly mobileWallet: MobileWallet;
};

export type CardLoginIntroRowIcon = "CoinsAddPlus" | "CreditCard" | "LedgerLogo";

export type CardLoginIntroRow = Readonly<{
  icon: CardLoginIntroRowIcon;
  title: string;
  description: string;
}>;

export type CardLoginIntroActionId = "createAccount" | "logIn";

export type CardLoginIntroAction = Readonly<{
  id: CardLoginIntroActionId;
  label: string;
  appearance: "base" | "gray";
}>;

export type CardLoginIntroViewProps = Readonly<{
  isOpen: boolean;
  title: string;
  providedBy: string;
  rows: readonly CardLoginIntroRow[];
  actions: readonly CardLoginIntroAction[];
  onActionPress: (id: CardLoginIntroActionId) => void;
  onClose: () => void;
}>;

export type CardLoginCopy = Readonly<{
  title: string;
  /** The heading the login block carries itself, under the host heading. */
  headline: string;
  description: string;
  loginLabel: string;
  /** `null` once the intro has been seen, because the login action is the login by then. */
  alreadyHaveCardLabel: string | null;
}>;

export type CardAuthErrorCopy = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  onRetry: () => void;
  onDismiss: () => void;
}>;

export type CardAuthErrorProps = Readonly<{
  error: CardAuthErrorCopy | null;
}>;

export type CardLoginViewProps = CardLoginCopy & {
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  readonly isResolving: boolean;
  readonly error: CardAuthErrorCopy | null;
  readonly onLoginPress: () => void;
  readonly onAlreadyHaveCardPress: () => void;
  readonly intro: CardLoginIntroViewProps;
};

/**
 * `null` once the card holder is signed in, because the login has nothing left to offer then.
 * `More` takes over at that point, and it reads the same flag to know it.
 */
export type CardLoginViewModel = CardLoginViewProps | null;
