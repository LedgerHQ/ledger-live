import { NavigatorScreenParams } from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { NavigatorName } from "../../../const";
import {
  BaseOnboardingNavigatorParamList,
  ImportAccountsNavigatorParamList,
} from "../types";
import { BaseNavigatorStackParamList } from "./BaseNavigator";

export type RootStackScreenProps<
  T extends keyof RootStackParamList = keyof RootStackParamList,
> = StackScreenProps<RootStackParamList, T>;

export type RootStackParamList = {
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};
