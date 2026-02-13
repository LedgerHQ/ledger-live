import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { Web3HubTabStackParamList } from "LLM/features/Web3Hub/types";
import { DiscoverNavigatorStackParamList } from "./DiscoverNavigator";
import { MyLedgerNavigatorStackParamList } from "./MyLedgerNavigator";
import { PortfolioNavigatorStackParamList } from "./PortfolioNavigator";
import { EarnLiveAppNavigatorParamList } from "./EarnLiveAppNavigator";
import { CardLandingNavigatorParamList } from "./CardLandingNavigator";

export type MainNavigatorParamList = {
  [NavigatorName.Portfolio]: NavigatorScreenParams<PortfolioNavigatorStackParamList> | undefined;
  [NavigatorName.Earn]: NavigatorScreenParams<EarnLiveAppNavigatorParamList> | undefined;
  [ScreenName.Transfer]: undefined;
  [NavigatorName.Discover]: NavigatorScreenParams<DiscoverNavigatorStackParamList> | undefined;
  [NavigatorName.Web3HubTab]: NavigatorScreenParams<Web3HubTabStackParamList> | undefined;
  [NavigatorName.MyLedger]: NavigatorScreenParams<MyLedgerNavigatorStackParamList> | undefined;
  [NavigatorName.CardTab]: NavigatorScreenParams<CardLandingNavigatorParamList> | undefined;
};
