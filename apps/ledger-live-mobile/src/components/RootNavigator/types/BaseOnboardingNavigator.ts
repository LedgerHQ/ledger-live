import { NavigatorScreenParams } from "@react-navigation/native";
import { Device } from "@ledgerhq/types-devices";
import { NavigatorName, ScreenName } from "../../../const";
import { OnboardingNavigatorParamList } from "./OnboardingNavigator";
import { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import { ImportAccountsNavigatorParamList } from "./ImportAccountsNavigator";
import { PasswordAddFlowParamList } from "./PasswordAddFlowNavigator";
import { PasswordModifyFlowParamList } from "./PasswordModifyFlowNavigator";

export type BaseOnboardingNavigatorParamList = {
  [NavigatorName.Onboarding]: NavigatorScreenParams<OnboardingNavigatorParamList>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BuyDevice]: NavigatorScreenParams<BuyDeviceNavigatorParamList>;
  [ScreenName.PairDevices]?: {
    onDone?: (_: Device) => void;
    hasError?: boolean;
  };
  [ScreenName.EditDeviceName]: {
    deviceId: string;
    deviceName: string;
  };
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<PasswordModifyFlowParamList>;
};
