import React, { useMemo } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
  StackNavigationOptions,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";

import { ScreenName, NavigatorName } from "~/const";
import * as families from "~/families";
import OperationDetails from "~/screens/OperationDetails";
import PairDevices from "~/screens/PairDevices";
import EditDeviceName from "~/screens/EditDeviceName";
import ScanRecipient from "~/screens/SendFunds/ScanRecipient";
import Main from "./MainNavigator";
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import SettingsNavigator from "./SettingsNavigator";
import BuyDeviceNavigator from "./BuyDeviceNavigator";
import ReceiveFundsNavigator from "./ReceiveFundsNavigator";
import SendFundsNavigator from "./SendFundsNavigator";
import SignMessageNavigator from "./SignMessageNavigator";
import SignTransactionNavigator from "./SignTransactionNavigator";
import FreezeNavigator from "./FreezeNavigator";
import UnfreezeNavigator from "./UnfreezeNavigator";
import ClaimRewardsNavigator from "./ClaimRewardsNavigator";
import AddAccountsNavigator from "./AddAccountsNavigator";
import ExchangeLiveAppNavigator from "./ExchangeLiveAppNavigator";
import CardLiveAppNavigator from "./CardLiveAppNavigator";
import EarnLiveAppNavigator from "./EarnLiveAppNavigator";
import PlatformExchangeNavigator from "./PlatformExchangeNavigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import SwapNavigator from "./SwapNavigator";
import NotificationCenterNavigator from "./NotificationCenterNavigator";
import AnalyticsAllocation from "~/screens/Analytics/Allocation";
import AnalyticsOperations from "~/screens/Analytics/Operations";
import NftNavigator from "./NftNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import Account from "~/screens/Account";
import ReadOnlyAccount from "~/screens/Account/ReadOnly/ReadOnlyAccount";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import styles from "~/navigation/styles";
import StepHeader from "../StepHeader";
import PortfolioHistory from "~/screens/Portfolio/PortfolioHistory";
import RequestAccountNavigator from "./RequestAccountNavigator";
import VerifyAccount from "~/screens/VerifyAccount";
import { LiveApp } from "~/screens/Platform";
import AccountsNavigator from "./AccountsNavigator";
import MarketNavigator from "LLM/features/Market/Navigator";
import {
  BleDevicePairingFlow,
  bleDevicePairingFlowHeaderOptions,
} from "~/screens/BleDevicePairingFlow";

