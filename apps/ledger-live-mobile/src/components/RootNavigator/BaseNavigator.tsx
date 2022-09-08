import React, { useMemo } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
  StackNavigationProp,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { Flex, Icons } from "@ledgerhq/native-ui";
import { useTheme } from "styled-components/native";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { ScreenName, NavigatorName } from "../../const";
import * as families from "../../families";
import OperationDetails, {
  BackButton,
  CloseButton,
} from "../../screens/OperationDetails";
import PairDevices from "../../screens/PairDevices";
import EditDeviceName from "../../screens/EditDeviceName";
import ScanRecipient from "../../screens/SendFunds/ScanRecipient";
// eslint-disable-next-line import/no-unresolved
import FallbackCameraSend from "../FallbackCamera/FallbackCameraSend";
// eslint-disable-next-line import/no-cycle
import Main from "./MainNavigator";
// eslint-disable-next-line import/no-cycle
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import SettingsNavigator from "./SettingsNavigator";
// eslint-disable-next-line import/no-cycle
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
import MigrateAccountsFlowNavigator from "./MigrateAccountsFlowNavigator";
// eslint-disable-next-line import/no-cycle
import SwapNavigator from "./SwapNavigator";
import LendingNavigator from "./LendingNavigator";
import LendingInfoNavigator from "./LendingInfoNavigator";
import LendingEnableFlowNavigator from "./LendingEnableFlowNavigator";
import LendingSupplyFlowNavigator from "./LendingSupplyFlowNavigator";
import LendingWithdrawFlowNavigator from "./LendingWithdrawFlowNavigator";
import NotificationCenterNavigator from "./NotificationCenterNavigator";
import AnalyticsNavigator from "./AnalyticsNavigator";
import NftNavigator from "./NftNavigator";
import { getStackNavigatorConfig } from "../../navigation/navigatorConfig";
import Account from "../../screens/Account";
import TransparentHeaderNavigationOptions from "../../navigation/TransparentHeaderNavigationOptions";
import styles from "../../navigation/styles";
import HeaderRightClose from "../HeaderRightClose";
import StepHeader from "../StepHeader";
import AccountHeaderTitle from "../../screens/Account/AccountHeaderTitle";
import AccountHeaderRight from "../../screens/Account/AccountHeaderRight";
import PortfolioHistory from "../../screens/Portfolio/PortfolioHistory";
import RequestAccountNavigator from "./RequestAccountNavigator";
import VerifyAccount from "../../screens/VerifyAccount";
import PlatformApp from "../../screens/Platform/App";
// eslint-disable-next-line import/no-cycle
import AccountsNavigator from "./AccountsNavigator";

import MarketCurrencySelect from "../../screens/Market/MarketCurrencySelect";
import SwapFormSelectAccount from "../../screens/Swap/FormSelection/SelectAccountScreen";
import SwapFormSelectCurrency from "../../screens/Swap/FormSelection/SelectCurrencyScreen";
import SwapFormSelectFees from "../../screens/Swap/FormSelection/SelectFeesScreen";
import SwapFormSelectProviderRate from "../../screens/Swap/FormSelection/SelectProviderRateScreen";
import SwapOperationDetails from "../../screens/Swap/OperationDetails";

import ProviderList from "../../screens/Exchange/ProviderList";
import ProviderView from "../../screens/Exchange/ProviderView";
import ScreenHeader from "../../screens/Exchange/ScreenHeader";
import ExchangeStackNavigator from "./ExchangeStackNavigator";

import PostBuyDeviceScreen from "../../screens/PostBuyDeviceScreen";
import Learn from "../../screens/Learn";
// eslint-disable-next-line import/no-cycle
import { useNoNanoBuyNanoWallScreenOptions } from "../../context/NoNanoBuyNanoWall";
import PostBuyDeviceSetupNanoWallScreen from "../../screens/PostBuyDeviceSetupNanoWallScreen";
import WalletConnectNavigator from "./WalletConnectNavigator";
import WalletConnectLiveAppNavigator from "./WalletConnectLiveAppNavigator";
import CustomImageNavigator from "./CustomImageNavigator";

import {
  BleDevicePairingFlow,
  BleDevicePairingFlowParams,
} from "../../screens/BleDevicePairingFlow/index";

// TODO: types for each screens and navigators need to be set
export type BaseNavigatorStackParamList = {
  BleDevicePairingFlow: BleDevicePairingFlowParams;

  // Hack: allows any other properties
  [otherScreens: string]: undefined | object;
};

