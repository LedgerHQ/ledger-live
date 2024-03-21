import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { DiscoverNavigatorStackParamList } from "./DiscoverNavigator";
import { ManagerNavigatorStackParamList } from "./ManagerNavigator";
import { PortfolioNavigatorStackParamList } from "./PortfolioNavigator";
import { EarnLiveAppNavigatorParamList } from "./EarnLiveAppNavigator";

export type MainNavigatorParamList = {
  [NavigatorName.Portfolio]: NavigatorScreenParams<PortfolioNavigatorStackParamList> | undefined;
  [NavigatorName.Earn]: NavigatorScreenParams<EarnLiveAppNavigatorParamList> | undefined;
  [ScreenName.Transfer]: undefined;
  [NavigatorName.Discover]: NavigatorScreenParams<DiscoverNavigatorStackParamList> | undefined;
  [NavigatorName.Manager]: NavigatorScreenParams<ManagerNavigatorStackParamList> | undefined;
};
