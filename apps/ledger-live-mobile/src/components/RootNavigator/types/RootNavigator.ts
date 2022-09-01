import { NavigatorScreenParams } from "@react-navigation/native";
import { NavigatorName } from "../../../const";
import {
  BaseOnboardingNavigatorParamList,
  ImportAccountsNavigatorParamList,
} from "../types";
import { BaseNavigatorStackParamList } from "./BaseNavigator";

export type RootStackParamList = {
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};
