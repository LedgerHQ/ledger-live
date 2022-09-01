import { MaterialTopTabScreenProps } from "@react-navigation/material-top-tabs";
import { ScreenName } from "../../../const";

export type AnalyticsNavigatorParamList = {
  [ScreenName.AnalyticsAllocation]: undefined;
  [ScreenName.AnalyticsOperations]: undefined;
};

export type AnalyticsNavigatorScreenProps<
  RouteName extends keyof AnalyticsNavigatorParamList,
> = MaterialTopTabScreenProps<AnalyticsNavigatorParamList, RouteName>;
