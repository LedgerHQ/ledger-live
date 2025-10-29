import React, { useMemo } from "react";
import {
  createStackNavigator,
  CardStyleInterpolators,
  TransitionPresets,
} from "@react-navigation/stack";
import { useTranslation } from "react-i18next";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useSelector } from "react-redux";
import { Button, IconsLegacy } from "@ledgerhq/native-ui";
import { ScreenName, NavigatorName } from "~/const";
import { ErrorHeaderInfo } from "./BaseOnboardingNavigator";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import styles from "~/navigation/styles";
import StepHeader from "../StepHeader";
import { bleDevicePairingFlowHeaderOptions } from "~/screens/BleDevicePairingFlow";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { hasNoAccountsSelector } from "~/reducers/accounts";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import { deviceConnectHeaderOptions } from "~/screens/DeviceConnect";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
import { DrawerProps } from "../RootDrawer/types";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { getStakeLabelLocaleBased } from "~/helpers/getStakeLabelLocaleBased";
import { getReceiveStackOptions } from "~/logic/getReceiveStackOptions";
import { register } from "react-native-bundle-splitter";
import MarketNavigator from "LLM/features/Market/Navigator";
import * as FamilyScreens from "./FamilyScreens";
import * as FamilyOptions from "./FamilyScreensOptions";
import Main from "./MainNavigator";
import { LedgerSyncDeepLinkHandler } from "LLM/features/WalletSync/LedgerSyncDeepLinkHandler";

const Stack = createStackNavigator<BaseNavigatorStackParamList>();

const SettingsNavigator = register({ loader: () => import("./SettingsNavigator") });
const ReceiveFundsNavigator = register({
  loader: () => import("./ReceiveFundsNavigator"),
});
const SendFundsNavigator = register({ loader: () => import("./SendFundsNavigator") });
const SignMessageNavigator = register({ loader: () => import("./SignMessageNavigator") });
const SignTransactionNavigator = register({
  loader: () => import("./SignTransactionNavigator"),
});
const SignRawTransactionNavigator = register({
  loader: () => import("./SignRawTransactionNavigator"),
});
const FreezeNavigator = register({ loader: () => import("./FreezeNavigator") });
const UnfreezeNavigator = register({ loader: () => import("./UnfreezeNavigator") });
const ClaimRewardsNavigator = register({ loader: () => import("./ClaimRewardsNavigator") });
const FeesNavigator = register({ loader: () => import("./FeesNavigator") });
const ExchangeLiveAppNavigator = register({
  loader: () => import("./ExchangeLiveAppNavigator"),
});
const CardLiveAppNavigator = register({ loader: () => import("./CardLiveAppNavigator") });
const EarnLiveAppNavigator = register({ loader: () => import("./EarnLiveAppNavigator") });
const PlatformExchangeNavigator = register({
  loader: () => import("./PlatformExchangeNavigator"),
});
const AccountSettingsNavigator = register({
  loader: () => import("./AccountSettingsNavigator"),
});
const PasswordAddFlowNavigator = register({
  loader: () => import("./PasswordAddFlowNavigator"),
});
const PasswordModifyFlowNavigator = register({
  loader: () => import("./PasswordModifyFlowNavigator"),
});
const SwapNavigator = register({ loader: () => import("./SwapNavigator") });
const NotificationCenterNavigator = register({
  loader: () => import("./NotificationCenterNavigator"),
});
const RequestAccountNavigator = register({
  loader: () => import("./RequestAccountNavigator"),
});
const AccountsNavigator = register({ loader: () => import("./AccountsNavigator") });
const WalletConnectLiveAppNavigator = register({
  loader: () => import("./WalletConnectLiveAppNavigator"),
});
const CustomImageNavigator = register({ loader: () => import("./CustomImageNavigator") });
const PostOnboardingNavigator = register({
  loader: () => import("./PostOnboardingNavigator"),
});
const NoFundsFlowNavigator = register({ loader: () => import("./NoFundsFlowNavigator") });
const StakeFlowNavigator = register({ loader: () => import("./StakeFlowNavigator") });
const EditTransactionNavigator = register({
  loader: () => import("~/families/evm/EditTransactionFlow/EditTransactionNavigator"),
});
const AnalyticsOptInPromptNavigator = register({
  loader: () => import("./AnalyticsOptInPromptNavigator"),
});
const LandingPagesNavigator = register({ loader: () => import("./LandingPagesNavigator") });
const CustomErrorNavigator = register({ loader: () => import("./CustomErrorNavigator") });
const WalletSyncNavigator = register({
  loader: () => import("LLM/features/WalletSync/WalletSyncNavigator"),
});
const ModularDrawerNavigator = register({
  loader: () => import("LLM/features/ModularDrawer/ModularDrawerNavigator"),
});
const Web3HubNavigator = register({ loader: () => import("LLM/features/Web3Hub/Navigator") });
const AddAccountsV2Navigator = register({
  loader: () => import("LLM/features/Accounts/Navigator"),
});
const DeviceSelectionNavigator = register({
  loader: () => import("LLM/features/DeviceSelection/Navigator"),
});
const AssetSelectionNavigator = register({
  loader: () => import("LLM/features/AssetSelection/Navigator"),
});
const AssetsListNavigator = register({ loader: () => import("LLM/features/Assets/Navigator") });

