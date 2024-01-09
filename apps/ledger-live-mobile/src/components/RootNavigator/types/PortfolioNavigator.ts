import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { AccountsNavigatorParamList } from "./AccountsNavigator";

export type PortfolioNavigatorStackParamList = {
  [NavigatorName.WalletTab]: undefined;
  [NavigatorName.PortfolioAccounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
};
