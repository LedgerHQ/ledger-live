import type { PayCardProvider } from "@domain/entity-pay-card";

export type OpenHostedLogin = (loginUrl: string) => Promise<void> | void;

export type CardLoginProps = {
  readonly openHostedLogin: OpenHostedLogin;
  readonly provider?: PayCardProvider;
};

export type CardLoginViewProps = {
  readonly title: string;
  readonly description: string;
  readonly loginLabel: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};
