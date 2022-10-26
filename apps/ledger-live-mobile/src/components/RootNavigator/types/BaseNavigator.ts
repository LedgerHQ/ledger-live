import type { Operation, AccountLike, Account } from "@ledgerhq/types-live";
import type {
  NavigatorScreenParams,
  ParamListBase,
} from "@react-navigation/native";
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
import type { PostOnboardingNavigatorParamList } from "./PostOnboardingNavigator";
import type { CustomImageNavigatorParamList } from "./CustomImageNavigator";
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
import type { OsmosisDelegationFlowParamList } from "../../../families/osmosis/DelegationFlow/types";
import type { OsmosisRedelegationFlowParamList } from "../../../families/osmosis/RedelegationFlow/types";
import type { OsmosisUndelegationFlowParamList } from "../../../families/osmosis/UndelegationFlow/types";
import type { OsmosisClaimRewardsFlowParamList } from "../../../families/osmosis/ClaimRewardsFlow/types";
import type { SolanaDelegationFlowParamList } from "../../../families/solana/DelegationFlow/types";
import type { StellarAddAssetFlowParamList } from "../../../families/stellar/AddAssetFlow/types";
import type { TezosDelegationFlowParamList } from "../../../families/tezos/DelegationFlow/types";
import type { TronVoteFlowParamList } from "../../../families/tron/VoteFlow/types";

type TradeParams = {
  type: "onRamp" | "offRamp";
  cryptoCurrencyId: string;
  fiatCurrencyId: string;
  fiatAmount?: number;
  cryptoAmount?: number;
};

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
  [NavigatorName.BuyDevice]:
    | NavigatorScreenParams<BuyDeviceNavigatorParamList>
    | undefined;
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
    onSuccessNavigateToConfig: {
      navigateInput: NavigateInput;
      pathToDeviceParam: PathToDeviceParam;
      navigationType?: NavigationType;
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
  [NavigatorName.ReceiveFunds]:
    | NavigatorScreenParams<ReceiveFundsStackParamList>
    | undefined;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList> & {
    onClose?: () => void;
  };
  [NavigatorName.SignTransaction]: NavigatorScreenParams<SignTransactionNavigatorParamList>;
  [NavigatorName.Swap]:
    | NavigatorScreenParams<SwapNavigatorParamList>
    | undefined;
  [NavigatorName.Lending]: NavigatorScreenParams<LendingNavigatorParamList>;
  [NavigatorName.LendingInfo]: NavigatorScreenParams<LendingInfoNavigatorParamList>;
  [NavigatorName.LendingEnableFlow]: NavigatorScreenParams<LendingEnableFlowParamsList>;
  [NavigatorName.LendingSupplyFlow]: NavigatorScreenParams<LendingSupplyFlowNavigatorParamList>;
  [NavigatorName.LendingWithdrawFlow]: NavigatorScreenParams<LendingWithdrawFlowNavigatorParamList>;
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
    onError?: (_: Error) => void;
    error?: Error;
  };
  [NavigatorName.FirmwareUpdate]: NavigatorScreenParams<FirmwareUpdateNavigatorParamList>;
  [NavigatorName.Exchange]:
    | NavigatorScreenParams<ExchangeLiveAppNavigatorParamList>
    | NavigatorScreenParams<ExchangeNavigatorParamList>
    | undefined;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<ExchangeStackNavigatorParamList> & {
    mode?: "buy" | "sell";
  };
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<PlatformExchangeNavigatorParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.ImportAccounts]:
    | NavigatorScreenParams<ImportAccountsNavigatorParamList>
    | undefined;
  [NavigatorName.PasswordAddFlow]:
    | NavigatorScreenParams<PasswordAddFlowParamList>
    | undefined;
  [NavigatorName.PasswordModifyFlow]:
    | NavigatorScreenParams<PasswordModifyFlowParamList>
    | undefined;
  [NavigatorName.MigrateAccountsFlow]:
    | NavigatorScreenParams<MigrateAccountsNavigatorParamList>
    | undefined;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.NftNavigator]: NavigatorScreenParams<NftNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
  [NavigatorName.WalletConnect]: NavigatorScreenParams<
    WalletConnectNavigatorParamList | WalletConnectLiveAppNavigatorParamList
  >;
  [NavigatorName.CustomImage]: NavigatorScreenParams<CustomImageNavigatorParamList>;
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

  // Osmosis
  [NavigatorName.OsmosisDelegationFlow]: NavigatorScreenParams<OsmosisDelegationFlowParamList>;
  [NavigatorName.OsmosisRedelegationFlow]: NavigatorScreenParams<OsmosisRedelegationFlowParamList>;
  [NavigatorName.OsmosisUndelegationFlow]: NavigatorScreenParams<OsmosisUndelegationFlowParamList>;
  [NavigatorName.OsmosisClaimRewardsFlow]: NavigatorScreenParams<OsmosisClaimRewardsFlowParamList>;

  // Solana
  [NavigatorName.SolanaDelegationFlow]: NavigatorScreenParams<SolanaDelegationFlowParamList>;

  // Stelar
  [NavigatorName.StellarAddAssetFlow]: NavigatorScreenParams<StellarAddAssetFlowParamList>;

  // Tezos
  [NavigatorName.TezosDelegationFlow]: NavigatorScreenParams<TezosDelegationFlowParamList>;

  // Tron
  [NavigatorName.TronVoteFlow]: NavigatorScreenParams<TronVoteFlowParamList>;
};
