// @flow
import React, { useMemo } from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "@react-navigation/native";
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
import WalletConnectScan from "../../screens/WalletConnect/Scan";
import WalletConnectConnect from "../../screens/WalletConnect/Connect";
import WalletConnectDeeplinkingSelectAccount from "../../screens/WalletConnect/DeeplinkingSelectAccount";
import FallbackCameraSend from "../FallbackCamera/FallbackCameraSend";
import Main from "./MainNavigator";
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import ReceiveFundsNavigator from "./ReceiveFundsNavigator";
import SendFundsNavigator from "./SendFundsNavigator";
import SignMessageNavigator from "./SignMessageNavigator";
import FreezeNavigator from "./FreezeNavigator";
import UnfreezeNavigator from "./UnfreezeNavigator";
import ClaimRewardsNavigator from "./ClaimRewardsNavigator";
import AddAccountsNavigator from "./AddAccountsNavigator";
import ExchangeBuyFlowNavigator from "./ExchangeBuyFlowNavigator";
import ExchangeSellFlowNavigator from "./ExchangeSellFlowNavigator";
import ExchangeNavigator from "./ExchangeNavigator";
import FirmwareUpdateNavigator from "./FirmwareUpdateNavigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import MigrateAccountsFlowNavigator from "./MigrateAccountsFlowNavigator";
import SwapNavigator from "./SwapNavigator";
import LendingNavigator from "./LendingNavigator";
import LendingInfoNavigator from "./LendingInfoNavigator";
import LendingEnableFlowNavigator from "./LendingEnableFlowNavigator";
import LendingSupplyFlowNavigator from "./LendingSupplyFlowNavigator";
import LendingWithdrawFlowNavigator from "./LendingWithdrawFlowNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Account from "../../screens/Account";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import styles from "../../navigation/styles";
import HeaderRightClose from "../HeaderRightClose";
import StepHeader from "../StepHeader";
import AccountHeaderTitle from "../../screens/Account/AccountHeaderTitle";
import AccountHeaderRight from "../../screens/Account/AccountHeaderRight";

export default function BaseNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  return (
    <Stack.Navigator mode="modal" screenOptions={stackNavigationConfig}>
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
        name={NavigatorName.SignMessage}
        component={SignMessageNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Swap}
        component={SwapNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Lending}
        component={LendingNavigator}
        options={{
          headerStyle: styles.headerNoShadow,
          headerLeft: null,
          title: t("transfer.lending.title"),
        }}
      />
      <Stack.Screen
        name={NavigatorName.LendingInfo}
        component={LendingInfoNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.LendingEnableFlow}
        component={LendingEnableFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.LendingSupplyFlow}
        component={LendingSupplyFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.LendingWithdrawFlow}
        component={LendingWithdrawFlowNavigator}
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
        name={NavigatorName.Exchange}
        component={ExchangeNavigator}
        options={{ headerStyle: styles.headerNoShadow, headerLeft: null }}
      />
      <Stack.Screen
        name={NavigatorName.ExchangeBuyFlow}
        component={ExchangeBuyFlowNavigator}
        initialParams={{ mode: "buy" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.ExchangeSellFlow}
        component={ExchangeSellFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={ScreenName.OperationDetails}
        component={OperationDetails}
        options={({ route, navigation }) => {
          if (route.params?.isSubOperation) {
            return {
              headerTitle: () => (
                <StepHeader
                  subtitle={t("operationDetails.title")}
                  title={
                    route.params?.operation?.type
                      ? t(`operations.types.${route.params.operation.type}`)
                      : ""
                  }
                />
              ),
              headerLeft: () => <BackButton navigation={navigation} />,
              headerRight: () => <CloseButton navigation={navigation} />,
            };
          }

          return {
            headerTitle: () => (
              <StepHeader
                subtitle={t("operationDetails.title")}
                title={
                  route.params?.operation?.type
                    ? t(`operations.types.${route.params.operation.type}`)
                    : ""
                }
              />
            ),
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
        options={({ navigation, route }) => ({
          title: null,
          headerRight: () => (
            <ErrorHeaderInfo route={route} navigation={navigation} />
          ),
          headerShown: true,
          headerStyle: styles.headerNoShadow,
        })}
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
          ...stackNavigationConfig,
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
        name={ScreenName.Account}
        component={Account}
        options={({ route, navigation }) => ({
          headerLeft: () => (
            <BackButton navigation={navigation} route={route} />
          ),
          headerTitle: () => <AccountHeaderTitle />,
          headerRight: () => <AccountHeaderRight />,
        })}
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
        name={ScreenName.WalletConnectScan}
        component={WalletConnectScan}
        options={{
          ...TransparentHeaderNavigationOptions,
          title: "Wallet Connect",
          headerRight: () => (
            <HeaderRightClose color={colors.white} preferDismiss={false} />
          ),
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletConnectDeeplinkingSelectAccount}
        component={WalletConnectDeeplinkingSelectAccount}
        options={{
          title: t("walletconnect.deeplinkingTitle"),
          headerRight: () => <HeaderRightClose preferDismiss={false} />,
          headerLeft: null,
        }}
      />
      <Stack.Screen
        name={ScreenName.WalletConnectConnect}
        component={WalletConnectConnect}
        options={{
          title: "Wallet Connect",
          headerLeft: null,
          gestureEnabled: false,
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
