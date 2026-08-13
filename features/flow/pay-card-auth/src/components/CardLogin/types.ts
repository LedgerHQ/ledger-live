/**
 * How a login attempt ended in the browser. An opener that only hands the URL over
 * knows neither and returns nothing.
 */
export type OpenHostedLoginOutcome = "redirected" | "cancelled";

export type OpenHostedLogin = (
  loginUrl: string,
  redirectUri: string,
) => Promise<OpenHostedLoginOutcome | void> | OpenHostedLoginOutcome | void;

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
