import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "~/const";
import { Web3HubStackParamList } from "LLM/features/Web3Hub/Navigator";
import { DiscoverNavigatorStackParamList } from "./DiscoverNavigator";
import { MyLedgerNavigatorStackParamList } from "./MyLedgerNavigator";
import { PortfolioNavigatorStackParamList } from "./PortfolioNavigator";
import { EarnLiveAppNavigatorParamList } from "./EarnLiveAppNavigator";

export type MainNavigatorParamList = {
  [NavigatorName.Portfolio]: NavigatorScreenParams<PortfolioNavigatorStackParamList> | undefined;
  [NavigatorName.Earn]: NavigatorScreenParams<EarnLiveAppNavigatorParamList> | undefined;
  [ScreenName.Transfer]: undefined;
  [NavigatorName.Discover]: NavigatorScreenParams<DiscoverNavigatorStackParamList> | undefined;
  [NavigatorName.Web3Hub]: NavigatorScreenParams<Web3HubStackParamList> | undefined;
  [NavigatorName.MyLedger]: NavigatorScreenParams<MyLedgerNavigatorStackParamList> | undefined;
};
