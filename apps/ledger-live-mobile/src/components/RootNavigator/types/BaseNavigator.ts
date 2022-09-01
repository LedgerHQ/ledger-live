import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import {
  CompositeScreenProps,
  NavigatorScreenParams,
} from "@react-navigation/native";
import { StackScreenProps } from "@react-navigation/stack";
import { NavigatorName, ScreenName } from "../../../const";
import { BleDevicePairingFlowParams } from "../../../screens/BleDevicePairingFlow";
import { SettingsNavigatorStackParamList } from "../SettingsNavigator";
import {
  AccountSettingsNavigatorParamList,
  MainNavigatorParamList,
} from "../types";
import { AccountsNavigatorParamList } from "./AccountsNavigator";
import { AnalyticsNavigatorParamList } from "./AnalyticsNavigator";
import { NftNavigatorParamList } from "./NftNavigator";
import { NotificationCenterNavigatorParamList } from "./NotificationCenterNavigator";
import { ReceiveFundsStackParamList } from "./ReceiveFundsNavigator";
import { SendFundsNavigatorStackParamList } from "./SendFundsNavigator";
import { SignMessageNavigatorStackParamList } from "./SignMessageNavigator";

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]: CompositeScreenProps<
    StackScreenProps<{ [NavigatorName.Main]: { hideTabNavigation?: boolean } }>,
    BottomTabScreenProps<MainNavigatorParamList>
  >;
  [NavigatorName.BuyDevice]: undefined;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;

  [ScreenName.PostBuyDeviceScreen]: undefined;
  [ScreenName.PlatformApp]: undefined;
  [ScreenName.Learn]: undefined;
  [ScreenName.SwapV2FormSelectAccount]: undefined;
  [ScreenName.SwapOperationDetails]: undefined;
  [ScreenName.SwapV2FormSelectCurrency]: undefined;
  [ScreenName.SwapFormSelectProviderRate]: undefined;
  [ScreenName.SwapV2FormSelectFees]: undefined;
  [ScreenName.VerifyAccount]: undefined;
  [ScreenName.OperationDetails]: undefined;
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

  [NavigatorName.Settings]: NavigatorScreenParams<SettingsNavigatorStackParamList>;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<ReceiveFundsStackParamList>;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList>;
  [NavigatorName.SignTransaction]: NavigatorScreenParams<undefined>;
  [NavigatorName.Swap]: NavigatorScreenParams<undefined>;
  [NavigatorName.Lending]: NavigatorScreenParams<undefined>;
  [NavigatorName.LendingInfo]: NavigatorScreenParams<undefined>;
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
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<undefined>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.ImportAccounts]: NavigatorScreenParams<undefined>;
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.PasswordModifyFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.MigrateAccountsFlow]: NavigatorScreenParams<undefined>;
  [NavigatorName.Analytics]: NavigatorScreenParams<AnalyticsNavigatorParamList>;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<NftNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
};

export type BaseNavigatorStackScreenProps<
  RouteName extends keyof BaseNavigatorStackParamList = keyof BaseNavigatorStackParamList,
> = StackScreenProps<BaseNavigatorStackParamList, RouteName>;
