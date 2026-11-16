import { ScreenName } from "~/const";

export type AccountAnalyticsEntryParams = Readonly<{
  accountId: string;
  currencyId: string;
  metric: "balance";
}>;

export type AnalyticsNavigatorParamsList = {
  [ScreenName.Analytics]: {
    sourceScreenName?: string;
    accountAnalytics?: AccountAnalyticsEntryParams;
  };
  [ScreenName.DetailedAllocation]: {
    sourceScreenName?: string;
  };
};
