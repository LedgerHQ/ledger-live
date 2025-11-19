import React, { useMemo } from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useTranslation } from "react-i18next";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { ScreenName, NavigatorName } from "~/const";
import * as families from "~/families";
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import styles from "~/navigation/styles";
import StepHeader from "../StepHeader";
import MarketNavigator from "LLM/features/Market/Navigator";
import { bleDevicePairingFlowHeaderOptions } from "~/screens/BleDevicePairingFlow";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
import { DrawerProps } from "../RootDrawer/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { lazyLoad, PRELOAD_SCREEN_NAMES } from "LLM/utils/lazyLoad";
import { deviceConnectHeaderOptions } from "~/screens/DeviceConnect";

const OperationDetails = lazyLoad({ loader: () => import("~/screens/OperationDetails") });
const PairDevices = lazyLoad({ loader: () => import("~/screens/PairDevices") });
const EditDeviceName = lazyLoad({ loader: () => import("~/screens/EditDeviceName") });
const ScanRecipient = lazyLoad({ loader: () => import("~/screens/SendFunds/ScanRecipient") });
const Main = lazyLoad({ loader: () => import("./MainNavigator") });
const SettingsNavigator = lazyLoad({
  loader: () => import("./SettingsNavigator"),
  name: PRELOAD_SCREEN_NAMES.SettingsNavigator,
});
const BuyDeviceNavigator = lazyLoad({ loader: () => import("./BuyDeviceNavigator") });
const ReceiveFundsNavigator = lazyLoad({ loader: () => import("./ReceiveFundsNavigator") });
const SendFundsNavigator = lazyLoad({ loader: () => import("./SendFundsNavigator") });
const SignMessageNavigator = lazyLoad({ loader: () => import("./SignMessageNavigator") });
const SignTransactionNavigator = lazyLoad({ loader: () => import("./SignTransactionNavigator") });
const FreezeNavigator = lazyLoad({ loader: () => import("./FreezeNavigator") });
const UnfreezeNavigator = lazyLoad({ loader: () => import("./UnfreezeNavigator") });
const ClaimRewardsNavigator = lazyLoad({ loader: () => import("./ClaimRewardsNavigator") });
const ExchangeLiveAppNavigator = lazyLoad({
  loader: () => import("./ExchangeLiveAppNavigator"),
  name: PRELOAD_SCREEN_NAMES.ExchangeLiveAppNavigator,
});
const CardLiveAppNavigator = lazyLoad({ loader: () => import("./CardLiveAppNavigator") });
const EarnLiveAppNavigator = lazyLoad({
  loader: () => import("./EarnLiveAppNavigator"),
  name: PRELOAD_SCREEN_NAMES.EarnLiveAppNavigator,
});
const PlatformExchangeNavigator = lazyLoad({
  loader: () => import("./PlatformExchangeNavigator"),
});
const AccountSettingsNavigator = lazyLoad({ loader: () => import("./AccountSettingsNavigator") });
const PasswordAddFlowNavigator = lazyLoad({ loader: () => import("./PasswordAddFlowNavigator") });
const PasswordModifyFlowNavigator = lazyLoad({
  loader: () => import("./PasswordModifyFlowNavigator"),
});
const SwapNavigator = lazyLoad({ loader: () => import("./SwapNavigator") });
const NotificationCenterNavigator = lazyLoad({
  loader: () => import("./NotificationCenterNavigator"),
});
const AnalyticsAllocation = lazyLoad({ loader: () => import("~/screens/Analytics/Allocation") });
const AnalyticsOperations = lazyLoad({ loader: () => import("~/screens/Analytics/Operations") });
const Account = lazyLoad({ loader: () => import("~/screens/Account") });
const ReadOnlyAccount = lazyLoad({
  loader: () => import("~/screens/Account/ReadOnly/ReadOnlyAccount"),
});

