export type AccountAnalyticsEntryState = Readonly<{
  accountAnalytics: Readonly<{
    accountId: string;
    currencyId: string;
    metric: "balance";
    backPath: string;
  }>;
}>;
