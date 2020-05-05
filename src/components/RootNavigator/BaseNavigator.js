// @flow
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { ScreenName, NavigatorName } from "../../const";
import * as families from "../../families";
import OperationDetails, {
  BackButton,
  CloseButton,
} from "../../screens/OperationDetails";
import PairDevices from "../../screens/PairDevices";
import EditDeviceName from "../../screens/EditDeviceName";
import Distribution from "../../screens/Distribution";
import Asset, { HeaderTitle } from "../../screens/Asset";
import ScanRecipient from "../../screens/SendFunds/ScanRecipient";
import FallbackCameraSend from "../../screens/SendFunds/FallbackCamera/FallbackCameraSend";
import Main from "./MainNavigator";
import ReceiveFundsNavigator from "./ReceiveFundsNavigator";
import SendFundsNavigator from "./SendFundsNavigator";
import FreezeNavigator from "./FreezeNavigator";
import UnfreezeNavigator from "./UnfreezeNavigator";
import ClaimRewardsNavigator from "./ClaimRewardsNavigator";
import AddAccountsNavigator from "./AddAccountsNavigator";
import FirmwareUpdateNavigator from "./FirmwareUpdateNavigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import MigrateAccountsFlowNavigator from "./MigrateAccountsFlowNavigator";
import { closableStackNavigatorConfig } from "../../navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import colors from "../../colors";
import HeaderRightClose from "../HeaderRightClose";

export default function BaseNavigator() {
  const { t } = useTranslation();
  return (
    <Stack.Navigator mode="modal" screenOptions={closableStackNavigatorConfig}>
      <Stack.Screen
        name={NavigatorName.Main}
        component={Main}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.ReceiveFunds}
        component={ReceiveFundsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.SendFunds}
        component={SendFundsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Freeze}
        component={FreezeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Unfreeze}
        component={UnfreezeNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.ClaimRewards}
        component={ClaimRewardsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.AddAccounts}
        component={AddAccountsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.FirmwareUpdate}
        component={FirmwareUpdateNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.OperationDetails}
        component={OperationDetails}
        options={({ route, navigation }) => {
          if (route.params?.isSubOperation) {
            return {
              title: t("operationDetails.title"),
              headerLeft: () => <BackButton navigation={navigation} />,
              headerRight: () => <CloseButton navigation={navigation} />,
            };
          }

          return {
            title: t("operationDetails.title"),
            headerLeft: () => <BackButton navigation={navigation} />,
            headerRight: null,
          };
        }}
      />
      <Stack.Screen
        name={NavigatorName.AccountSettings}
        component={AccountSettingsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.ImportAccounts}
        component={ImportAccountsNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.PairDevices}
        component={PairDevices}
        options={{ title: t("SelectDevice.title"), headerLeft: null }}
      />
      <Stack.Screen
        name={ScreenName.EditDeviceName}
        component={EditDeviceName}
        options={{
          title: t("EditDeviceName.title"),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={NavigatorName.PasswordAddFlow}
        component={PasswordAddFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.PasswordModifyFlow}
        component={PasswordModifyFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.MigrateAccountsFlow}
        component={MigrateAccountsFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.Distribution}
        component={Distribution}
        options={{
          ...closableStackNavigatorConfig,
          title: t("distribution.header"),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.Asset}
        component={Asset}
        options={{
          headerTitle: () => <HeaderTitle />,
          headerRight: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.ScanRecipient}
        component={ScanRecipient}
        options={{
          ...TransparentHeaderNavigationOptions,
          title: t("send.scan.title"),
          headerRight: () => (
            <HeaderRightClose color={colors.white} preferDismiss={false} />
          ),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.FallbackCameraSend}
        component={FallbackCameraSend}
        options={{
          title: t("send.scan.fallback.header"),
          headerLeft: null,
        }}
      />

      {Object.keys(families).map(name => {
        const { component, options } = families[name];
        return (
          <Stack.Screen
            key={name}
            name={name}
            component={component}
            options={options}
          />
        );
      })}
    </Stack.Navigator>
  );
}

const Stack = createStackNavigator();
