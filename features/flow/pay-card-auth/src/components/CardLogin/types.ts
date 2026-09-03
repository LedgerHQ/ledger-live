import type { CardLoginOauthConfig, OpenHostedLogin, PayCardAuthCallback } from "../../state/types";

export type CardLoginProps = {
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
};

/**
 * The wallet the virtual card can be added to. `both` is for a host that cannot know the phone the
 * card will land on, which is every desktop.
 */
export type MobileWallet = "applePay" | "googlePay" | "both";

export type CardLoginViewModelParams = CardLoginProps & {
  readonly openHostedLogin: OpenHostedLogin;
  readonly mobileWallet: MobileWallet;
};

/** Verified to exist in both Lumen symbol packages. A designer must confirm the choice. */
export type CardLoginIntroRowIcon = "CoinsAddPlus" | "CreditCard" | "LedgerLogo";

export type CardLoginIntroRow = Readonly<{
  icon: CardLoginIntroRowIcon;
  title: string;
  description: string;
}>;

export type CardLoginIntroActionId = "createAccount" | "logIn";

/**
 * One button of the intro sheet. Both buttons run the same action today, so the list is what makes
 * a later cut to a single button a one-line change: remove an entry.
 */
export type CardLoginIntroAction = Readonly<{
  id: CardLoginIntroActionId;
  label: string;
  appearance: "base" | "gray";
}>;

export type CardLoginIntroViewProps = Readonly<{
  /** True while the sheet must be on screen. The view model owns the value. */
  isOpen: boolean;
  title: string;
  providedBy: string;
  rows: readonly CardLoginIntroRow[];
  actions: readonly CardLoginIntroAction[];
  /** Every action calls this. All the buttons run the same login. */
  onActionPress: () => void;
  /** The close button, the backdrop, a drag down or the Escape key. It never marks the flag seen. */
  onClose: () => void;
}>;

/**
 * The copy of the login block. The title never moves, while the subtitle and the button label
 * switch on the intro flag: they sell the card until the intro has been seen, and offer a login
 * after. The press behind them is the same one, and it shows the intro first while the flag is down.
 */
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
