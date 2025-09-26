import { NavigatorScreenParams } from "@react-navigation/native";
import { Device } from "@ledgerhq/types-devices";
import { DeviceInfo } from "@ledgerhq/types-live";
import { NavigatorName, ScreenName } from "~/const";
import { OnboardingNavigatorParamList } from "./OnboardingNavigator";
import { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import { PasswordAddFlowParamList } from "./PasswordAddFlowNavigator";
import { PasswordModifyFlowParamList } from "./PasswordModifyFlowNavigator";
import { SyncOnboardingStackParamList } from "./SyncOnboardingNavigator";
import { ModularDrawerNavigatorStackParamList } from "./ModularDrawerNavigator";
import { WalletSyncNavigatorStackParamList } from "./WalletSyncNavigator";
import { ReceiveFundsStackParamList } from "./ReceiveFundsNavigator";
import { DeviceSelectionNavigatorParamsList } from "~/newArch/features/DeviceSelection/types";
import { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import { CommonAddAccountNavigatorParamsList } from "./BaseNavigator";
import { AccountSettingsNavigatorParamList } from "./AccountSettingsNavigator";

export type BaseOnboardingNavigatorParamList = {
  [NavigatorName.Onboarding]: NavigatorScreenParams<OnboardingNavigatorParamList>;
  [NavigatorName.BuyDevice]: NavigatorScreenParams<BuyDeviceNavigatorParamList> | undefined;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<ReceiveFundsStackParamList> | undefined;
  [ScreenName.EditDeviceName]: {
    device: Device;
    deviceName: string;
    deviceInfo: DeviceInfo;
    onNameChange(name: string): void;
  };
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<PasswordModifyFlowParamList>;
  [NavigatorName.SyncOnboarding]: NavigatorScreenParams<SyncOnboardingStackParamList>;
  [NavigatorName.WalletSync]: NavigatorScreenParams<WalletSyncNavigatorStackParamList>;
  [NavigatorName.ModularDrawer]: NavigatorScreenParams<ModularDrawerNavigatorStackParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<AddAccountsNavigatorParamList>> &
    CommonAddAccountNavigatorParamsList;
};
