import type { Operation, AccountLike } from "@ledgerhq/types-live";
import type { NavigatorScreenParams } from "@react-navigation/native";
import type { RampCatalogEntry } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/types";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { PropertyPath } from "lodash";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { NavigatorName, ScreenName } from "../../../const";
import type { LendingNavigatorParamList } from "./LendingNavigator";
import type { AccountSettingsNavigatorParamList } from "./AccountSettingsNavigator";
import type { AccountsNavigatorParamList } from "./AccountsNavigator";
import type { ImportAccountsNavigatorParamList } from "./ImportAccountsNavigator";
import type { MigrateAccountsNavigatorParamList } from "./MigrateAccountsFlowNavigator";
import type { NftNavigatorParamList } from "./NftNavigator";
import type { NotificationCenterNavigatorParamList } from "./NotificationCenterNavigator";
import type { PasswordAddFlowParamList } from "./PasswordAddFlowNavigator";
import type { PasswordModifyFlowParamList } from "./PasswordModifyFlowNavigator";
import type { ReceiveFundsStackParamList } from "./ReceiveFundsNavigator";
import type { SendFundsNavigatorStackParamList } from "./SendFundsNavigator";
import type { SettingsNavigatorStackParamList } from "./SettingsNavigator";
import type { SignMessageNavigatorStackParamList } from "./SignMessageNavigator";
import type { SignTransactionNavigatorParamList } from "./SignTransactionNavigator";
import type { SwapNavigatorParamList } from "./SwapNavigator";
import type { LendingInfoNavigatorParamList } from "./LendingInfoNavigator";
import type { PlatformExchangeNavigatorParamList } from "./PlatformExchangeNavigator";
import type { ExchangeStackNavigatorParamList } from "./ExchangeStackNavigator";
import type { ExchangeNavigatorParamList } from "./ExchangeNavigator";
import type { ExchangeLiveAppNavigatorParamList } from "./ExchangeLiveAppNavigator";
import type { FirmwareUpdateNavigatorParamList } from "./FirmwareUpdateNavigator";
import type { RequestAccountNavigatorParamList } from "./RequestAccountNavigator";
import type { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import type { LendingEnableFlowParamsList } from "./LendingEnableFlowNavigator";
import type { LendingSupplyFlowNavigatorParamList } from "./LendingSupplyFlowNavigator";
import type { LendingWithdrawFlowNavigatorParamList } from "./LendingWithdrawFlowNavigator";
import type { ClaimRewardsNavigatorParamList } from "./ClaimRewardsNavigator";
import type { UnfreezeNavigatorParamList } from "./UnfreezeNavigator";
import type { FreezeNavigatorParamList } from "./FreezeNavigator";
import type { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import type { MainNavigatorParamList } from "./MainNavigator";
import type { WalletConnectNavigatorParamList } from "./WalletConnectNavigator";
import type { WalletConnectLiveAppNavigatorParamList } from "./WalletConnectLiveAppNavigator";
import { SwapRouteParams } from "../../../screens/Swap/types";
import { PostOnboardingNavigatorParamList } from "./PostOnboardingNavigator";
import { CustomImageNavigatorParamList } from "./CustomImageNavigator";

type TradeParams = {
  type: "onRamp" | "offRamp";
  cryptoCurrencyId: string;
  fiatCurrencyId: string;
  fiatAmount?: number;
  cryptoAmount?: number;
};

export type NavigateInput<
  T extends keyof BaseNavigatorStackParamList = keyof BaseNavigatorStackParamList,
> = {
  name: T;
  params: BaseNavigatorStackParamList[T] | undefined;
};

export type PathToDeviceParam = PropertyPath;
export type NavigationType = "navigate" | "replace";

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]: NavigatorScreenParams<MainNavigatorParamList> & {
    hideTabNavigation?: boolean;
  };
  [NavigatorName.BuyDevice]: NavigatorScreenParams<BuyDeviceNavigatorParamList>;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;

  [ScreenName.PostBuyDeviceScreen]: undefined;
  [ScreenName.PlatformApp]: {
    platform?: string;
    name?: string;
    mode?: string;
    currency?: string;
    account?: string;
    defaultAccountId?: string;
    defaultCurrencyId?: string;
    defaultTicker?: string;
  };
  [ScreenName.Learn]: undefined;
  [ScreenName.SwapV2FormSelectAccount]: SwapRouteParams;
  [ScreenName.SwapOperationDetails]: {
    swapOperation: MappedSwapOperation;
  };
  [ScreenName.SwapV2FormSelectCurrency]: SwapRouteParams;
  [ScreenName.SwapFormSelectProviderRate]: SwapRouteParams;
  [ScreenName.SwapV2FormSelectFees]: SwapRouteParams;
  [ScreenName.VerifyAccount]: {
    accountId: string;
    parentId: string;
    title: string;
    account: AccountLike;
    onSuccess: (_: AccountLike) => void;
    onError: (_: Error) => void;
    onClose: () => void;
  };
  [ScreenName.OperationDetails]: {
    accountId?: string;
    parentId?: string | null;
    operation: Operation;
    disableAllLinks?: boolean;
    isSubOperation?: boolean;
    key?: string;
  };
  [ScreenName.PairDevices]: {
    onDone?: (_: Device) => void;
    hasError?: boolean;
  };
  [ScreenName.EditDeviceName]: {
    deviceId: string;
    deviceName: string;
  };
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.PortfolioOperationHistory]: undefined;
  [ScreenName.Account]: {
    account?: AccountLike;
    accountId?: string;
    parentId?: string;
    currencyId?: string;
    currencyType?: "CryptoCurrency" | "TokenCurrency";
  };
  [ScreenName.ScanRecipient]: {
    accountId?: string;
    parentId?: string;
    transaction?: Transaction;
    justScanned?: boolean;
  };
  [ScreenName.FallbackCameraSend]: {
    screenName: keyof BaseNavigatorStackParamList;
  };
  [ScreenName.BleDevicePairingFlow]: {
    filterByDeviceModelId?: DeviceModelId;
    areKnownDevicesDisplayed?: boolean;
    onSuccessAddToKnownDevices?: boolean;
    navigationType?: NavigationType;
    onSuccessNavigateToConfig: {
      navigateInput: NavigateInput;
      pathToDeviceParam: PathToDeviceParam;
    };
  };
  [ScreenName.AnalyticsAllocation]: undefined;
  [ScreenName.AnalyticsOperations]: {
    accountsIds: string[];
  };
  [ScreenName.ProviderList]: {
    accountId: string;
    accountAddress: string;
    currency: CryptoCurrency | TokenCurrency;
    type: "onRamp" | "offRamp";
  };
  [ScreenName.ProviderView]: {
    provider: RampCatalogEntry;
    accountId: string;
    accountAddress: string;
    trade: TradeParams;
    icon?: string | null;
    name?: string | null;
  };
  [ScreenName.CurrencySettings]: {
    currencyId: string;
    headerTitle?: string | undefined;
  };
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };

  [NavigatorName.Settings]: NavigatorScreenParams<SettingsNavigatorStackParamList>;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<ReceiveFundsStackParamList>;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList>;
  [NavigatorName.SignTransaction]: NavigatorScreenParams<SignTransactionNavigatorParamList>;
  [NavigatorName.Swap]: NavigatorScreenParams<SwapNavigatorParamList>;
  [NavigatorName.Lending]: NavigatorScreenParams<LendingNavigatorParamList>;
  [NavigatorName.LendingInfo]: NavigatorScreenParams<LendingInfoNavigatorParamList>;
  [NavigatorName.LendingEnableFlow]: NavigatorScreenParams<LendingEnableFlowParamsList>;
  [NavigatorName.LendingSupplyFlow]: NavigatorScreenParams<LendingSupplyFlowNavigatorParamList>;
  [NavigatorName.LendingWithdrawFlow]: NavigatorScreenParams<LendingWithdrawFlowNavigatorParamList>;
  [NavigatorName.Freeze]: NavigatorScreenParams<FreezeNavigatorParamList>;
  [NavigatorName.Unfreeze]: NavigatorScreenParams<UnfreezeNavigatorParamList>;
  [NavigatorName.ClaimRewards]: NavigatorScreenParams<ClaimRewardsNavigatorParamList>;
  [NavigatorName.AddAccounts]: NavigatorScreenParams<AddAccountsNavigatorParamList> & {
    currency?: CryptoCurrency | TokenCurrency;
    token?: TokenCurrency;
    returnToSwap?: boolean;
    analyticsPropertyFlow?: string;
  };
  [NavigatorName.RequestAccount]: NavigatorScreenParams<RequestAccountNavigatorParamList> & {
    onError?: (_: Error) => void;
    error?: Error;
  };
  [NavigatorName.FirmwareUpdate]: NavigatorScreenParams<FirmwareUpdateNavigatorParamList>;
  [NavigatorName.Exchange]:
    | NavigatorScreenParams<ExchangeLiveAppNavigatorParamList>
    | NavigatorScreenParams<ExchangeNavigatorParamList>;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<ExchangeStackNavigatorParamList> & {
    mode: "buy" | "sell";
  };
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<PlatformExchangeNavigatorParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<PasswordModifyFlowParamList>;
  [NavigatorName.MigrateAccountsFlow]: NavigatorScreenParams<MigrateAccountsNavigatorParamList>;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<NftNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
  [NavigatorName.WalletConnect]: NavigatorScreenParams<
    WalletConnectNavigatorParamList | WalletConnectLiveAppNavigatorParamList
  >;
  [NavigatorName.CustomImage]: NavigatorScreenParams<CustomImageNavigatorParamList>;
  [NavigatorName.PostOnboarding]: NavigatorScreenParams<PostOnboardingNavigatorParamList>;
};
