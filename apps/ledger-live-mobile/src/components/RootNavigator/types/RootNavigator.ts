import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName } from "~/const";
import { BaseNavigatorStackParamList } from "./BaseNavigator";
import { BaseOnboardingNavigatorParamList } from "./BaseOnboardingNavigator";
import { ImportAccountsNavigatorParamList } from "./ImportAccountsNavigator";

export type RootStackParamList = {
  [NavigatorName.ImportAccounts]:
    | NavigatorScreenParams<ImportAccountsNavigatorParamList>
    | undefined;
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};
