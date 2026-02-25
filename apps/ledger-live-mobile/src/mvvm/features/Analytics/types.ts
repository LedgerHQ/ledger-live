import { ScreenName } from "~/const";

export type AnalyticsNavigatorParamsList = {
  [ScreenName.Analytics]: {
    sourceScreenName?: string;
  };
  [ScreenName.DetailedAllocation]: {
    sourceScreenName?: string;
  };
};
