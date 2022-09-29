import { Operation } from "@ledgerhq/types-live";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "../../../const";
import { BleDevicePairingFlowParams } from "../../../screens/BleDevicePairingFlow";
import { MainNavigatorParamList } from "../types";
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
import { LendingInfoNavigatorParamList } from "./LendingInfoNavigator";
import { PlatformExchangeNavigatorParamList } from "./PlatformExchangeNavigator";

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]: CompositeScreenProps<
    StackScreenProps<{ [NavigatorName.Main]: { hideTabNavigation?: boolean } }>,
    BottomTabScreenProps<MainNavigatorParamList>
  >;
  [NavigatorName.BuyDevice]: undefined;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;

  [ScreenName.PostBuyDeviceScreen]: undefined;
  [ScreenName.PlatformApp]: {
    platform: string;
    name: string;
    [key: string]: string;
  };
  [ScreenName.Learn]: undefined;
  [ScreenName.SwapV2FormSelectAccount]: undefined;
  [ScreenName.SwapOperationDetails]: undefined;
  [ScreenName.SwapV2FormSelectCurrency]: undefined;
  [ScreenName.SwapFormSelectProviderRate]: undefined;
  [ScreenName.SwapV2FormSelectFees]: undefined;
  [ScreenName.VerifyAccount]: undefined;
  [ScreenName.OperationDetails]: {
    accountId?: string;
    parentId?: string;
    operation: Operation;
    disableAllLinks?: boolean;
    isSubOperation?: boolean;
    key?: string;
  };
  [ScreenName.PairDevices]: undefined;
  [ScreenName.EditDeviceName]: undefined;
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.PortfolioOperationHistory]: undefined;
  [ScreenName.Account]: {
    accountId: string;
    parentId?: string;
  };
  [ScreenName.ScanRecipient]: undefined;
  [ScreenName.WalletConnectScan]: undefined;
  [ScreenName.WalletConnectDeeplinkingSelectAccount]: undefined;
  [ScreenName.WalletConnectConnect]: undefined;
  [ScreenName.FallbackCameraSend]: undefined;
  [ScreenName.BleDevicePairingFlow]: BleDevicePairingFlowParams;
  [ScreenName.AnalyticsAllocation]: undefined;
  [ScreenName.AnalyticsOperations]: {
    accountsIds: string[];
  };

  [NavigatorName.Settings]: NavigatorScreenParams<SettingsNavigatorStackParamList>;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<ReceiveFundsStackParamList>;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList>;
  [NavigatorName.SignTransaction]: NavigatorScreenParams<SignTransactionNavigatorParamList>;
  [NavigatorName.Swap]: NavigatorScreenParams<SwapNavigatorParamList>;
  [NavigatorName.Lending]: NavigatorScreenParams<LendingNavigatorParamList>;
  [NavigatorName.LendingInfo]: NavigatorScreenParams<LendingInfoNavigatorParamList>;
  [NavigatorName.LendingEnableFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingSupplyFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingWithdrawFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.Freeze]: NavigatorScreenParams<undefined>;
  [NavigatorName.Unfreeze]: NavigatorScreenParams<undefined>;
  [NavigatorName.ClaimRewards]: NavigatorScreenParams<undefined>;
  [NavigatorName.AddAccounts]: NavigatorScreenParams<undefined>;
  [NavigatorName.RequestAccount]: NavigatorScreenParams<undefined>;
  [NavigatorName.FirmwareUpdate]: NavigatorScreenParams<undefined>;
  [NavigatorName.Exchange]: NavigatorScreenParams<undefined>;
  [NavigatorName.ProviderList]: NavigatorScreenParams<undefined>;
  [NavigatorName.ProviderView]: NavigatorScreenParams<undefined>;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<undefined>;
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<PlatformExchangeNavigatorParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<ImportAccountsNavigatorParamList>;
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<PasswordModifyFlowParamList>;
  [NavigatorName.MigrateAccountsFlow]: NavigatorScreenParams<MigrateAccountsNavigatorParamList>;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<NftNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
};
