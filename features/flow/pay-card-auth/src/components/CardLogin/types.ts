import type { CardLoginOauthConfig, OpenHostedLogin, PayCardAuthCallback } from "../../state/types";

export type CardLoginProps = {
  readonly oauthConfig: CardLoginOauthConfig;
  /**
   * The redirect the app received, when it has one. The app's router owns the deep link, so it hands
   * the flow the `code` and `state` it already parsed.
   */
  readonly callback?: PayCardAuthCallback | null;
};

export type CardLoginViewModelParams = CardLoginProps & {
  readonly openHostedLogin: OpenHostedLogin;
};

export type CardLoginViewProps = {
  readonly title: string;
  readonly description: string;
  readonly loginLabel: string;
  /** True once the user is signed in and the card surface takes over. */
  readonly isHidden: boolean;
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};
