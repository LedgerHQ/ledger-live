import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { RouteProp, useRoute } from "@react-navigation/native";
import {
  CardStyleInterpolators,
  createStackNavigator,
  StackNavigationOptions,
  TransitionPresets,
} from "@react-navigation/stack";
import MarketNavigator from "LLM/features/Market/Navigator";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { register } from "react-native-bundle-splitter";
import { useSelector } from "react-redux";
import { useTheme } from "styled-components/native";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { NavigatorName, ScreenName } from "~/const";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import * as families from "~/families";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { getReceiveStackOptions } from "~/logic/getReceiveStackOptions";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import styles from "~/navigation/styles";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { bleDevicePairingFlowHeaderOptions } from "~/screens/BleDevicePairingFlow";
import { deviceConnectHeaderOptions } from "~/screens/DeviceConnect";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
import { DrawerProps } from "../RootDrawer/types";
import StepHeader from "../StepHeader";
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import Main from "./MainNavigator";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import ReadOnlyAccount from "~/screens/Account/ReadOnly/ReadOnlyAccount";

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
  const llmAccountListUI = useFeature("llmAccountListUI");
  const noah = useFeature("noah");

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
          component={register({ loader: () => import("./BuyDeviceNavigator") })}
          options={{
            headerShown: false,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.NoDeviceWallScreen}
          component={register({
            loader: () => import("~/screens/PostBuyDeviceSetupNanoWallScreen"),
          })}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.PostBuyDeviceSetupNanoWallScreen}
          component={register({
            loader: () => import("~/screens/PostBuyDeviceSetupNanoWallScreen"),
          })}
          options={{
            headerShown: false,
            presentation: "transparentModal",
            headerMode: undefined,
            cardStyle: { opacity: 1 },
            gestureEnabled: true,
            headerTitle: "",
            headerRight: () => null,
            headerBackButtonDisplayMode: "minimal",
            title: "",
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.PostBuyDeviceScreen}
          component={register({
            loader: () => import("LLM/features/Reborn/screens/PostBuySuccess"),
          })}
          options={{
            title: t("postBuyDevice.headerTitle"),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.Settings}
          component={register({ loader: () => import("./SettingsNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.CurrencySettings}
          component={register({
            loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
          })}
          options={({ route }) => ({
            title: route.params.headerTitle,
            headerRight: () => null,
          })}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.EditCurrencyUnits}
          component={register({
            loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
          })}
          options={{
            title: t("account.settings.accountUnits.title"),
          }}
        />
        <Stack.Screen
          name={NavigatorName.ReceiveFunds}
          component={register({ loader: () => import("./ReceiveFundsNavigator") })}
          options={({ route }) =>
            getReceiveStackOptions({
              route,
              noahEnabled: noah?.enabled,
            })
          }
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.SendFunds}
          component={register({ loader: () => import("./SendFundsNavigator") })}
          options={{ headerShown: false }}
        />
        {web3hub?.enabled ? (
          <Stack.Screen
            name={NavigatorName.Web3Hub}
            component={register({ loader: () => import("LLM/features/Web3Hub/Navigator") })}
            options={{ headerShown: false }}
          />
        ) : null}
        <Stack.Screen
          name={ScreenName.PlatformApp}
          component={register({ loader: () => import("~/screens/Platform/LiveApp") })}
          options={{
            headerStyle: styles.headerNoShadow,
          }}
        />
        <Stack.Screen
          name={ScreenName.Recover}
          component={register({ loader: () => import("~/screens/Protect/Player") })}
          options={{
            headerStyle: styles.headerNoShadow,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.SignMessage}
          component={register({ loader: () => import("./SignMessageNavigator") })}
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
          component={register({ loader: () => import("./SignTransactionNavigator") })}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              route.params.onError(new Error("Signature interrupted by user"));
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.SignRawTransaction}
          component={register({ loader: () => import("./SignRawTransactionNavigator") })}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              route.params.onError(new Error("Signature interrupted by user"));
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.Swap}
          component={register({ loader: () => import("./SwapNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Freeze}
          component={register({ loader: () => import("./FreezeNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Unfreeze}
          component={register({ loader: () => import("./UnfreezeNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.ClaimRewards}
          component={register({ loader: () => import("./ClaimRewardsNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Fees}
          component={register({ loader: () => import("./FeesNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.RequestAccount}
          component={register({ loader: () => import("./RequestAccountNavigator") })}
          options={{
            headerShown: false,
          }}
          listeners={({ route }) => ({
            beforeRemove: () => handleOnClose(route),
          })}
        />
        <Stack.Screen
          name={ScreenName.VerifyAccount}
          component={register({ loader: () => import("~/screens/VerifyAccount") })}
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
          component={register({ loader: () => import("./CardLiveAppNavigator") })}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.Exchange}
          component={register({ loader: () => import("./ExchangeLiveAppNavigator") })}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.PlatformExchange}
          component={register({ loader: () => import("./PlatformExchangeNavigator") })}
          options={{ headerShown: false }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.CustomError}
          component={register({ loader: () => import("./CustomErrorNavigator") })}
          options={{ title: "" }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={ScreenName.OperationDetails}
          component={register({ loader: () => import("~/screens/OperationDetails") })}
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
                cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
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
              cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
            };
          }}
        />
        <Stack.Screen
          name={NavigatorName.AccountSettings}
          component={register({ loader: () => import("~/screens/AccountSettings") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.PairDevices}
          component={register({ loader: () => import("~/screens/PairDevices") })}
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
          component={register({ loader: () => import("~/screens/EditDeviceName") })}
          options={{
            title: t("EditDeviceName.title"),
            headerLeft: () => null,
            ...TransitionPresets.ModalPresentationIOS,
          }}
        />
        <Stack.Screen
          name={NavigatorName.PasswordAddFlow}
          component={register({ loader: () => import("./PasswordAddFlowNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.PasswordModifyFlow}
          component={register({ loader: () => import("./PasswordModifyFlowNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsAllocation}
          component={register({ loader: () => import("~/screens/Analytics/Allocation") })}
          options={{
            title: t("analytics.allocation.title"),
            headerRight: () => null,
            cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
          }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsOperations}
          component={register({ loader: () => import("~/screens/Analytics/Operations") })}
          options={{
            title: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.WalletSync}
          component={register({
            loader: () => import("LLM/features/WalletSync/WalletSyncNavigator"),
          })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.LedgerSyncDeepLinkHandler}
          component={register({
            loader: () => import("LLM/features/WalletSync/LedgerSyncDeepLinkHandler"),
          })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.ModularDrawer}
          component={register({
            loader: () => import("LLM/features/ModularDrawer/ModularDrawerNavigator"),
          })}
          options={{ headerShown: false }}
        />
        {MarketNavigator({ Stack })}
        <Stack.Screen
          name={ScreenName.PortfolioOperationHistory}
          component={register({ loader: () => import("~/screens/Portfolio/PortfolioHistory") })}
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
          component={register({ loader: () => import("~/screens/SendFunds/ScanRecipient") })}
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
          component={register({ loader: () => import("./WalletConnectLiveAppNavigator") })}
          options={{
            headerShown: false,
          }}
          {...noNanoBuyNanoWallScreenOptions}
        />
        <Stack.Screen
          name={NavigatorName.NotificationCenter}
          component={register({ loader: () => import("./NotificationCenterNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Accounts}
          component={register({ loader: () => import("./AccountsNavigator") })}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.CustomImage}
          component={register({ loader: () => import("./CustomImageNavigator") })}
          options={{ headerShown: false }}
        />
        {/* This is a freaking hack… */}
        {Object.keys(families).map(name => {
          /* eslint-disable @typescript-eslint/consistent-type-assertions */
          const { component, options } = families[name as keyof typeof families];
          const screenName = name as keyof BaseNavigatorStackParamList;
          const screenComponent = component as React.ComponentType;
          const screenOptions = options as StackNavigationOptions;
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
          component={register({ loader: () => import("~/screens/BleDevicePairingFlow") })}
          options={bleDevicePairingFlowHeaderOptions}
        />
        <Stack.Screen
          name={NavigatorName.PostOnboarding}
          options={{ headerShown: false }}
          component={register({ loader: () => import("./PostOnboardingNavigator") })}
        />
        <Stack.Screen
          name={ScreenName.DeviceConnect}
          component={register({ loader: () => import("~/screens/DeviceConnect") })}
          options={useMemo(() => deviceConnectHeaderOptions(t), [t])}
          listeners={({ route }) => ({
            beforeRemove: () => handleOnClose(route),
          })}
        />
        <Stack.Screen
          name={ScreenName.RedirectToOnboardingRecoverFlow}
          options={{ ...TransparentHeaderNavigationOptions, title: "" }}
          component={register({
            loader: () => import("~/screens/Protect/RedirectToOnboardingRecoverFlow"),
          })}
        />
        <Stack.Screen
          name={NavigatorName.Earn}
          component={register({ loader: () => import("./EarnLiveAppNavigator") })}
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
          component={register({ loader: () => import("./NoFundsFlowNavigator") })}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: () => <NavigationHeaderCloseButtonAdvanced preferDismiss={false} />,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.StakeFlow}
          component={register({ loader: () => import("./StakeFlowNavigator") })}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: () => <NavigationHeaderCloseButtonAdvanced preferDismiss={false} />,
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.EvmEditTransaction}
          options={{ headerShown: false }}
          component={register({
            loader: () => import("~/families/evm/EditTransactionFlow/EditTransactionNavigator"),
          })}
        />
        <Stack.Screen
          name={NavigatorName.AnalyticsOptInPrompt}
          options={{ headerShown: false }}
          component={register({ loader: () => import("./AnalyticsOptInPromptNavigator") })}
        />
        <Stack.Screen
          name={NavigatorName.LandingPages}
          options={{ headerShown: false }}
          component={register({ loader: () => import("./LandingPagesNavigator") })}
        />
        <Stack.Screen
          name={ScreenName.FirmwareUpdate}
          component={register({ loader: () => import("~/screens/FirmwareUpdate") })}
          options={{
            gestureEnabled: false,
            headerTitle: () => null,
            headerLeft: () => null,
            headerRight: () => <Button Icon={IconsLegacy.CloseMedium} />,
          }}
        />
        <Stack.Screen
          name={NavigatorName.AddAccounts}
          component={register({ loader: () => import("LLM/features/Accounts/Navigator") })}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.DeviceSelection}
          component={register({ loader: () => import("LLM/features/DeviceSelection/Navigator") })}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.AssetSelection}
          component={register({ loader: () => import("LLM/features/AssetSelection/Navigator") })}
          options={{ headerShown: false }}
        />

        {llmAccountListUI?.enabled && (
          <Stack.Screen
            name={NavigatorName.Assets}
            component={register({ loader: () => import("LLM/features/Assets/Navigator") })}
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
