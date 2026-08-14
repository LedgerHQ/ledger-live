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
  /** True while the machine works. The login action is not pressable then. */
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};

/** What the signed-in card holder sees. The user schema is narrow on purpose, so this is too. */
export type CardUserViewProps = {
  readonly title: string;
  readonly idLabel: string;
  readonly userId: string;
  readonly verificationLabel: string;
  readonly verificationValue: string;
  readonly logoutLabel: string;
  /** True while the logout runs. The action is not pressable then. */
  readonly isLoading: boolean;
  readonly onLogoutPress: () => void;
};

/**
 * Exactly one half is ever filled. `login` while there is a login to offer or to finish, `user` once
 * the card holder is signed in, and neither while the flow has nothing to say.
 */
export type CardLoginViewModel = {
  readonly login: CardLoginViewProps | null;
  readonly user: CardUserViewProps | null;
};