const PortfolioHistory = lazyLoad({ loader: () => import("~/screens/Portfolio/PortfolioHistory") });
const RequestAccountNavigator = lazyLoad({ loader: () => import("./RequestAccountNavigator") });
const VerifyAccount = lazyLoad({ loader: () => import("~/screens/VerifyAccount") });
const LiveApp = lazyLoad({
  loader: () => import("~/screens/Platform").then(m => ({ default: m.LiveApp })),
});
const AccountsNavigator = lazyLoad({ loader: () => import("./AccountsNavigator") });
const BleDevicePairingFlow = lazyLoad({
  loader: () =>
    import("~/screens/BleDevicePairingFlow").then(m => ({ default: m.BleDevicePairingFlow })),
});
const PostBuyDeviceScreen = lazyLoad({
  loader: () => import("LLM/features/Reborn/screens/PostBuySuccess"),
});
const PostBuyDeviceSetupNanoWallScreen = lazyLoad({
  loader: () => import("~/screens/PostBuyDeviceSetupNanoWallScreen"),
});
const CurrencySettings = lazyLoad({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
});
const WalletConnectLiveAppNavigator = lazyLoad({
  loader: () => import("./WalletConnectLiveAppNavigator"),
});
const CustomImageNavigator = lazyLoad({ loader: () => import("./CustomImageNavigator") });
const PostOnboardingNavigator = lazyLoad({ loader: () => import("./PostOnboardingNavigator") });
const DeviceConnect = lazyLoad({
  loader: () => import("~/screens/DeviceConnect").then(m => ({ default: m.default })),
});
const NoFundsFlowNavigator = lazyLoad({ loader: () => import("./NoFundsFlowNavigator") });
const StakeFlowNavigator = lazyLoad({ loader: () => import("./StakeFlowNavigator") });
const RecoverPlayer = lazyLoad({
  loader: () => import("~/screens/Protect/Player").then(m => ({ default: m.RecoverPlayer })),
});
const RedirectToOnboardingRecoverFlowScreen = lazyLoad({
  loader: () =>
    import("~/screens/Protect/RedirectToOnboardingRecoverFlow").then(m => ({
      default: m.RedirectToOnboardingRecoverFlowScreen,
    })),
});

