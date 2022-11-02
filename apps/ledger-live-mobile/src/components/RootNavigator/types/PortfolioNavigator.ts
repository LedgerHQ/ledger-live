import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../../const";
import { AccountsNavigatorParamList } from "./AccountsNavigator";

export type PortfolioNavigatorStackParamList = {
  [ScreenName.Portfolio]: undefined;
  [NavigatorName.PortfolioAccounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
};
