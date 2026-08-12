export type OpenHostedLogin = (loginUrl: string) => Promise<void> | void;

/**
 * Per-app OAuth client configuration. It reaches the flow as a prop because the values are the app's
 * to know: the client id comes from its environment, and the redirect URI is the deep link the app
 * registers — and has whitelisted with the provider.
 */
export type CardLoginOauthConfig = {
  readonly clientId: string;
  readonly redirectUri: string;
};

export type CardLoginProps = {
  readonly openHostedLogin: OpenHostedLogin;
  readonly oauth: CardLoginOauthConfig;
};

export type CardLoginViewProps = {
  readonly title: string;
  readonly description: string;
  readonly loginLabel: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};