const EditTransactionNavigator = lazyLoad({
  loader: () => import("~/families/evm/EditTransactionFlow/EditTransactionNavigator"),
});
const AnalyticsOptInPromptNavigator = lazyLoad({
  loader: () => import("./AnalyticsOptInPromptNavigator"),
});
const LandingPagesNavigator = lazyLoad({ loader: () => import("./LandingPagesNavigator") });
const FirmwareUpdateScreen = lazyLoad({ loader: () => import("~/screens/FirmwareUpdate") });
const EditCurrencyUnits = lazyLoad({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
});
const CustomErrorNavigator = lazyLoad({ loader: () => import("./CustomErrorNavigator") });
const WalletSyncNavigator = lazyLoad({
  loader: () => import("LLM/features/WalletSync/WalletSyncNavigator"),
});
const ModularDrawerNavigator = lazyLoad({
  loader: () => import("LLM/features/ModularDrawer/ModularDrawerNavigator"),
});
const LedgerSyncDeepLinkHandler = lazyLoad({
  loader: () =>
    import("LLM/features/WalletSync/LedgerSyncDeepLinkHandler").then(m => ({
      default: m.LedgerSyncDeepLinkHandler,
    })),
});
const Web3HubNavigator = lazyLoad({ loader: () => import("LLM/features/Web3Hub/Navigator") });
const AddAccountsV2Navigator = lazyLoad({
  loader: () => import("LLM/features/Accounts/Navigator"),
});
const DeviceSelectionNavigator = lazyLoad({
  loader: () => import("LLM/features/DeviceSelection/Navigator"),
});
const AssetsListNavigator = lazyLoad({ loader: () => import("LLM/features/Assets/Navigator") });
const FeesNavigator = lazyLoad({ loader: () => import("./FeesNavigator") });
const SignRawTransactionNavigator = lazyLoad({
  loader: () => import("./SignRawTransactionNavigator"),
});

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList>();

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
  const nativeStackScreenOptions: Partial<NativeStackNavigationOptions> = stackNavigationConfig;
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isAccountsEmpty = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && isAccountsEmpty;
  const web3hub = useFeature("web3hub");
  const llmAccountListUI = useFeature("llmAccountListUI");

  return (
    <>
      <RootDrawer drawer={route.params?.drawer} />
      <Stack.Navigator screenOptions={nativeStackScreenOptions}>
        <Stack.Screen name={NavigatorName.Main} component={Main} options={{ headerShown: false }} />
        <Stack.Screen
          name={NavigatorName.BuyDevice}
          component={BuyDeviceNavigator}
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
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
            gestureEnabled: true,
            headerTitle: "",
            headerRight: () => null,
            headerBackButtonDisplayMode: "minimal",
            title: "",
            animation: "slide_from_bottom",
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
          options={{ headerStyle: styles.headerNoShadow }}
        />
        <Stack.Screen
          name={ScreenName.Recover}
          component={RecoverPlayer}
          options={{ headerStyle: styles.headerNoShadow }}
          {...noNanoBuyNanoWallScreenOptions}
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
          name={NavigatorName.SignRawTransaction}
          component={SignRawTransactionNavigator}
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
          name={NavigatorName.Fees}
          component={FeesNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.RequestAccount}
          component={RequestAccountNavigator}
          options={{
            headerShown: false,
          }}
          listeners={({ route }) => ({
            beforeRemove: () => handleOnClose(route),
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
            beforeRemove: () => handleOnClose(route),
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
              headerRight: () =>
                route.params?.isSubOperation ? <NavigationHeaderCloseButton /> : null,
              animation: "slide_from_bottom",
            };
          }}
        />
        <Stack.Screen
          name={NavigatorName.AccountSettings}
          component={AccountSettingsNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.PairDevices}
          component={PairDevices}
          options={({ navigation, route }) => ({
            title: "",
            headerRight: () => {
              const nav = navigation;
              return <ErrorHeaderInfo route={route} navigation={nav} />;
            },
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
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsOperations}
          component={AnalyticsOperations}
          options={{
            title: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.WalletSync}
          component={WalletSyncNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.LedgerSyncDeepLinkHandler}
          component={LedgerSyncDeepLinkHandler}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.ModularDrawer}
          component={ModularDrawerNavigator}
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
          /* eslint-disable @typescript-eslint/consistent-type-assertions */
          const { component, options } = families[name as keyof typeof families];
          const screenName = name as keyof BaseNavigatorStackParamList;
          const screenComponent = component as React.ComponentType;
          const screenOptions = options as NativeStackNavigationOptions;
          /* eslint-enable @typescript-eslint/consistent-type-assertions */

          return (
            <Stack.Screen
              key={name}
              name={screenName}
              component={screenComponent}
              options={screenOptions}
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
            beforeRemove: () => handleOnClose(route),
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
          options={props => {
            const stakeLabel = getStakeLabelLocaleBased();
            const intent = props.route?.params?.params?.intent;

            return intent === "deposit" || intent === "withdraw"
              ? {
                  headerShown: true,
                  closable: false,
                  headerTitle: t(stakeLabel),
                  headerRight: () => null,
                }
              : { headerShown: false };
          }}
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
            title: "",
            headerLeft: () => null,
            headerRight: () => <NavigationHeaderCloseButton />,
          }}
        />
        <Stack.Screen
          name={NavigatorName.AddAccounts}
          component={AddAccountsV2Navigator}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.DeviceSelection}
          component={DeviceSelectionNavigator}
          options={{ headerShown: false }}
        />

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

/**
 * Handle the onClose callback for the route
 *
 * If the route has a onClose callback, call it
 * If the route has a nested route with a onClose callback, call it
 *
 * @param route
 * The route object
 */
function handleOnClose(route: object) {
  if (route == null || !("params" in route)) return;
  const params = route.params;
  if (params == null) return;

  if (isRouteWithCloseCallback(params)) {
    params.onClose();
  }
  if (isNestedRouteWithCloseCallback(params)) {
    params.params.onClose();
  }
}

/**
 * Check if the route has a onClose callback
 *
 * @param params
 * The route params
 */
function isRouteWithCloseCallback(params: object): params is Readonly<WithCloseCallback> {
  return "onClose" in params && typeof params.onClose === "function";
}

/**
 * Check if the route has a nested route with a onClose callback
 *
 * @param params
 * The route params
 */
function isNestedRouteWithCloseCallback(params: object): params is { params: WithCloseCallback } {
  if (!("params" in params)) return false;
  const nestedParams = params.params;
  if (nestedParams == null) return false;
  return isRouteWithCloseCallback(nestedParams);
}

type WithCloseCallback = { onClose: () => void };
