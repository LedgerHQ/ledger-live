import { NavigatorName } from "~/const";
import { BaseNavigatorStackParamList } from "./BaseNavigator";
import { BaseOnboardingNavigatorParamList } from "./BaseOnboardingNavigator";
import { NavigatorScreenParams } from "@react-navigation/core";
import type { DeviceOnboardingNavigatorParamList } from "LLM/features/DeviceOnboarding/navigation/types";

export type RootStackParamList = {
  [NavigatorName.BaseOnboarding]: NavigatorScreenParams<BaseOnboardingNavigatorParamList>;
  [NavigatorName.Base]: NavigatorScreenParams<BaseNavigatorStackParamList>;
  [NavigatorName.DeviceOnboarding]: NavigatorScreenParams<DeviceOnboardingNavigatorParamList>;
};
