import type {
  CardLoginOauthConfig,
  OpenCardHostedPage,
  OpenHostedLogin,
  PayCardAuthCallback,
} from "../../state/types";

export type PayCardLoginTrackEvent = (event: string, params: Record<string, unknown>) => void;

/**
 * Asks the host to make sure the app is protected, resolving true once it is. The card is the
 * reason the mobile app lock exists, so neither path to Baanx runs while it is unprotected. Only
 * the native entry passes this: desktop has no app lock, leaves it out, and carries on as before.
 */
export type RequestAppProtection = () => Promise<boolean>;

export type CardLoginProps = {
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
  readonly openHostedLogin?: OpenHostedLogin;
  readonly openHostedPage?: OpenCardHostedPage;
  readonly onTrackEvent?: PayCardLoginTrackEvent;
  readonly requestProtection?: RequestAppProtection;
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

export type CardLoginViewProps = CardLoginCopy & {
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
  readonly onAlreadyHaveCardPress: () => void;
  readonly intro: CardLoginIntroViewProps;
};

/**
 * `null` once the card holder is signed in, because the login has nothing left to offer then.
 * `More` takes over at that point, and it reads the same flag to know it.
 */
export type CardLoginViewModel = CardLoginViewProps | null;
