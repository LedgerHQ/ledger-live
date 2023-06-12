import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { DiscoverNavigatorStackParamList } from "./DiscoverNavigator";
import { ManagerNavigatorStackParamList } from "./ManagerNavigator";
import { MarketNavigatorStackParamList } from "./MarketNavigator";
import { PortfolioNavigatorStackParamList } from "./PortfolioNavigator";

export type MainNavigatorParamList = {
  [NavigatorName.Portfolio]: NavigatorScreenParams<PortfolioNavigatorStackParamList> | undefined;
  [NavigatorName.Market]: NavigatorScreenParams<MarketNavigatorStackParamList> | undefined;
  [ScreenName.Transfer]: undefined;
  [NavigatorName.Discover]: NavigatorScreenParams<DiscoverNavigatorStackParamList> | undefined;
  [NavigatorName.Manager]: NavigatorScreenParams<ManagerNavigatorStackParamList> | undefined;
};
