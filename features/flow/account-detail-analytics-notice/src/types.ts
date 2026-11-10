export type AccountOperationHistory<Operation> = Readonly<{
  operations: readonly Operation[];
}>;

export type AccountHistorySource<Operation> = AccountOperationHistory<Operation> &
  Readonly<{ subAccounts?: readonly AccountOperationHistory<Operation>[] }>;

export type AccountAnalyticsIntroductionStatus = Readonly<{
  isEnabled: boolean;
  hasConfirmedHistory: boolean;
  hasDismissed: boolean;
}>;
