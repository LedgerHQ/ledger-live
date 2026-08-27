import React, { useMemo } from "react";
import {
  createNativeStackNavigator,
  NativeStackNavigationOptions,
} from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { RouteProp, useRoute } from "@react-navigation/native";
import { useTheme } from "styled-components/native";
import { useSelector } from "~/context/hooks";
import { ScreenName, NavigatorName, BASE_NAVIGATOR_ID } from "~/const";
import type * as FamilyScreens from "~/families";
import Main from "./MainNavigator";
import { useTheme as useLumenTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { getStackNavigatorConfig } from "~/navigation/navigatorConfig";
import TransparentHeaderNavigationOptions from "~/navigation/TransparentHeaderNavigationOptions";
import styles from "~/navigation/styles";
import StepHeader from "../StepHeader";
import { useNoNanoBuyNanoWallScreenOptions } from "~/context/NoNanoBuyNanoWall";
import { readOnlyModeEnabledSelector } from "~/reducers/settings";
import { hasNoAccountsSelector, accountScreenSelector } from "~/reducers/accounts";
import { getMainAccount } from "@ledgerhq/live-common/account/index";
import { getOperationTypeI18nKey } from "~/logic/operationTypeName";
import { BaseNavigatorStackParamList } from "./types/BaseNavigator";
import {
  NavigationHeaderCloseButton,
  NavigationHeaderCloseButtonAdvanced,
} from "../NavigationHeaderCloseButton";
import { NavigationHeaderBackButton } from "~/components/NavigationHeaderBackButton";
import { RootDrawer } from "../RootDrawer/RootDrawer";
import { DrawerProps } from "../RootDrawer/types";
import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { getEarnScreenOptionsFromRouteParams } from "./getEarnScreenOptions";

const Stack = createNativeStackNavigator<BaseNavigatorStackParamList, typeof BASE_NAVIGATOR_ID>();

type OperationDetailsRouteProp = RouteProp<
  BaseNavigatorStackParamList,
  ScreenName.OperationDetails
>;

const renderNullHeader = () => null;

function ScanRecipientHeaderRight() {
  const { colors } = useTheme();

  return (
    <NavigationHeaderCloseButtonAdvanced
      color={colors.constant.white}
      preferDismiss={false}
      rounded
    />
  );
}

function FlowHeaderCloseButton() {
  return <NavigationHeaderCloseButtonAdvanced preferDismiss={false} />;
}

function OperationDetailsHeaderLeft() {
  return <NavigationHeaderBackButton />;
}

function OperationDetailsHeaderTitle() {
  const { t } = useTranslation();
  const route = useRoute<OperationDetailsRouteProp>();
  const { account, parentAccount } = useSelector(accountScreenSelector(route));
  const operationType = route.params?.operation?.type;
  const family = account ? getMainAccount(account, parentAccount).currency.family : undefined;

  return (
    <StepHeader
      subtitle={t("operationDetails.title")}
      title={operationType ? t(getOperationTypeI18nKey(operationType, family)) : ""}
      testID="operationDetails-title"
    />
  );
}

function OperationDetailsHeaderRight() {
  const route = useRoute<OperationDetailsRouteProp>();

  return route.params?.isSubOperation ? <NavigationHeaderCloseButton /> : null;
}

function FirmwareUpdateHeaderTitle() {
  return null;
}

function FirmwareUpdateHeaderLeft() {
  return null;
}

function FirmwareUpdateHeaderRight() {
  return <NavigationHeaderCloseButton />;
}

// ponytail: static names so BaseNavigator does not import ~/families at startup.
// Add new family navigator exports here. Upgrade: generate from families/index.
const FAMILY_SCREEN_NAMES = [
  "AlgorandEditMemo",
  "AlgorandClaimRewardsFlow",
  "AlgorandOptInFlow",
  "BitcoinEditCustomFees",
  "CardanoEditMemo",
  "CardanoDelegationFlow",
  "CardanoUndelegationFlow",
  "CeloManageAssetsNavigator",
  "CeloRegistrationFlow",
  "CeloLockFlow",
  "CeloUnlockFlow",
  "CeloVoteFlow",
  "CeloActivateFlow",
  "CeloRevokeFlow",
  "CeloWithdrawFlow",
  "CosmosDelegationFlow",
  "CosmosRedelegationFlow",
  "CosmosUndelegationFlow",
  "CosmosClaimRewardsFlow",
  "CosmosFamilyEditMemo",
  "MultiversXClaimRewardsFlow",
  "MultiversXDelegationFlow",
  "MultiversXUndelegationFlow",
  "MultiversXWithdrawFlow",
  "EvmEditGasLimit",
  "EvmCustomFees",
  "EvmDelegationFlow",
  "EvmUndelegationFlow",
  "EvmClaimRewardsFlow",
  "EvmWithdrawFlow",
  "HederaEditMemo",
  "HederaAssociateTokenFlow",
  "HederaDelegationFlow",
  "HederaUndelegationFlow",
  "HederaRedelegationFlow",
  "HederaClaimRewardsFlow",
  "InternetComputerEditMemo",
  "InternetComputerStakingFlow",
  "InternetComputerNeuronManageFlow",
  "KaspaEditCustomFees",
  "MinaEditMemo",
  "NearStakingFlow",
  "NearUnstakingFlow",
  "NearWithdrawingFlow",
  "PolkadotBondFlow",
  "PolkadotRebondFlow",
  "PolkadotUnbondFlow",
  "PolkadotNominateFlow",
  "PolkadotSimpleOperationFlow",
  "XrpEditTag",
  "SolanaEditMemo",
  "SolanaDelegationFlow",
  "StacksEditMemo",
  "CasperEditTransferId",
  "StellarEditMemoValue",
  "StellarEditMemoType",
  "StellarEditCustomFees",
  "StellarAddAssetFlow",
  "TezosDelegationFlow",
  "TezosStakeFlow",
  "TezosUnstakeFlow",
  "TronVoteFlow",
  "TonEditComment",
  "SuiDelegationFlow",
  "SuiUndelegateFlow",
  "CantonOnboard",
  "CantonEditMemo",
  "ConcordiumOnboard",
] as const satisfies ReadonlyArray<keyof typeof FamilyScreens>;

type WallScreenOptions =
  | {
      component: React.ComponentType;
      options: NativeStackNavigationOptions;
    }
  | object;

function isWallActive(
  wall: WallScreenOptions,
): wall is { component: React.ComponentType; options: NativeStackNavigationOptions } {
  return "component" in wall && typeof wall.component === "function";
}

function lazyOrWall({
  name,
  getComponent,
  options,
  listeners,
  wall,
}: {
  name: keyof BaseNavigatorStackParamList;
  getComponent: () => React.ComponentType;
  options?:
    | NativeStackNavigationOptions
    | ((props: { route: RouteProp<BaseNavigatorStackParamList> }) => NativeStackNavigationOptions);
  listeners?: object | ((props: { route: RouteProp<BaseNavigatorStackParamList> }) => object);
  wall: WallScreenOptions;
}) {
  if (isWallActive(wall)) {
    return <Stack.Screen name={name} component={wall.component} options={wall.options} />;
  }

  return (
    <Stack.Screen name={name} getComponent={getComponent} options={options} listeners={listeners} />
  );
}

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
  // The Rewards simulator's design uses the live-app canvas (pure black in Wallet 4.0 dark) for the
  // whole screen — same canvas `getStackNavigationConfigV4` paints from (`theme.colors.bg.canvas`).
  const { theme: lumenTheme } = useLumenTheme();
  const liveAppCanvasColor = lumenTheme.colors.bg.canvas;
  const stackNavigationConfig = useMemo(() => getStackNavigatorConfig(colors, true), [colors]);
  const nativeStackScreenOptions: Partial<NativeStackNavigationOptions> = stackNavigationConfig;
  const noNanoBuyNanoWallScreenOptions = useNoNanoBuyNanoWallScreenOptions();
  const isAccountsEmpty = useSelector(hasNoAccountsSelector);
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector) && isAccountsEmpty;
  const web3hub = useFeature("web3hub");
  const llmAccountListUI = useFeature("llmAccountListUI");
  const swapToEarnFlag = useFeature("swapToEarn");
  const isSwapToEarnEnabled = swapToEarnFlag?.enabled ?? false;
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("mobile");

  return (
    <>
      <RootDrawer drawer={route.params?.drawer} />
      <Stack.Navigator id={BASE_NAVIGATOR_ID} screenOptions={nativeStackScreenOptions}>
        <Stack.Screen name={NavigatorName.Main} component={Main} options={{ headerShown: false }} />
        <Stack.Screen
          name={NavigatorName.MyLedger}
          getComponent={() => require("./MyLedgerNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.MyWallet}
          getComponent={() => require("LLM/features/MyWallet/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.BackupHub}
          getComponent={() => require("LLM/features/BackupHub/Navigator").default}
          options={{ headerShown: false }}
        />

        {web3hub?.enabled ? (
          <Stack.Screen
            name={NavigatorName.Web3HubTab}
            getComponent={() => require("LLM/features/Web3Hub/TabNavigator").default}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name={NavigatorName.Discover}
            getComponent={() => require("./DiscoverNavigator").default}
            options={{ headerShown: false }}
          />
        )}
        <Stack.Screen
          name={NavigatorName.BuyDevice}
          getComponent={() => require("./BuyDeviceNavigator").default}
          options={{
            headerShown: false,
            animation: "slide_from_bottom",
          }}
        />
        {lazyOrWall({
          name: ScreenName.NoDeviceWallScreen,
          getComponent: () => require("~/screens/PostBuyDeviceSetupNanoWallScreen").default,
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={ScreenName.PostBuyDeviceSetupNanoWallScreen}
          getComponent={() => require("~/screens/PostBuyDeviceSetupNanoWallScreen").default}
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
          getComponent={() => require("LLM/features/Reborn/screens/PostBuySuccess").default}
          options={{
            title: t("postBuyDevice.headerTitle"),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.Settings}
          getComponent={() => require("./SettingsNavigator").default}
          options={{ headerShown: false }}
        />
        {lazyOrWall({
          name: ScreenName.CurrencySettings,
          getComponent: () =>
            require("~/screens/Settings/CryptoAssets/Currencies/CurrencySettings").default,
          options: ({ route }) => ({
            title: (route.params as { headerTitle?: string }).headerTitle,
            headerRight: () => null,
          }),
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={ScreenName.EditCurrencyUnits}
          getComponent={() =>
            require("~/screens/Settings/CryptoAssets/Currencies/EditCurrencyUnits").default
          }
          options={{
            title: t("account.settings.accountUnits.title"),
          }}
        />
        {lazyOrWall({
          name: NavigatorName.ReceiveFunds,
          getComponent: () => require("./ReceiveFundsNavigator").default,
          options: { headerShown: false },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={NavigatorName.SendFunds}
          getComponent={() => require("./SendFundsNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.SendFlow}
          getComponent={() => require("LLM/features/Send").default}
          options={{ headerShown: false }}
        />
        {web3hub?.enabled ? (
          <Stack.Screen
            name={NavigatorName.Web3Hub}
            getComponent={() => require("LLM/features/Web3Hub/Navigator").default}
            options={{ headerShown: false }}
          />
        ) : null}
        <Stack.Screen
          name={ScreenName.PlatformApp}
          getComponent={() => require("~/screens/Platform").LiveApp}
          options={{ headerStyle: styles.headerNoShadow }}
        />
        {lazyOrWall({
          name: ScreenName.Recover,
          getComponent: () => require("~/screens/Protect/Player").RecoverPlayer,
          options: { headerStyle: styles.headerNoShadow },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={NavigatorName.SignMessage}
          getComponent={() => require("./SignMessageNavigator").default}
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
          getComponent={() => require("./SignTransactionNavigator").default}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              route.params.onError(new Error("Signature interrupted by user"));
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.SignRawTransaction}
          getComponent={() => require("./SignRawTransactionNavigator").default}
          options={{ headerShown: false }}
          listeners={({ route }) => ({
            beforeRemove: () => {
              route.params.onError(new Error("Signature interrupted by user"));
            },
          })}
        />
        <Stack.Screen
          name={NavigatorName.Swap}
          getComponent={() => require("./SwapNavigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.SwapSubScreens}
          getComponent={() => require("./SwapSubScreensNavigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.Perps}
          getComponent={() => require("./PerpsNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.GlobalSearch}
          getComponent={() => require("LLM/features/GlobalSearch/Navigator").default}
          options={{ headerShown: false, animation: "fade" }}
        />
        <Stack.Screen
          name={NavigatorName.Freeze}
          getComponent={() => require("./FreezeNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Unfreeze}
          getComponent={() => require("./UnfreezeNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.ClaimRewards}
          getComponent={() => require("./ClaimRewardsNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Fees}
          getComponent={() => require("./FeesNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.RequestAccount}
          getComponent={() => require("./RequestAccountNavigator").default}
          options={{
            headerShown: false,
          }}
          listeners={({ route }) => ({
            beforeRemove: () => handleOnClose(route),
          })}
        />
        <Stack.Screen
          name={ScreenName.VerifyAccount}
          getComponent={() => require("~/screens/VerifyAccount").default}
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
          getComponent={() =>
            (require("LLM/features/Card") as typeof import("LLM/features/Card"))
              .CardLiveAppNavigator
          }
          options={{ headerShown: false }}
        />
        {lazyOrWall({
          name: NavigatorName.Exchange,
          getComponent: () => require("./ExchangeLiveAppNavigator").default,
          options: { headerShown: false },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        {lazyOrWall({
          name: NavigatorName.PlatformExchange,
          getComponent: () => require("./PlatformExchangeNavigator").default,
          options: { headerShown: false },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        {lazyOrWall({
          name: NavigatorName.CustomError,
          getComponent: () => require("./CustomErrorNavigator").default,
          options: { title: "" },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={ScreenName.OperationDetails}
          getComponent={() => require("~/screens/OperationDetails").default}
          options={{
            headerTitle: OperationDetailsHeaderTitle,
            headerLeft: OperationDetailsHeaderLeft,
            headerRight: OperationDetailsHeaderRight,
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen
          name={NavigatorName.AccountSettings}
          getComponent={() => require("./AccountSettingsNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.EditDeviceName}
          getComponent={() => require("~/screens/EditDeviceName").default}
          options={{
            title: t("EditDeviceName.title"),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.PasswordAddFlow}
          getComponent={() => require("./PasswordAddFlowNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.PasswordModifyFlow}
          getComponent={() => require("./PasswordModifyFlowNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.AnalyticsOperations}
          getComponent={() => require("~/screens/Analytics/Operations").default}
          options={{
            title: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={NavigatorName.WalletSync}
          getComponent={() => require("LLM/features/WalletSync/WalletSyncNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.LedgerSyncDeepLinkHandler}
          getComponent={() =>
            require("LLM/features/WalletSync/LedgerSyncDeepLinkHandler").LedgerSyncDeepLinkHandler
          }
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.MarketList}
          getComponent={() =>
            shouldDisplayAssetDiscoverability
              ? require("LLM/features/Market/screens/MarketScreen").default
              : require("LLM/features/Market/screens/MarketList").default
          }
          options={() => {
            if (shouldDisplayAssetDiscoverability) {
              const { getStackNavigationConfigV4 } =
                require("LLM/components/Navigation") as typeof import("LLM/components/Navigation");
              return {
                ...getStackNavigationConfigV4(lumenTheme),
                title: t("market.title"),
                headerLeft: undefined,
                headerRight: () => null,
              };
            }
            const { MarketListHeaderTitle, MarketListHeaderLeft } =
              require("LLM/features/Market/components/MarketListHeader") as typeof import("LLM/features/Market/components/MarketListHeader");
            return {
              title: t("market.title"),
              headerShown: true,
              headerTitle: MarketListHeaderTitle,
              headerTransparent: true,
              headerLeft: MarketListHeaderLeft,
              headerRight: () => null,
            };
          }}
        />
        <Stack.Screen
          name={ScreenName.MarketCurrencySelect}
          getComponent={() => require("LLM/features/Market/screens/MarketCurrencySelect").default}
          options={{
            title: t("market.filters.currency"),
            headerLeft: () => null,
          }}
        />
        <Stack.Screen
          name={ScreenName.MarketDetail}
          getComponent={() => require("LLM/features/Market/screens/MarketDetail").default}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name={ScreenName.PortfolioOperationHistory}
          getComponent={() => require("~/screens/Portfolio/PortfolioHistory").default}
          options={{
            headerTitle: t("analytics.operations.title"),
            headerRight: () => null,
          }}
        />
        <Stack.Screen
          name={ScreenName.Account}
          getComponent={() =>
            readOnlyModeEnabled
              ? require("~/screens/Account/ReadOnly/ReadOnlyAccount").default
              : require("~/screens/Account").default
          }
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.ScanRecipient}
          getComponent={() => require("~/screens/SendFunds/ScanRecipient").default}
          options={{
            ...TransparentHeaderNavigationOptions,
            title: t("send.scan.title"),
            headerRight: ScanRecipientHeaderRight,
            headerLeft: renderNullHeader,
          }}
        />
        {lazyOrWall({
          name: NavigatorName.WalletConnect,
          getComponent: () => require("./WalletConnectLiveAppNavigator").default,
          options: { headerShown: false },
          wall: noNanoBuyNanoWallScreenOptions,
        })}
        <Stack.Screen
          name={NavigatorName.NotificationCenter}
          getComponent={() => require("./NotificationCenterNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.Accounts}
          getComponent={() => require("./AccountsNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.CustomImage}
          getComponent={() => require("./CustomImageNavigator").default}
          options={{ headerShown: false }}
        />
        {FAMILY_SCREEN_NAMES.map(name => {
          const screenName = name as keyof BaseNavigatorStackParamList;
          return (
            <Stack.Screen
              key={name}
              name={screenName}
              getComponent={() => {
                const families = require("~/families") as typeof FamilyScreens;
                return families[name].component as React.ComponentType;
              }}
              options={() => {
                const families = require("~/families") as typeof FamilyScreens;
                return (families[name] as { options?: NativeStackNavigationOptions }).options ?? {};
              }}
            />
          );
        })}
        <Stack.Screen
          name={ScreenName.BleDevicePairingFlow}
          getComponent={() => require("~/screens/BleDevicePairingFlow").BleDevicePairingFlow}
          options={() =>
            (
              require("~/screens/BleDevicePairingFlow") as typeof import("~/screens/BleDevicePairingFlow")
            ).bleDevicePairingFlowHeaderOptions
          }
        />
        <Stack.Screen
          name={NavigatorName.PostOnboarding}
          options={{ headerShown: false }}
          getComponent={() => require("./PostOnboardingNavigator").default}
        />
        <Stack.Screen
          name={ScreenName.DeviceConnect}
          getComponent={() => require("~/screens/DeviceConnect").default}
          options={() =>
            (
              require("~/screens/DeviceConnect") as typeof import("~/screens/DeviceConnect")
            ).deviceConnectHeaderOptions(t)
          }
          listeners={({ route }) => ({
            beforeRemove: () => handleOnClose(route),
          })}
        />
        <Stack.Screen
          name={ScreenName.PerpsSign}
          getComponent={() =>
            require("LLM/features/Perps/screens/PerpsSign/PerpsSignScreen").default
          }
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={ScreenName.RedirectToOnboardingRecoverFlow}
          options={{ ...TransparentHeaderNavigationOptions, title: "" }}
          getComponent={() =>
            require("~/screens/Protect/RedirectToOnboardingRecoverFlow")
              .RedirectToOnboardingRecoverFlowScreen
          }
        />
        <Stack.Screen
          name={NavigatorName.Earn}
          getComponent={() => require("./EarnLiveAppNavigator").default}
          options={props =>
            getEarnScreenOptionsFromRouteParams(
              props.route?.params?.params,
              t,
              liveAppCanvasColor,
              isSwapToEarnEnabled,
            )
          }
        />
        <Stack.Screen
          name={NavigatorName.Borrow}
          getComponent={() => require("./BorrowLiveAppNavigator").default}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name={NavigatorName.NoFundsFlow}
          getComponent={() => require("./NoFundsFlowNavigator").default}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: FlowHeaderCloseButton,
            headerLeft: renderNullHeader,
          }}
        />
        <Stack.Screen
          name={NavigatorName.StakeFlow}
          getComponent={() => require("./StakeFlowNavigator").default}
          options={{
            ...TransparentHeaderNavigationOptions,
            headerRight: FlowHeaderCloseButton,
            headerLeft: renderNullHeader,
          }}
        />
        <Stack.Screen
          name={NavigatorName.EvmEditTransaction}
          options={{ headerShown: false }}
          getComponent={() =>
            require("~/families/evm/EditTransactionFlow/EditTransactionNavigator").default
          }
        />
        <Stack.Screen
          name={NavigatorName.BitcoinEditTransaction}
          options={{ headerShown: false }}
          getComponent={() =>
            require("~/families/bitcoin/EditTransactionFlow/EditTransactionNavigator").default
          }
        />
        <Stack.Screen
          name={NavigatorName.AnalyticsOptInPrompt}
          options={{ headerShown: false }}
          getComponent={() => require("./AnalyticsOptInPromptNavigator").default}
        />
        <Stack.Screen
          name={NavigatorName.LandingPages}
          options={{ headerShown: false }}
          getComponent={() => require("./LandingPagesNavigator").default}
        />
        <Stack.Screen
          name={ScreenName.FirmwareUpdate}
          getComponent={() => require("~/screens/FirmwareUpdate").default}
          options={{
            gestureEnabled: false,
            headerTitle: FirmwareUpdateHeaderTitle,
            title: "",
            headerLeft: FirmwareUpdateHeaderLeft,
            headerRight: FirmwareUpdateHeaderRight,
          }}
        />
        <Stack.Screen
          name={NavigatorName.AddAccounts}
          getComponent={() => require("LLM/features/Accounts/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.DeviceSelection}
          getComponent={() => require("LLM/features/DeviceSelection/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={ScreenName.DeeplinkInstallAppDeviceSelection}
          getComponent={() => require("LLM/features/DeeplinkInstallApp").DeviceSelectionScreen}
          options={{ headerShown: false }}
        />

        {llmAccountListUI?.enabled && (
          <Stack.Screen
            name={NavigatorName.Assets}
            getComponent={() => require("LLM/features/Assets/Navigator").default}
            options={{ headerShown: false }}
          />
        )}

        <Stack.Screen
          name={NavigatorName.AssetDetail}
          getComponent={() => require("LLM/features/AssetDetail/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.Analytics}
          getComponent={() => require("LLM/features/Analytics/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={NavigatorName.OperationsHistory}
          getComponent={() => require("LLM/features/OperationsHistory/Navigator").default}
          options={{ headerShown: false }}
        />

        <Stack.Screen
          name={ScreenName.LiveAppModal}
          getComponent={() => require("LLM/features/LiveAppModal").default}
          options={{
            headerShown: false,
            gestureEnabled: true,
          }}
        />
      </Stack.Navigator>
    </>
  );
}

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

function isRouteWithCloseCallback(params: object): params is Readonly<WithCloseCallback> {
  return "onClose" in params && typeof params.onClose === "function";
}

function isNestedRouteWithCloseCallback(params: object): params is { params: WithCloseCallback } {
  if (!("params" in params)) return false;
  const nestedParams = params.params;
  if (nestedParams == null) return false;
  return isRouteWithCloseCallback(nestedParams);
}

type WithCloseCallback = { onClose: () => void };