import PostBuyDeviceScreen from "LLM/features/Reborn/screens/PostBuySuccess";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import PostBuyDeviceSetupNanoWallScreen from "~/screens/PostBuyDeviceSetupNanoWallScreen";
import CurrencySettings from "~/screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import WalletConnectLiveAppNavigator from "./WalletConnectLiveAppNavigator";
import CustomImageNavigator from "./CustomImageNavigator";
import PostOnboardingNavigator from "./PostOnboardingNavigator";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import DeviceConnect, { deviceConnectHeaderOptions } from "~/screens/DeviceConnect";
import ExploreTabNavigator from "./ExploreTabNavigator";
import NoFundsFlowNavigator from "./NoFundsFlowNavigator";
import StakeFlowNavigator from "./StakeFlowNavigator";
import { RecoverPlayer } from "~/screens/Protect/Player";
import { RedirectToOnboardingRecoverFlowScreen } from "~/screens/Protect/RedirectToOnboardingRecoverFlow";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
import EditTransactionNavigator from "~/families/evm/EditTransactionFlow/EditTransactionNavigator";
import { DrawerProps } from "../RootDrawer/types";
import AnalyticsOptInPromptNavigator from "./AnalyticsOptInPromptNavigator";
import LandingPagesNavigator from "./LandingPagesNavigator";
import FirmwareUpdateScreen from "~/screens/FirmwareUpdate";
import EditCurrencyUnits from "~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits";
import CustomErrorNavigator from "./CustomErrorNavigator";
import WalletSyncNavigator from "LLM/features/WalletSync/WalletSyncNavigator";
import Web3HubNavigator from "LLM/features/Web3Hub/Navigator";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import AddAccountsV2Navigator from "LLM/features/Accounts/Navigator";
import DeviceSelectionNavigator from "LLM/features/DeviceSelection/Navigator";
import AssetSelectionNavigator from "LLM/features/AssetSelection/Navigator";
import AssetsListNavigator from "LLM/features/Assets/Navigator";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export default function BaseNavigator() {
  const { t } = useTranslation();
  const route = useRoute<
    RouteProp<{
      params: {
        drawer?: DrawerProps;
      };
    }>
  >();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isAccountsEmpty = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && isAccountsEmpty;
  const web3hub = useFeature("web3hub");
  const llmNetworkBasedAddAccountFlow = useFeature("llmNetworkBasedAddAccountFlow");
  const llmAccountListUI = useFeature("llmAccountListUI");

  return (
    <>
      <RootDrawer drawer={route.params?.drawer} />
      <Stack.Navigator
        screenOptions={{
          ...stackNavigationConfig,
          ...TransitionPresets.DefaultTransition,
        }}
      >
        <Stack.Screen name={NavigatorName.Main} component={Main} options={{ headerShown: false }} />
        <Stack.Screen
          name={NavigatorName.BuyDevice}
          component={BuyDeviceNavigator}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.NoDeviceWallScreen}
          component={PostBuyDeviceSetupNanoWallScreen}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.PostBuyDeviceSetupNanoWallScreen}
          component={PostBuyDeviceSetupNanoWallScreen}
          options={{
            headerShown: false,
            presentation: "transparentModal",
            headerMode: undefined,
            cardStyle: { opacity: 1 },
            gestureEnabled: true,
            headerTitle: "",
            headerRight: () => null,
            headerBackTitleVisible: false,
            title: "",
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.PostBuyDeviceScreen}
          component={PostBuyDeviceScreen}
          options={{
            title: t("postBuyDevice.headerTitle"),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.Settings}
          component={SettingsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.CurrencySettings}
          component={CurrencySettings}
          options={({ route }) => ({
            title: route.params.headerTitle,
            headerRight: () => null,
          })}
          {...noNanoBuyNanoWallScreenOptions}
        />

        <Stack.Screen
          name={ScreenName.EditCurrencyUnits}
          component={EditCurrencyUnits}
          options={{
            title: t("account.settings.accountUnits.title"),
          }}
        />
        <Stack.Screen
          name={NavigatorName.ReceiveFunds}
          component={ReceiveFundsNavigator}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.SendFunds}
          component={SendFundsNavigator}
          options={{ headerShown: false }}
        />
        {web3hub?.enabled ? (
          <Stack.Screen
            name={NavigatorName.Web3Hub}
            component={Web3HubNavigator}
            options={{ headerShown: false }}
          />
        ) : null}
        <Stack.Screen
          name={ScreenName.PlatformApp}
          component={LiveApp}
          options={{
            headerStyle: styles.headerNoShadow,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.Recover}
          component={RecoverPlayer}
          options={{
            headerStyle: styles.headerNoShadow,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.ExploreTab}
          component={ExploreTabNavigator}
          options={{
            headerShown: true,
            animationEnabled: false,
            headerTitle: t("discover.sections.news.title"),
            headerLeft: () => <NavigationHeaderBackButton />,
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.SignMessage}
          component={SignMessageNavigator}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              const onClose = route.params?.onClose;
              if (onClose && typeof onClose === "function") {
                onClose();
              }
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.SignTransaction}
          component={SignTransactionNavigator}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              route.params.onError(new Error("Signature interrupted by user"));
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.Swap}
          component={SwapNavigator}
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
          name={NavigatorName.RequestAccount}
          component={RequestAccountNavigator}
          options={{
            headerShown: false,
          }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              const onClose = route.params?.onClose;
              if (onClose && typeof onClose === "function") {
                onClose();
              }
            },
          })}
        />
        <Stack.Screen
          name={ScreenName.VerifyAccount}
          component={VerifyAccount}
          options={{
            headerLeft: () => null,
            title: t("transfer.receive.headerTitle"),
          }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              const onClose =
                route.params?.onClose || (route.params as unknown as typeof route)?.params?.onClose;
              if (onClose && typeof onClose === "function") {
                onClose();
              }
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.Card}
          component={CardLiveAppNavigator}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.Exchange}
          component={ExchangeLiveAppNavigator}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.PlatformExchange}
          component={PlatformExchangeNavigator}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.CustomError}
          component={CustomErrorNavigator}
          options={{ title: "" }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.OperationDetails}
          component={OperationDetails}
          options={({ route }) => {
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
                    testID="operationDetails-title"
                  />
                ),
                headerLeft: () => <NavigationHeaderBackButton />,
                headerRight: () => <NavigationHeaderCloseButton />,
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
                  testID="operationDetails-title"
                />
              ),
              headerLeft: () => <NavigationHeaderBackButton />,
              headerRight: () => null,
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
            title: "",
            headerRight: () => <ErrorHeaderInfo route={route} navigation={navigation} />,
            headerShown: true,
            headerStyle: styles.headerNoShadow,
          })}
        />
        <Stack.Screen
          name={ScreenName.EditDeviceName}
          component={EditDeviceName}
          options={{
            title: t("EditDeviceName.title"),
            headerLeft: () => null,
            ...TransitionPresets.ModalPresentationIOS,
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
          name={ScreenName.AnalyticsAllocation}
          component={AnalyticsAllocation}
          options={{
            title: t("analytics.allocation.title"),
            headerRight: () => null,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsOperations}
          component={AnalyticsOperations}
          options={{
            title: t("analytics.operations.title"),
            headerRight: () => null,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />

        <Stack.Screen
          name={NavigatorName.WalletSync}
          component={WalletSyncNavigator}
          options={{ headerShown: false }}
        />

        {MarketNavigator({ Stack })}
        <Stack.Screen
          name={ScreenName.PortfolioOperationHistory}
          component={PortfolioHistory}
          options={{
            headerTitle: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={ScreenName.Account}
          component={readOnlyModeEnabled ? ReadOnlyAccount : Account}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.ScanRecipient}
          component={ScanRecipient}
          options={{
            ...TransparentHeaderNavigationOptions,
            title: t("send.scan.title"),
            headerRight: () => (
              <NavigationHeaderCloseButtonAdvanced
                color={colors.constant.white}
                preferDismiss={false}
                rounded
              />
            ),
            headerLeft: () => null,
          }}
        />

        <Stack.Screen
          name={NavigatorName.WalletConnect}
          component={WalletConnectLiveAppNavigator}
          options={{
            headerShown: false,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />

        <Stack.Screen
          name={NavigatorName.NotificationCenter}
          component={NotificationCenterNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.NftNavigator}
          component={NftNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Accounts}
          component={AccountsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.CustomImage}
          component={CustomImageNavigator}
          options={{ headerShown: false }}
        />
        {/* This is a freaking hack… */}
        {Object.keys(families).map(name => {
          const { component, options } = families[name as keyof typeof families];
          return (
            <Stack.Screen
              key={name}
              name={name as keyof BaseNavigatorStackParamList}
              component={component as React.ComponentType}
              options={options as StackNavigationOptions}
            />
          );
        })}
        <Stack.Screen
          name={ScreenName.BleDevicePairingFlow}
          component={BleDevicePairingFlow}
          options={bleDevicePairingFlowHeaderOptions}
        />
        <Stack.Screen
          name={NavigatorName.PostOnboarding}
          options={{ headerShown: false }}
          component={PostOnboardingNavigator}
        />
        <Stack.Screen
          name={ScreenName.DeviceConnect}
          component={DeviceConnect}
          options={useMemo(() => deviceConnectHeaderOptions(t), [t])}
          listeners={({ route }) => ({
            beforeRemove: () => {
              const onClose =
                route.params?.onClose || (route.params as unknown as typeof route)?.params?.onClose;
              if (onClose && typeof onClose === "function") {
                onClose();
              }
            },
          })}
        />
        <Stack.Screen
          name={ScreenName.RedirectToOnboardingRecoverFlow}
          options={{ ...TransparentHeaderNavigationOptions, title: "" }}
          component={RedirectToOnboardingRecoverFlowScreen}
        />
        <Stack.Screen
          name={NavigatorName.Earn}
          component={EarnLiveAppNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.NoFundsFlow}
          component={NoFundsFlowNavigator}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: () => <NavigationHeaderCloseButtonAdvanced preferDismiss={false} />,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.StakeFlow}
          component={StakeFlowNavigator}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: () => <NavigationHeaderCloseButtonAdvanced preferDismiss={false} />,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.EvmEditTransaction}
          options={{ headerShown: false }}
          component={EditTransactionNavigator}
        />
        <Stack.Screen
          name={NavigatorName.AnalyticsOptInPrompt}
          options={{ headerShown: false }}
          component={AnalyticsOptInPromptNavigator}
        />
        <Stack.Screen
          name={NavigatorName.LandingPages}
          options={{ headerShown: false }}
          component={LandingPagesNavigator}
        />
        <Stack.Screen
          name={ScreenName.FirmwareUpdate}
          component={FirmwareUpdateScreen}
          options={{
            gestureEnabled: false,
            headerTitle: () => null,
            headerLeft: () => null,
            headerRight: () => <Button Icon={IconsLegacy.CloseMedium} />,
          }}
        />
        <Stack.Screen
          name={NavigatorName.AddAccounts}
          component={
            llmNetworkBasedAddAccountFlow?.enabled ? AddAccountsV2Navigator : AddAccountsNavigator
          }
          options={{ headerShown: false }}
        />

        {llmNetworkBasedAddAccountFlow?.enabled && (
          <Stack.Screen
            name={NavigatorName.DeviceSelection}
            component={DeviceSelectionNavigator}
            options={{ headerShown: false }}
          />
        )}

        {llmNetworkBasedAddAccountFlow?.enabled && (
          <Stack.Screen
            name={NavigatorName.AssetSelection}
            component={AssetSelectionNavigator}
            options={{ headerShown: false }}
          />
        )}
        {llmAccountListUI?.enabled && (
          <Stack.Screen
            name={NavigatorName.Assets}
            component={AssetsListNavigator}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </>
  );
}
