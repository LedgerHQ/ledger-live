export type OpenHostedLogin = (loginUrl: string, redirectUri: string) => Promise<void> | void;

export type CardLoginViewModelParams = {
  readonly openHostedLogin: OpenHostedLogin;
};

export type CardLoginViewProps = {
  readonly title: string;
  readonly description: string;
  readonly loginLabel: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};