const OperationDetails = register({ loader: () => import("~/screens/OperationDetails") });
const PairDevices = register({ loader: () => import("~/screens/PairDevices") });
const EditDeviceName = register({ loader: () => import("~/screens/EditDeviceName") });
const ScanRecipient = register({
  loader: () => import("~/screens/SendFunds/ScanRecipient"),
});
const AnalyticsAllocation = register({
  loader: () => import("~/screens/Analytics/Allocation"),
});
const AnalyticsOperations = register({
  loader: () => import("~/screens/Analytics/Operations"),
});
const Account = register({ loader: () => import("~/screens/Account") });
const ReadOnlyAccount = register({
  loader: () => import("~/screens/Account/ReadOnly/ReadOnlyAccount"),
});
const PortfolioHistory = register({
  loader: () => import("~/screens/Portfolio/PortfolioHistory"),
});
const VerifyAccount = register({ loader: () => import("~/screens/VerifyAccount") });
const LiveApp = register({
  loader: () => import("~/screens/Platform"),
});
const PostBuyDeviceScreen = register({
  loader: () => import("LLM/features/Reborn/screens/PostBuySuccess"),
});
const PostBuyDeviceSetupNanoWallScreen = register({
  loader: () => import("~/screens/PostBuyDeviceSetupNanoWallScreen"),
});
const CurrencySettings = register({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings"),
});
const DeviceConnect = register({ loader: () => import("~/screens/DeviceConnect") });
const RecoverPlayer = register({
  loader: () => import("~/screens/Protect/Player"),
});
const RedirectToOnboardingRecoverFlowScreen = register({
  loader: () => import("~/screens/Protect/RedirectToOnboardingRecoverFlow"),
});
const FirmwareUpdateScreen = register({ loader: () => import("~/screens/FirmwareUpdate") });
const EditCurrencyUnits = register({
  loader: () => import("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits"),
});
const BleDevicePairingFlow = register({
  loader: () => import("~/screens/BleDevicePairingFlow"),
});

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
            headerBackButtonDisplayMode: "minimal",
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
        <Stack.Screen
          name={ScreenName.AlgorandEditMemo}
          component={FamilyScreens.AlgorandEditMemo}
          options={FamilyOptions.AlgorandEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.AlgorandClaimRewardsFlow}
          component={FamilyScreens.AlgorandClaimRewardsFlow}
          options={FamilyOptions.AlgorandClaimRewardsFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.AlgorandOptInFlow}
          component={FamilyScreens.AlgorandOptInFlow}
          options={FamilyOptions.AlgorandOptInFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.BitcoinEditCustomFees}
          component={FamilyScreens.BitcoinEditCustomFees}
          options={FamilyOptions.BitcoinEditCustomFeesOptions}
        />
        <Stack.Screen
          name={ScreenName.CardanoEditMemo}
          component={FamilyScreens.CardanoEditMemo}
          options={FamilyOptions.CardanoEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.CardanoDelegationFlow}
          component={FamilyScreens.CardanoDelegationFlow}
          options={FamilyOptions.CardanoDelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CardanoUndelegationFlow}
          component={FamilyScreens.CardanoUndelegationFlow}
          options={FamilyOptions.CardanoUndelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloManageAssetsNavigator}
          component={FamilyScreens.CeloManageAssetsNavigator}
          options={FamilyOptions.CeloManageAssetsNavigatorOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloRegistrationFlow}
          component={FamilyScreens.CeloRegistrationFlow}
          options={FamilyOptions.CeloRegistrationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloLockFlow}
          component={FamilyScreens.CeloLockFlow}
          options={FamilyOptions.CeloLockFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloUnlockFlow}
          component={FamilyScreens.CeloUnlockFlow}
          options={FamilyOptions.CeloUnlockFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloVoteFlow}
          component={FamilyScreens.CeloVoteFlow}
          options={FamilyOptions.CeloVoteFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloActivateFlow}
          component={FamilyScreens.CeloActivateFlow}
          options={FamilyOptions.CeloActivateFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloRevokeFlow}
          component={FamilyScreens.CeloRevokeFlow}
          options={FamilyOptions.CeloRevokeFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CeloWithdrawFlow}
          component={FamilyScreens.CeloWithdrawFlow}
          options={FamilyOptions.CeloWithdrawFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CosmosDelegationFlow}
          component={FamilyScreens.CosmosDelegationFlow}
          options={FamilyOptions.CosmosDelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CosmosRedelegationFlow}
          component={FamilyScreens.CosmosRedelegationFlow}
          options={FamilyOptions.CosmosRedelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CosmosUndelegationFlow}
          component={FamilyScreens.CosmosUndelegationFlow}
          options={FamilyOptions.CosmosUndelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CosmosClaimRewardsFlow}
          component={FamilyScreens.CosmosClaimRewardsFlow}
          options={FamilyOptions.CosmosClaimRewardsFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.CosmosFamilyEditMemo}
          component={FamilyScreens.CosmosFamilyEditMemo}
          options={FamilyOptions.CosmosFamilyEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.MultiversXClaimRewardsFlow}
          component={FamilyScreens.MultiversXClaimRewardsFlow}
          options={FamilyOptions.MultiversXClaimRewardsFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.MultiversXDelegationFlow}
          component={FamilyScreens.MultiversXDelegationFlow}
          options={FamilyOptions.MultiversXDelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.MultiversXUndelegationFlow}
          component={FamilyScreens.MultiversXUndelegationFlow}
          options={FamilyOptions.MultiversXUndelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.MultiversXWithdrawFlow}
          component={FamilyScreens.MultiversXWithdrawFlow}
          options={FamilyOptions.MultiversXWithdrawFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.EvmEditGasLimit}
          component={FamilyScreens.EvmEditGasLimit}
          options={FamilyOptions.EvmEditGasLimitOptions}
        />
        <Stack.Screen
          name={ScreenName.EvmCustomFees}
          component={FamilyScreens.EvmCustomFees}
          options={FamilyOptions.EvmCustomFeesOptions}
        />
        <Stack.Screen
          name={ScreenName.HederaEditMemo}
          component={FamilyScreens.HederaEditMemo}
          options={FamilyOptions.HederaEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.HederaAssociateTokenFlow}
          component={FamilyScreens.HederaAssociateTokenFlow}
          options={FamilyOptions.HederaAssociateTokenFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.InternetComputerEditMemo}
          component={FamilyScreens.InternetComputerEditMemo}
          options={FamilyOptions.InternetComputerEditMemoOptions}
        />
        <Stack.Screen
          name={ScreenName.KaspaEditCustomFees}
          component={FamilyScreens.KaspaEditCustomFees}
          options={FamilyOptions.KaspaEditCustomFeesOptions}
        />
        <Stack.Screen
          name={ScreenName.MinaEditMemo}
          component={FamilyScreens.MinaEditMemo}
          options={FamilyOptions.MinaEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.NearStakingFlow}
          component={FamilyScreens.NearStakingFlow}
          options={FamilyOptions.NearStakingFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.NearUnstakingFlow}
          component={FamilyScreens.NearUnstakingFlow}
          options={FamilyOptions.NearUnstakingFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.NearWithdrawingFlow}
          component={FamilyScreens.NearWithdrawingFlow}
          options={FamilyOptions.NearWithdrawingFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.PolkadotBondFlow}
          component={FamilyScreens.PolkadotBondFlow}
          options={FamilyOptions.PolkadotBondFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.PolkadotRebondFlow}
          component={FamilyScreens.PolkadotRebondFlow}
          options={FamilyOptions.PolkadotRebondFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.PolkadotUnbondFlow}
          component={FamilyScreens.PolkadotUnbondFlow}
          options={FamilyOptions.PolkadotUnbondFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.PolkadotNominateFlow}
          component={FamilyScreens.PolkadotNominateFlow}
          options={FamilyOptions.PolkadotNominateFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.PolkadotSimpleOperationFlow}
          component={FamilyScreens.PolkadotSimpleOperationFlow}
          options={FamilyOptions.PolkadotSimpleOperationFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.XrpEditTag}
          component={FamilyScreens.XrpEditTag}
          options={FamilyOptions.XrpEditTagOptions}
        />
        <Stack.Screen
          name={ScreenName.SolanaEditMemo}
          component={FamilyScreens.SolanaEditMemo}
          options={FamilyOptions.SolanaEditMemoOptions}
        />
        <Stack.Screen
          name={NavigatorName.SolanaDelegationFlow}
          component={FamilyScreens.SolanaDelegationFlow}
          options={FamilyOptions.SolanaDelegationFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.StacksEditMemo}
          component={FamilyScreens.StacksEditMemo}
          options={FamilyOptions.StacksEditMemoOptions}
        />
        <Stack.Screen
          name={ScreenName.CasperEditTransferId}
          component={FamilyScreens.CasperEditTransferId}
          options={FamilyOptions.CasperEditTransferIdOptions}
        />
        <Stack.Screen
          name={ScreenName.StellarEditMemoValue}
          component={FamilyScreens.StellarEditMemoValue}
          options={FamilyOptions.StellarEditMemoValueOptions}
        />
        <Stack.Screen
          name={ScreenName.StellarEditMemoType}
          component={FamilyScreens.StellarEditMemoType}
          options={FamilyOptions.StellarEditMemoTypeOptions}
        />
        <Stack.Screen
          name={ScreenName.StellarEditCustomFees}
          component={FamilyScreens.StellarEditCustomFees}
          options={FamilyOptions.StellarEditCustomFeesOptions}
        />
        <Stack.Screen
          name={NavigatorName.StellarAddAssetFlow}
          component={FamilyScreens.StellarAddAssetFlow}
          options={FamilyOptions.StellarAddAssetFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.TezosDelegationFlow}
          component={FamilyScreens.TezosDelegationFlow}
          options={FamilyOptions.TezosDelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.TronVoteFlow}
          component={FamilyScreens.TronVoteFlow}
          options={FamilyOptions.TronVoteFlowOptions}
        />
        <Stack.Screen
          name={ScreenName.TonEditComment}
          component={FamilyScreens.TonEditComment}
          options={FamilyOptions.TonEditCommentOptions}
        />
        <Stack.Screen
          name={NavigatorName.SuiDelegateFlow}
          component={FamilyScreens.SuiDelegationFlow}
          options={FamilyOptions.SuiDelegationFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.SuiUndelegateFlow}
          component={FamilyScreens.SuiUndelegateFlow}
          options={FamilyOptions.SuiUndelegateFlowOptions}
        />
        <Stack.Screen
          name={NavigatorName.CantonOnboard}
          component={FamilyScreens.CantonOnboard}
          options={FamilyOptions.CantonOnboardOptions}
        />
        <Stack.Screen
          name={ScreenName.CantonEditMemo}
          component={FamilyScreens.CantonEditMemo}
          options={FamilyOptions.CantonEditMemoOptions}
        />
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
            headerLeft: () => null,
            headerRight: () => <Button Icon={IconsLegacy.CloseMedium} />,
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

        <Stack.Screen
          name={NavigatorName.AssetSelection}
          component={AssetSelectionNavigator}
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
