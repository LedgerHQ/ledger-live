import { NavigatorName } from "~/const";
import { BaseNavigatorStackParamList } from "./BaseNavigator";
import { BaseOnboardingNavigatorParamList } from "./BaseOnboardingNavigator";
import { NavigatorScreenParams } from "@react-navigation/core";

export type RootStackParamList = {
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
};
