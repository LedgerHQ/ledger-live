import type { CardLoginOauthConfig, OpenHostedLogin, PayCardAuthCallback } from "../../state/types";

export type CardLoginProps = {
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
};

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
  onActionPress: () => void;
  onClose: () => void;
}>;

export type CardLoginCopy = Readonly<{
  title: string;
  description: string;
  loginLabel: string;
}>;

export type CardLoginViewProps = CardLoginCopy & {
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
  readonly intro: CardLoginIntroViewProps;
};

/**
 * `null` once the card holder is signed in, because the login has nothing left to offer then.
 * `CardMore` takes over at that point, and it reads the same flag to know it.
 */
export type CardLoginViewModel = CardLoginViewProps | null;
