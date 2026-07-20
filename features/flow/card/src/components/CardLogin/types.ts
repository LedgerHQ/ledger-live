export type CardLoginViewProps = {
  readonly loginLabel: string;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly onLoginPress: () => void;
};

export type OpenHostedLogin = (loginUrl: string) => Promise<void> | void;
