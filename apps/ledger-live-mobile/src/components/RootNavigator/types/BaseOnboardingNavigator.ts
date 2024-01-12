import { NavigatorScreenParams } from "@react-navigation/native";
import { Device, DeviceModelId } from "@ledgerhq/types-devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { OnboardingNavigatorParamList } from "./OnboardingNavigator";
import { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import { ImportAccountsNavigatorParamList } from "./ImportAccountsNavigator";
import { PasswordAddFlowParamList } from "./PasswordAddFlowNavigator";
import { PasswordModifyFlowParamList } from "./PasswordModifyFlowNavigator";
import { SyncOnboardingStackParamList } from "./SyncOnboardingNavigator";

export type BaseOnboardingNavigatorParamList = {
  [NavigatorName.Onboarding]: NavigatorScreenParams<OnboardingNavigatorParamList>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.BuyDevice]: NavigatorScreenParams<BuyDeviceNavigatorParamList> | undefined;
  [ScreenName.PairDevices]: {
    onDone?: (_: Device) => void;
    hasError?: boolean;
    deviceModelIds?: DeviceModelId[];
  };
  [ScreenName.EditDeviceName]: {
    device: Device;
    deviceName: string;
    deviceInfo: DeviceInfo;
  };
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<PasswordModifyFlowParamList>;
  [NavigatorName.SyncOnboarding]: NavigatorScreenParams<SyncOnboardingStackParamList>;
};
