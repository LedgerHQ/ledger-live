import React, { useMemo } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
  StackNavigationOptions,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSelector } from "react-redux";
import { ScreenName, NavigatorName } from "../../const";
import * as families from "../../families";
import OperationDetails, {
  BackButton,
  CloseButton,
} from "../../screens/OperationDetails";
import PairDevices from "../../screens/PairDevices";
import EditDeviceName from "../../screens/EditDeviceName";
import ScanRecipient from "../../screens/SendFunds/ScanRecipient";
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
import ExchangeNavigator from "./ExchangeNavigator";
import ExchangeLiveAppNavigator from "./ExchangeLiveAppNavigator";
import PlatformExchangeNavigator from "./PlatformExchangeNavigator";
import FirmwareUpdateNavigator from "./FirmwareUpdateNavigator";
import AccountSettingsNavigator from "./AccountSettingsNavigator";
import ImportAccountsNavigator from "./ImportAccountsNavigator";
import PasswordAddFlowNavigator from "./PasswordAddFlowNavigator";
import PasswordModifyFlowNavigator from "./PasswordModifyFlowNavigator";
import SwapNavigator from "./SwapNavigator";
import NotificationCenterNavigator from "./NotificationCenterNavigator";
import AnalyticsAllocation from "../../screens/Analytics/Allocation";
import AnalyticsOperations from "../../screens/Analytics/Operations";
import NftNavigator from "./NftNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Account from "../../screens/Account";
import ReadOnlyAccount from "../../screens/Account/ReadOnly/ReadOnlyAccount";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import styles from "../../navigation/styles";
import HeaderRightClose from "../HeaderRightClose";
import StepHeader from "../StepHeader";
import PortfolioHistory from "../../screens/Portfolio/PortfolioHistory";
import RequestAccountNavigator from "./RequestAccountNavigator";
import VerifyAccount from "../../screens/VerifyAccount";
import { LiveApp } from "../../screens/Platform";
import AccountsNavigator from "./AccountsNavigator";
import MarketCurrencySelect from "../../screens/Market/MarketCurrencySelect";
import { BleDevicePairingFlow } from "../../screens/BleDevicePairingFlow/index";
import ProviderList from "../../screens/Exchange/ProviderList";
import ProviderView from "../../screens/Exchange/ProviderView";
import ScreenHeader from "../../screens/Exchange/ScreenHeader";
import ExchangeStackNavigator from "./ExchangeStackNavigator";

