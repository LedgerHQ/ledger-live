// FIXME: to update when implementing edit transaction on evm

import React, { useMemo, lazy } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
  StackNavigationOptions,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSelector } from "react-redux";

import { ScreenName, NavigatorName } from "../../const";
import { withSuspense } from "~/helpers/withSuspense";
import * as families from "../../families";
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
import EarnLiveAppNavigator from "./EarnLiveAppNavigator";
import PlatformExchangeNavigator from "./PlatformExchangeNavigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import SwapNavigator from "./SwapNavigator";
import NotificationCenterNavigator from "./NotificationCenterNavigator";
import NftNavigator from "./NftNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import styles from "../../navigation/styles";
import StepHeader from "../StepHeader";
import RequestAccountNavigator from "./RequestAccountNavigator";
import AccountsNavigator from "./AccountsNavigator";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import WalletConnectLiveAppNavigator from "./WalletConnectLiveAppNavigator";
import CustomImageNavigator from "./CustomImageNavigator";
import ClaimNftNavigator from "./ClaimNftNavigator";
import PostOnboardingNavigator from "./PostOnboardingNavigator";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { hasNoAccountsSelector } from "../../reducers/accounts";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import ExploreTabNavigator from "./ExploreTabNavigator";
import NoFundsFlowNavigator from "./NoFundsFlowNavigator";
import StakeFlowNavigator from "./StakeFlowNavigator";
import { NavigationHeaderBackButton } from "../NavigationHeaderBackButton";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
// to keep until edit transaction on evm is implemented
// import EditTransactionNavigator from "../../families/ethereum/EditTransactionFlow/EditTransactionNavigator";
import { DrawerProps } from "../RootDrawer/types";

import { bleDevicePairingFlowHeaderOptions } from "../../screens/BleDevicePairingFlow";
import { deviceConnectHeaderOptions } from "../../screens/DeviceConnect";
import { BleDevicePairingFlow } from "../../screens/BleDevicePairingFlow";
import { LiveApp } from "../../screens/Platform";
import { RecoverPlayer } from "../../screens/Protect/Player";
import { RedirectToOnboardingRecoverFlowScreen } from "../../screens/Protect/RedirectToOnboardingRecoverFlow";


const OperationDetails = lazy(() => import("../../screens/OperationDetails"));
const PairDevices = lazy(() => import("../../screens/PairDevices"));
const EditDeviceName = lazy(() => import("../../screens/EditDeviceName"));
const ScanRecipient = lazy(() => import("../../screens/SendFunds/ScanRecipient"));
const AnalyticsAllocation = lazy(() => import("../../screens/Analytics/Allocation"));
const AnalyticsOperations = lazy(() => import("../../screens/Analytics/Operations"));
const Account = lazy(() => import("../../screens/Account"));
const ReadOnlyAccount = lazy(() => import("../../screens/Account/ReadOnly/ReadOnlyAccount"));
const PortfolioHistory = lazy(() => import("../../screens/Portfolio/PortfolioHistory"));
const VerifyAccount = lazy(() => import("../../screens/VerifyAccount"));
const MarketCurrencySelect = lazy(() => import("../../screens/Market/MarketCurrencySelect"));
const PostBuyDeviceScreen = lazy(() => import("../../screens/PostBuyDeviceScreen"));
const LearnWebView = lazy(() => import("../../screens/Learn/index"));
const PostBuyDeviceSetupNanoWallScreen = lazy(() => import("../../screens/PostBuyDeviceSetupNanoWallScreen"));
const MarketDetail = lazy(() => import("../../screens/Market/MarketDetail"));
const CurrencySettings = lazy(() => import("../../screens/Settings/CryptoAssets/Currencies/CurrencySettings"));
const DeviceConnect = lazy(() => import("../../screens/DeviceConnect"));

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
  const walletConnectLiveApp = useFeature("walletConnectLiveApp");
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isAccountsEmpty = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && isAccountsEmpty;

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
          component={withSuspense(PostBuyDeviceSetupNanoWallScreen)}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.PostBuyDeviceSetupNanoWallScreen}
          component={withSuspense(PostBuyDeviceSetupNanoWallScreen)}
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
          component={withSuspense(PostBuyDeviceScreen)}
          options={{
            title: t("postBuyDevice.headerTitle"),
            headerLeft: () => null,
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.Settings}
          component={SettingsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.CurrencySettings}
          component={withSuspense(CurrencySettings)}
          options={({ route }) => ({
            title: route.params.headerTitle,
            headerRight: () => null,
          })}
          {...noNanoBuyNanoWallScreenOptions}
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
          component={withSuspense(RecoverPlayer)}
          options={{
            headerStyle: styles.headerNoShadow,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.LearnWebView}
          component={withSuspense(LearnWebView)}
          options={{ headerShown: false }}
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
          name={NavigatorName.AddAccounts}
          component={AddAccountsNavigator}
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
          component={withSuspense(VerifyAccount)}
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
          name={ScreenName.OperationDetails}
          component={withSuspense(OperationDetails)}
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
          component={withSuspense(PairDevices)}
          options={({ navigation, route }) => ({
            title: "",
            headerRight: () => <ErrorHeaderInfo route={route} navigation={navigation} />,
            headerShown: true,
            headerStyle: styles.headerNoShadow,
          })}
        />
        <Stack.Screen
          name={ScreenName.EditDeviceName}
          component={withSuspense(EditDeviceName)}
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
          component={withSuspense(AnalyticsAllocation)}
          options={{
            title: t("analytics.allocation.title"),
            headerRight: () => null,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsOperations}
          component={withSuspense(AnalyticsOperations)}
          options={{
            title: t("analytics.operations.title"),
            headerRight: () => null,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.MarketCurrencySelect}
          component={withSuspense(MarketCurrencySelect)}
          options={{
            title: t("market.filters.currency"),
            headerLeft: () => null,
            // FIXME: ONLY ON BOTTOM TABS AND DRAWER NAVIGATION
            // unmountOnBlur: true,
          }}
        />
        <Stack.Screen
          name={ScreenName.PortfolioOperationHistory}
          component={withSuspense(PortfolioHistory)}
          options={{
            headerTitle: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={ScreenName.Account}
          component={withSuspense(readOnlyModeEnabled ? ReadOnlyAccount : Account)}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.ScanRecipient}
          component={withSuspense(ScanRecipient)}
          options={{
            ...TransparentHeaderNavigationOptions,
            title: t("send.scan.title"),
            headerRight: () => (
              <NavigationHeaderCloseButtonAdvanced
                color={colors.constant.white}
                preferDismiss={false}
              />
            ),
            headerLeft: () => null,
          }}
        />
        {walletConnectLiveApp?.enabled && (
          <Stack.Screen
            name={NavigatorName.WalletConnect}
            component={WalletConnectLiveAppNavigator}
            options={{
              headerShown: false,
            }}
            {...noNanoBuyNanoWallScreenOptions}
          />
        )}

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
          name={ScreenName.MarketDetail}
          component={withSuspense(MarketDetail)}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name={NavigatorName.CustomImage}
          component={CustomImageNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.ClaimNft}
          component={ClaimNftNavigator}
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
        {/* to keep until edit transaction on evm is implemented */}
        {/* <Stack.Screen
          name={NavigatorName.EditTransaction}
          options={{ headerShown: false }}
          component={EditTransactionNavigator}
        /> */}
      </Stack.Navigator>
    </>
  );
}
