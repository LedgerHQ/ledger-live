import type { ComponentProps, ReactNode } from "react";
import type { InfoState } from "@shared/ui-info-state";
import type {
  CardLoginOauthConfig,
  OpenCardHostedPage,
  OpenHostedLogin,
  PayCardAuthCallback,
} from "../../state/types";

export type PayCardLoginTrackEvent = (event: string, params: Record<string, unknown>) => void;

export type CardLoginProps = {
  /** What the login shows beside itself while no error holds the panel. */
  readonly children?: ReactNode;
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
  readonly openHostedLogin?: OpenHostedLogin;
  readonly openHostedPage?: OpenCardHostedPage;
  readonly onTrackEvent?: PayCardLoginTrackEvent;
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

/** The spot icon each platform hands the panel, from its own Lumen symbols. */
export type CardAuthErrorIcon = Extract<
  ComponentProps<typeof InfoState>,
  { preset: "spot" }
>["spotProps"]["icon"];

/** What the panel says. The icon is the view's to supply, because its type is per platform. */
export type CardAuthErrorCopy = Readonly<{
  title: string;
  description: string;
  ctaLabel: string;
  onRetry: () => void;
}>;

export type CardAuthErrorProps = CardAuthErrorCopy & {
  readonly icon: CardAuthErrorIcon;
  readonly children?: ReactNode;
};

export type CardLoginViewProps = CardLoginCopy & {
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  /** Set when the panel owns the screen. It replaces the login block and the caller's children. */
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