import PostBuyDeviceScreen from "../../screens/PostBuyDeviceScreen";
import LearnWebView from "../../screens/Learn/index";
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import PostBuyDeviceSetupNanoWallScreen from "../../screens/PostBuyDeviceSetupNanoWallScreen";
import MarketDetail from "../../screens/Market/MarketDetail";
import CurrencySettings from "../../screens/Settings/CryptoAssets/Currencies/CurrencySettings";
import WalletConnectNavigator from "./WalletConnectNavigator";
import WalletConnectLiveAppNavigator from "./WalletConnectLiveAppNavigator";
import CustomImageNavigator from "./CustomImageNavigator";
import ClaimNftNavigator from "./ClaimNftNavigator";
import PostOnboardingNavigator from "./PostOnboardingNavigator";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { hasNoAccountsSelector } from "../../reducers/accounts";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import DeviceConnect from "../../screens/DeviceConnect";
import ExploreTabNavigator from "./ExploreTabNavigator";
import NoFundsFlowNavigator from "./NoFundsFlowNavigator";
import StakeFlowNavigator from "./StakeFlowNavigator";
import { RecoverPlayer } from "../../screens/Protect/Player";
import { RedirectToOnboardingRecoverFlowScreen } from "../../screens/Protect/RedirectToOnboardingRecoverFlow";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export default function BaseNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");
  const walletConnectLiveApp = useFeature("walletConnectLiveApp");
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isAccountsEmpty = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled =
    useSelector(readOnlyModeEnabledSelector) && isAccountsEmpty;

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        ...TransitionPresets.DefaultTransition,
      }}
    >
      <Stack.Screen
        name={NavigatorName.Main}
        component={Main}
        options={{ headerShown: false }}
      />
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
        component={CurrencySettings}
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
        component={RecoverPlayer}
        options={{
          headerStyle: styles.headerNoShadow,
        }}
        {...noNanoBuyNanoWallScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.LearnWebView}
        component={LearnWebView}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.ExploreTab}
        component={ExploreTabNavigator}
        options={({ navigation }) => ({
          headerShown: true,
          animationEnabled: false,
          headerTitle: t("discover.sections.news.title"),
          headerLeft: () => <BackButton navigation={navigation} />,
          headerRight: () => null,
        })}
      />
      <Stack.Screen
        name={NavigatorName.SignMessage}
        component={SignMessageNavigator}
        options={{ headerShown: false }}
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
            /**
              react-navigation workaround try to fetch params from current route params
              or fallback to child navigator route params
              since this listener is on top of another navigator
            */
            const onError =
              route.params?.onError ||
              (route.params as unknown as typeof route)?.params?.onError;
            // @TODO replace with correct error
            if (onError && typeof onError === "function")
              onError(
                route.params.error ||
                  new Error("Request account interrupted by user"),
              );
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
              route.params?.onClose ||
              (route.params as unknown as typeof route)?.params?.onClose;
            if (onClose && typeof onClose === "function") {
              onClose();
            }
          },
        })}
      />
      <Stack.Screen
        name={NavigatorName.FirmwareUpdate}
        component={FirmwareUpdateNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Exchange}
        component={
          ptxSmartRoutingMobile?.enabled
            ? ExchangeLiveAppNavigator
            : ExchangeNavigator
        }
        options={
          ptxSmartRoutingMobile?.enabled
            ? { headerShown: false }
            : { headerStyle: styles.headerNoShadow, headerLeft: () => null }
        }
        {...noNanoBuyNanoWallScreenOptions}
      />
      <Stack.Screen
        name={ScreenName.ProviderList}
        component={ProviderList}
        options={({ route }) => ({
          headerStyle: styles.headerNoShadow,
          title:
            route.params.type === "onRamp"
              ? t("exchange.buy.screenTitle")
              : t("exchange.sell.screenTitle"),
        })}
      />
      <Stack.Screen
        name={ScreenName.ProviderView}
        component={ProviderView}
        options={({ route }) => ({
          headerTitle: () => (
            <ScreenHeader icon={route.params.icon} name={route.params.name} />
          ),
          headerStyle: styles.headerNoShadow,
        })}
      />
      <Stack.Screen
        name={NavigatorName.ExchangeStack}
        component={ExchangeStackNavigator}
        initialParams={{ mode: "buy" }}
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
        name={ScreenName.MarketCurrencySelect}
        component={MarketCurrencySelect}
        options={{
          title: t("market.filters.currency"),
          headerLeft: () => null,
          // FIXME: ONLY ON BOTTOM TABS AND DRAWER NAVIGATION
          // unmountOnBlur: true,
        }}
      />
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
            <HeaderRightClose
              color={colors.constant.white}
              preferDismiss={false}
            />
          ),
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={NavigatorName.WalletConnect}
        component={
          walletConnectLiveApp?.enabled
            ? WalletConnectLiveAppNavigator
            : WalletConnectNavigator
        }
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
        name={ScreenName.MarketDetail}
        component={MarketDetail}
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
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={NavigatorName.PostOnboarding}
        options={{ headerShown: false }}
        component={PostOnboardingNavigator}
      />
      <Stack.Screen
        name={ScreenName.DeviceConnect}
        component={DeviceConnect}
        options={{
          title: t("deviceConnect.title"),
          headerRight: () => null,
        }}
        listeners={({ route }) => ({
          beforeRemove: () => {
            const onClose =
              route.params?.onClose ||
              (route.params as unknown as typeof route)?.params?.onClose;
            if (onClose && typeof onClose === "function") {
              onClose();
            }
          },
        })}
      />
      <Stack.Screen
        name={ScreenName.RedirectToOnboardingRecoverFlow}
        options={{ headerShown: false }}
        component={RedirectToOnboardingRecoverFlowScreen}
      />
      <Stack.Screen
        name={NavigatorName.NoFundsFlow}
        component={NoFundsFlowNavigator}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerRight: () => <HeaderRightClose preferDismiss={false} />,
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={NavigatorName.StakeFlow}
        component={StakeFlowNavigator}
        options={{
          ...TransparentHeaderNavigationOptions,
          headerRight: () => <HeaderRightClose preferDismiss={false} />,
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
}
