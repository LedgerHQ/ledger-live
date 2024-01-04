import type { Operation, AccountLike, Account, DeviceInfo } from "@ledgerhq/types-live";
import type { NavigatorScreenParams, ParamListBase } from "@react-navigation/native";
import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { DeviceModelId } from "@ledgerhq/types-devices";
import type { PropertyPath } from "lodash";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { MappedSwapOperation } from "@ledgerhq/live-common/exchange/swap/types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { NavigatorName, ScreenName } from "~/const";
import type { AccountSettingsNavigatorParamList } from "./AccountSettingsNavigator";
import type { AccountsNavigatorParamList } from "./AccountsNavigator";
import type { ImportAccountsNavigatorParamList } from "./ImportAccountsNavigator";
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
import type { EarnLiveAppNavigatorParamList } from "./EarnLiveAppNavigator";
import type { PlatformExchangeNavigatorParamList } from "./PlatformExchangeNavigator";
import type { ExchangeStackNavigatorParamList } from "./ExchangeStackNavigator";
import type { ExchangeLiveAppNavigatorParamList } from "./ExchangeLiveAppNavigator";
import type { RequestAccountNavigatorParamList } from "./RequestAccountNavigator";
import type { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import type { ClaimRewardsNavigatorParamList } from "./ClaimRewardsNavigator";
import type { UnfreezeNavigatorParamList } from "./UnfreezeNavigator";
import type { FreezeNavigatorParamList } from "./FreezeNavigator";
import type { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import type { MainNavigatorParamList } from "./MainNavigator";
import type { WalletConnectLiveAppNavigatorParamList } from "./WalletConnectLiveAppNavigator";
import type { PostOnboardingNavigatorParamList } from "./PostOnboardingNavigator";
import type { CustomImageNavigatorParamList } from "./CustomImageNavigator";
import type { ClaimNftNavigatorParamList } from "./ClaimNftNavigator";
import type { PolkadotSimpleOperationFlowParamList } from "../../../families/polkadot/SimpleOperationFlow/types";
import type { PolkadotNominateFlowParamList } from "../../../families/polkadot/NominateFlow/types";
import type { PolkadotUnbondFlowParamList } from "../../../families/polkadot/UnbondFlow/type";
import type { PolkadotRebondFlowParamList } from "../../../families/polkadot/RebondFlow/type";
import type { PolkadotBondFlowParamList } from "../../../families/polkadot/BondFlow/types";
import type { AlgorandClaimRewardsFlowParamList } from "../../../families/algorand/Rewards/ClaimRewardsFlow/type";
import type { AlgorandOptInFlowParamList } from "../../../families/algorand/OptInFlow/types";
import type { CeloWithdrawFlowParamList } from "../../../families/celo/WithdrawFlow/types";
import type { CeloRevokeFlowFlowParamList } from "../../../families/celo/RevokeFlow/types";
import type { CeloActivateFlowParamList } from "../../../families/celo/ActivateFlow/types";
import type { CeloVoteFlowParamList } from "../../../families/celo/VoteFlow/types";
import type { CeloUnlockFlowParamList } from "../../../families/celo/UnlockFlow/types";
import type { CeloLockFlowParamList } from "../../../families/celo/LockFlow/types";
import type { CeloRegistrationFlowParamList } from "../../../families/celo/RegistrationFlow/types";
import type { CosmosDelegationFlowParamList } from "../../../families/cosmos/DelegationFlow/types";
import type { CosmosRedelegationFlowParamList } from "../../../families/cosmos/RedelegationFlow/types";
import type { CosmosUndelegationFlowParamList } from "../../../families/cosmos/UndelegationFlow/types";
import type { CosmosClaimRewardsFlowParamList } from "../../../families/cosmos/ClaimRewardsFlow/types";
import type { SolanaDelegationFlowParamList } from "../../../families/solana/DelegationFlow/types";
import type { StellarAddAssetFlowParamList } from "../../../families/stellar/AddAssetFlow/types";
import type { TezosDelegationFlowParamList } from "../../../families/tezos/DelegationFlow/types";
import type { EditTransactionParamList } from "../../../families/evm/EditTransactionFlow/EditTransactionParamList";
import type { TronVoteFlowParamList } from "../../../families/tron/VoteFlow/types";
import type { NoFundsNavigatorParamList } from "./NoFundsNavigator";
import type { StakeNavigatorParamList } from "./StakeNavigator";
import type { ExploreTabNavigatorStackParamList } from "./ExploreTabNavigator";

export type NavigateInput<
  ParamList extends ParamListBase = ParamListBase,
  T extends keyof ParamList = keyof ParamList,
> = {
  name: T;
  params: ParamList[T];
};

export type PathToDeviceParam = PropertyPath;
export type NavigationType = "navigate" | "replace" | "push";

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]:
    | (NavigatorScreenParams<MainNavigatorParamList> & {
        hideTabNavigation?: boolean;
      })
    | undefined;
  [NavigatorName.BuyDevice]: NavigatorScreenParams<BuyDeviceNavigatorParamList> | undefined;
  [ScreenName.NoDeviceWallScreen]: undefined;
  [ScreenName.PostBuyDeviceSetupNanoWallScreen]: undefined;

  [ScreenName.PostBuyDeviceScreen]: undefined;
  [ScreenName.PlatformApp]: {
    platform?: string;
    name?: string;
    mode?: string;
    currency?: string;
    account?: string;
    accountId?: string;
    defaultAccountId?: string;
    defaultCurrencyId?: string;
    defaultTicker?: string;
    customDappURL?: string;
  };
  [ScreenName.Recover]: {
    platform?: string;
    device?: Device;
    fromOnboarding?: boolean;
    name?: string;
    source?: string;
    redirectTo?: string;
    callback?: string;
    date?: string; // used to reload the webview in case of multiple restore in a row
  };
  [ScreenName.LearnWebView]: {
    uri?: string;
  };
  [ScreenName.SwapOperationDetails]: {
    swapOperation: MappedSwapOperation;
  };
  [ScreenName.VerifyAccount]: {
    account: AccountLike;
    accountId?: string;
    parentId?: string;
    title?: string;
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
    onDone?: ((_: Device) => void) | null;
    hasError?: boolean;
    deviceModelIds?: DeviceModelId[];
  };
  [ScreenName.EditDeviceName]: {
    device: Device;
    deviceName: string;
    deviceInfo: DeviceInfo;
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
  [ScreenName.BleDevicePairingFlow]: undefined;
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

  [ScreenName.CurrencySettings]: {
    currencyId: string;
    headerTitle?: string | undefined;
  };
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };

  [NavigatorName.Settings]: NavigatorScreenParams<SettingsNavigatorStackParamList>;
  [NavigatorName.ReceiveFunds]: NavigatorScreenParams<ReceiveFundsStackParamList> | undefined;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList> & {
    onClose?: () => void;
  };
  [NavigatorName.SignTransaction]: NavigatorScreenParams<SignTransactionNavigatorParamList>;
  [NavigatorName.Swap]: NavigatorScreenParams<SwapNavigatorParamList> | undefined;
  [NavigatorName.Earn]: NavigatorScreenParams<EarnLiveAppNavigatorParamList> | undefined;
  [NavigatorName.Freeze]: NavigatorScreenParams<FreezeNavigatorParamList>;
  [NavigatorName.Unfreeze]: NavigatorScreenParams<UnfreezeNavigatorParamList>;
  [NavigatorName.ClaimRewards]: NavigatorScreenParams<ClaimRewardsNavigatorParamList>;
  [NavigatorName.AddAccounts]:
    | (Partial<NavigatorScreenParams<AddAccountsNavigatorParamList>> & {
        currency?: CryptoCurrency | TokenCurrency | null;
        token?: TokenCurrency;
        returnToSwap?: boolean;
        analyticsPropertyFlow?: string;
        onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
        onError?: (_: Error) => void;
      })
    | undefined;
  [NavigatorName.RequestAccount]: NavigatorScreenParams<RequestAccountNavigatorParamList> & {
    onClose?: () => void;
  };
  [NavigatorName.Exchange]: NavigatorScreenParams<ExchangeLiveAppNavigatorParamList> | undefined;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<ExchangeStackNavigatorParamList> & {
    mode?: "buy" | "sell";
  };
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<PlatformExchangeNavigatorParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.ImportAccounts]:
    | NavigatorScreenParams<ImportAccountsNavigatorParamList>
    | undefined;
  [NavigatorName.PasswordAddFlow]: NavigatorScreenParams<PasswordAddFlowParamList> | undefined;
  [NavigatorName.PasswordModifyFlow]:
    | NavigatorScreenParams<PasswordModifyFlowParamList>
    | undefined;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<NftNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
  [NavigatorName.WalletConnect]: NavigatorScreenParams<WalletConnectLiveAppNavigatorParamList>;
  [NavigatorName.CustomImage]: NavigatorScreenParams<CustomImageNavigatorParamList>;
  [NavigatorName.ClaimNft]: NavigatorScreenParams<ClaimNftNavigatorParamList>;
  [NavigatorName.PostOnboarding]: NavigatorScreenParams<PostOnboardingNavigatorParamList>;

  // Polkadot
  [NavigatorName.PolkadotSimpleOperationFlow]: NavigatorScreenParams<PolkadotSimpleOperationFlowParamList>;
  [NavigatorName.PolkadotNominateFlow]: NavigatorScreenParams<PolkadotNominateFlowParamList>;
  [NavigatorName.PolkadotUnbondFlow]: NavigatorScreenParams<PolkadotUnbondFlowParamList>;
  [NavigatorName.PolkadotRebondFlow]: NavigatorScreenParams<PolkadotRebondFlowParamList>;
  [NavigatorName.PolkadotBondFlow]: NavigatorScreenParams<PolkadotBondFlowParamList>;

  // Algorand
  [NavigatorName.AlgorandClaimRewardsFlow]: NavigatorScreenParams<AlgorandClaimRewardsFlowParamList>;
  [NavigatorName.AlgorandOptInFlow]: NavigatorScreenParams<AlgorandOptInFlowParamList>;

  // Celo
  [NavigatorName.CeloWithdrawFlow]: NavigatorScreenParams<CeloWithdrawFlowParamList>;
  [NavigatorName.CeloRevokeFlow]: NavigatorScreenParams<CeloRevokeFlowFlowParamList>;
  [NavigatorName.CeloActivateFlow]: NavigatorScreenParams<CeloActivateFlowParamList>;
  [NavigatorName.CeloVoteFlow]: NavigatorScreenParams<CeloVoteFlowParamList>;
  [NavigatorName.CeloUnlockFlow]: NavigatorScreenParams<CeloUnlockFlowParamList>;
  [NavigatorName.CeloLockFlow]: NavigatorScreenParams<CeloLockFlowParamList>;
  [NavigatorName.CeloRegistrationFlow]: NavigatorScreenParams<CeloRegistrationFlowParamList>;
  // This is not a navigator
  [NavigatorName.CeloManageAssetsNavigator]:
    | {
        params?: {
          account?: AccountLike;
          accountId?: string | null;
          parentId?: string | null;
        };
      }
    | undefined;

  // Cosmos
  [NavigatorName.CosmosDelegationFlow]: NavigatorScreenParams<CosmosDelegationFlowParamList>;
  [NavigatorName.CosmosRedelegationFlow]: NavigatorScreenParams<CosmosRedelegationFlowParamList>;
  [NavigatorName.CosmosUndelegationFlow]: NavigatorScreenParams<CosmosUndelegationFlowParamList>;
  [NavigatorName.CosmosClaimRewardsFlow]: NavigatorScreenParams<CosmosClaimRewardsFlowParamList>;

  // EVM
  [NavigatorName.EvmEditTransaction]: NavigatorScreenParams<EditTransactionParamList>;

  // Solana
  [NavigatorName.SolanaDelegationFlow]: NavigatorScreenParams<SolanaDelegationFlowParamList>;

  // Stelar
  [NavigatorName.StellarAddAssetFlow]: NavigatorScreenParams<StellarAddAssetFlowParamList>;

  // Tezos
  [NavigatorName.TezosDelegationFlow]: NavigatorScreenParams<TezosDelegationFlowParamList>;

  // Tron
  [NavigatorName.TronVoteFlow]: NavigatorScreenParams<TronVoteFlowParamList>;

  [NavigatorName.ExploreTab]: NavigatorScreenParams<ExploreTabNavigatorStackParamList>;

  [ScreenName.DeviceConnect]: {
    appName?: string;
    onSuccess: (result: AppResult) => void;
    onClose: () => void;
  };
  [NavigatorName.NoFundsFlow]: NavigatorScreenParams<NoFundsNavigatorParamList>;
  [NavigatorName.StakeFlow]: NavigatorScreenParams<StakeNavigatorParamList>;

  [ScreenName.RedirectToOnboardingRecoverFlow]: undefined;
};