export type BaseNavigatorProps =
  StackNavigationProp<BaseNavigatorStackParamList>;

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

export default function BaseNavigator() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const stackNavigationConfig = useMemo(
    () => getStackNavigatorConfig(colors, true),
    [colors],
  );
  const learn = useFeature("learn");
  // PTX smart routing feature flag - buy sell live app flag
  const ptxSmartRoutingMobile = useFeature("ptxSmartRoutingMobile");
  const walletConnectLiveApp = useFeature("walletConnectLiveApp");
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();

  return (
    <Stack.Navigator
      screenOptions={{
        ...stackNavigationConfig,
        ...TransitionPresets.ModalPresentation,
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
          headerMode: "none",
          mode: "modal",
          transparentCard: true,
          cardStyle: { opacity: 1 },
          gestureEnabled: true,
          headerTitle: null,
          headerRight: () => null,
          headerBackTitleVisible: false,
          title: null,
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
        name={ScreenName.PlatformApp}
        component={PlatformApp}
        options={({ route }) => ({
          headerBackImage: () => (
            <Flex pl="16px">
              <Icons.CloseMedium color="neutral.c100" size="20px" />
            </Flex>
          ),
          headerStyle: styles.headerNoShadow,
          title: route.params.name,
        })}
        {...noNanoBuyNanoWallScreenOptions}
      />
      {learn?.enabled ? (
        <Stack.Screen
          name={ScreenName.Learn}
          component={Learn}
          options={{
            headerShown: true,
            animationEnabled: false,
            headerTitle: "",
            headerLeft: () => null,
          }}
        />
      ) : null}
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
        options={{
          ...stackNavigationConfig,
          headerLeft: () => null,
          title: t("transfer.swap.form.tab"),
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapV2FormSelectAccount}
        component={SwapFormSelectAccount}
        options={({ route }) => ({
          headerTitle: () => (
            <StepHeader
              title={
                route.params.target === "from"
                  ? t("transfer.swap.form.from")
                  : t("transfer.swap.form.to")
              }
            />
          ),
          headerRight: () => null,
        })}
      />
      <Stack.Screen
        name={ScreenName.SwapOperationDetails}
        component={SwapOperationDetails}
        options={{
          title: t("transfer.swap.form.tab"),
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapV2FormSelectCurrency}
        component={SwapFormSelectCurrency}
        options={{
          headerTitle: () => <StepHeader title={t("transfer.swap.form.to")} />,
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapFormSelectProviderRate}
        component={SwapFormSelectProviderRate}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.form.summary.method")} />
          ),
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={ScreenName.SwapV2FormSelectFees}
        component={SwapFormSelectFees}
        options={{
          headerTitle: () => (
            <StepHeader title={t("transfer.swap.form.summary.fees")} />
          ),
          headerRight: () => null,
        }}
      />
      <Stack.Screen
        name={NavigatorName.Lending}
        component={LendingNavigator}
        options={{
          ...stackNavigationConfig,
          headerStyle: styles.headerNoShadow,
          headerLeft: () => null,
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
              route.params?.onError || route.params?.params?.onError;
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
              route.params?.onClose || route.params?.params?.onClose;
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
        name={NavigatorName.ProviderList}
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
        name={NavigatorName.ProviderView}
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
          title: null,
          headerRight: () => (
            <ErrorHeaderInfo
              route={route}
              navigation={navigation}
              colors={colors}
            />
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
        name={NavigatorName.MigrateAccountsFlow}
        component={MigrateAccountsFlowNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name={NavigatorName.Analytics}
        component={AnalyticsNavigator}
        options={{
          title: t("analytics.title"),
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
          unmountOnBlur: true,
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
      />
      <Stack.Screen
        name={ScreenName.FallbackCameraSend}
        component={FallbackCameraSend}
        options={{
          title: t("send.scan.fallback.header"),
          headerLeft: () => null,
        }}
      />
      <Stack.Screen
        name={NavigatorName.NotificationCenter}
        component={NotificationCenterNavigator}
        options={({ navigation }) => ({
          title: t("notificationCenter.title"),
          headerLeft: () => null,
          headerRight: () => <CloseButton navigation={navigation} />,
          cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
        })}
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
      <Stack.Screen
        name={ScreenName.BleDevicePairingFlow as "BleDevicePairingFlow"}
        component={BleDevicePairingFlow}
        options={{
          title: "",
        }}
      />
    </Stack.Navigator>
  );
}
