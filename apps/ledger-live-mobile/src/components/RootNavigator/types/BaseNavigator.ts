import type { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import type {
  Account,
  AccountLike,
  DeviceInfo,
  FirmwareUpdateContext,
  Operation,
  SwapOperation,
} from "@ledgerhq/types-live";
import type { NavigatorScreenParams } from "@react-navigation/native";
// eslint-disable-next-line no-restricted-imports
import type { MappedSwapOperation, SwapLiveError } from "@ledgerhq/live-common/exchange/swap/types";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import { AppResult } from "@ledgerhq/live-common/hw/actions/app";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { SendFlowInitParams } from "@ledgerhq/live-common/flows/send/types";
import type { AssetsNavigatorParamsList } from "LLM/features/Assets/types";
import type { DeviceSelectionNavigatorParamsList } from "LLM/features/DeviceSelection/types";
import type { AnalyticsNavigatorParamsList } from "LLM/features/Analytics/types";
import type { Web3HubStackParamList } from "LLM/features/Web3Hub/types";
import { NavigatorName, ScreenName } from "~/const";
import type { FirmwareUpdateProps } from "~/screens/FirmwareUpdate";
import type { AlgorandOptInFlowParamList } from "../../../families/algorand/OptInFlow/types";
import type { AlgorandClaimRewardsFlowParamList } from "../../../families/algorand/Rewards/ClaimRewardsFlow/type";
import type { CeloActivateFlowParamList } from "../../../families/celo/ActivateFlow/types";
import type { CeloLockFlowParamList } from "../../../families/celo/LockFlow/types";
import type { CeloRegistrationFlowParamList } from "../../../families/celo/RegistrationFlow/types";
import type { CeloRevokeFlowFlowParamList } from "../../../families/celo/RevokeFlow/types";
import type { CeloUnlockFlowParamList } from "../../../families/celo/UnlockFlow/types";
import type { CeloVoteFlowParamList } from "../../../families/celo/VoteFlow/types";
import type { CeloWithdrawFlowParamList } from "../../../families/celo/WithdrawFlow/types";
import type { CosmosClaimRewardsFlowParamList } from "../../../families/cosmos/ClaimRewardsFlow/types";
import type { CosmosDelegationFlowParamList } from "../../../families/cosmos/DelegationFlow/types";
import type { CosmosRedelegationFlowParamList } from "../../../families/cosmos/RedelegationFlow/types";
import type { CosmosUndelegationFlowParamList } from "../../../families/cosmos/UndelegationFlow/types";
import type { EditTransactionParamList } from "../../../families/evm/EditTransactionFlow/EditTransactionParamList";
import type { PolkadotBondFlowParamList } from "../../../families/polkadot/BondFlow/types";
import type { PolkadotNominateFlowParamList } from "../../../families/polkadot/NominateFlow/types";
import type { PolkadotRebondFlowParamList } from "../../../families/polkadot/RebondFlow/type";
import type { PolkadotSimpleOperationFlowParamList } from "../../../families/polkadot/SimpleOperationFlow/types";
import type { PolkadotUnbondFlowParamList } from "../../../families/polkadot/UnbondFlow/type";
import type { SolanaDelegationFlowParamList } from "../../../families/solana/DelegationFlow/types";
import type { StellarAddAssetFlowParamList } from "../../../families/stellar/AddAssetFlow/types";
import type { TezosDelegationFlowParamList } from "../../../families/tezos/DelegationFlow/types";
import type { TronVoteFlowParamList } from "../../../families/tron/VoteFlow/types";
import type { HederaAssociateTokenFlowParamList } from "../../../families/hedera/AssociateTokenFlow/types";
import type { CantonOnboardAccountParamList } from "../../../families/canton/Onboard/types";
import type { HederaDelegationFlowParamList } from "../../../families/hedera/DelegationFlow/types";
import type { HederaUndelegationFlowParamList } from "../../../families/hedera/UndelegationFlow/types";
import type { HederaRedelegationFlowParamList } from "../../../families/hedera/RedelegationFlow/types";
import type { HederaClaimRewardsFlowParamList } from "../../../families/hedera/ClaimRewardsFlow/types";
import type { AccountSettingsNavigatorParamList } from "./AccountSettingsNavigator";
import type { AccountsNavigatorParamList } from "./AccountsNavigator";
import type { AddAccountsNavigatorParamList } from "./AddAccountsNavigator";
import type { AnalyticsOptInPromptNavigatorParamList } from "./AnalyticsOptInPromptNavigator";
import type { BuyDeviceNavigatorParamList } from "./BuyDeviceNavigator";
import type { ClaimRewardsNavigatorParamList } from "./ClaimRewardsNavigator";
import type { CustomErrorNavigatorParamList } from "./CustomErrorNavigator";
import type { CustomImageNavigatorParamList } from "./CustomImageNavigator";
import type { EarnLiveAppNavigatorParamList } from "./EarnLiveAppNavigator";
import type { ExchangeStackNavigatorParamList } from "./ExchangeStackNavigator";
import type { FeesNavigatorParamsList } from "./FeesNavigator";
import type { FreezeNavigatorParamList } from "./FreezeNavigator";
import type { LandingPagesNavigatorParamList } from "./LandingPagesNavigator";
import type { MainNavigatorParamList } from "./MainNavigator";
import type { NoFundsNavigatorParamList } from "./NoFundsNavigator";
import type { NotificationCenterNavigatorParamList } from "./NotificationCenterNavigator";
import type { PasswordAddFlowParamList } from "./PasswordAddFlowNavigator";
import type { PasswordModifyFlowParamList } from "./PasswordModifyFlowNavigator";
import type { PlatformExchangeNavigatorParamList } from "./PlatformExchangeNavigator";
import type { PostOnboardingNavigatorParamList } from "./PostOnboardingNavigator";
import type { PtxNavigatorParamList } from "./PtxNavigator";
import type { ReceiveFundsStackParamList } from "./ReceiveFundsNavigator";
import type { RequestAccountNavigatorParamList } from "./RequestAccountNavigator";
import type { SendFundsNavigatorStackParamList } from "./SendFundsNavigator";
import type { SettingsNavigatorStackParamList } from "./SettingsNavigator";
import type { SignMessageNavigatorStackParamList } from "./SignMessageNavigator";
import type { SignTransactionNavigatorParamList } from "./SignTransactionNavigator";
import type { StakeNavigatorParamList } from "./StakeNavigator";
import type { SwapNavigatorParamList } from "./SwapNavigator";
import type { PerpsNavigatorParamList } from "./PerpsNavigator";
import type { UnfreezeNavigatorParamList } from "./UnfreezeNavigator";
import type { WalletConnectLiveAppNavigatorParamList } from "./WalletConnectLiveAppNavigator";
import type { WalletSyncNavigatorStackParamList } from "./WalletSyncNavigator";
import type { WalletTabNavigatorStackParamList } from "./WalletTabNavigator";
import { SignRawTransactionNavigatorParamList } from "./SignRawTransactionNavigator";

export type CommonAddAccountNavigatorParamsList = {
  currency?: CryptoCurrency | TokenCurrency | null;
  token?: TokenCurrency;
  returnToSwap?: boolean;
  analyticsPropertyFlow?: string;
  onSuccess?: (account: AccountLike, parentAccount?: Account) => void;
  onError?: (_: Error) => void;
};

export type BaseNavigatorStackParamList = {
  [NavigatorName.Main]?: NavigatorScreenParams<MainNavigatorParamList> & {
    hideTabNavigation?: boolean;
  };
  [NavigatorName.BuyDevice]?: NavigatorScreenParams<BuyDeviceNavigatorParamList>;
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
    customDappUrl?: string;
    uri?: string;
    requestId?: string;
    sessionTopic?: string;
    chainId?: string;
    yieldId?: string;
  };
  [NavigatorName.Web3Hub]: NavigatorScreenParams<Web3HubStackParamList>;
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
  [ScreenName.EditDeviceName]: {
    device: Device;
    deviceName: string;
    deviceInfo: DeviceInfo;
    onNameChange(name: string): void;
  };
  [ScreenName.MarketCurrencySelect]: undefined;
  [ScreenName.MarketList]: undefined;
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
    headerTitle?: string;
  };
  [ScreenName.EditCurrencyUnits]: {
    currency: CryptoCurrency;
  };
  [ScreenName.MarketDetail]: {
    currencyId: string;
    resetSearchOnUmount?: boolean;
  };
  [ScreenName.SwapCustomError]: {
    error: SwapLiveError | Error;
  };

  [NavigatorName.Settings]: NavigatorScreenParams<SettingsNavigatorStackParamList>;
  [NavigatorName.ReceiveFunds]?: NavigatorScreenParams<ReceiveFundsStackParamList>;
  [NavigatorName.SendFunds]: NavigatorScreenParams<SendFundsNavigatorStackParamList>;
  [NavigatorName.SendFlow]: {
    onClose?: () => void;
    params?: SendFlowInitParams;
  };
  [NavigatorName.SignMessage]: NavigatorScreenParams<SignMessageNavigatorStackParamList> & {
    onClose?: () => void;
  };
  [NavigatorName.SignTransaction]: NavigatorScreenParams<SignTransactionNavigatorParamList> & {
    onError: (err: Error) => void;
  };
  [NavigatorName.SignRawTransaction]: NavigatorScreenParams<SignRawTransactionNavigatorParamList> & {
    onError: (err: Error) => void;
  };
  [NavigatorName.Swap]?: NavigatorScreenParams<SwapNavigatorParamList>;
  [NavigatorName.Perps]?: NavigatorScreenParams<PerpsNavigatorParamList>;
  [NavigatorName.Earn]?: NavigatorScreenParams<EarnLiveAppNavigatorParamList>;
  [NavigatorName.Freeze]: NavigatorScreenParams<FreezeNavigatorParamList>;
  [NavigatorName.Unfreeze]: NavigatorScreenParams<UnfreezeNavigatorParamList>;
  [NavigatorName.ClaimRewards]: NavigatorScreenParams<ClaimRewardsNavigatorParamList>;
  [NavigatorName.AddAccounts]?: Partial<NavigatorScreenParams<AddAccountsNavigatorParamList>> &
    CommonAddAccountNavigatorParamsList;
  [NavigatorName.RequestAccount]: NavigatorScreenParams<RequestAccountNavigatorParamList> & {
    onClose?: () => void;
  };
  [NavigatorName.Fees]: NavigatorScreenParams<FeesNavigatorParamsList>;
  [NavigatorName.Card]?: NavigatorScreenParams<PtxNavigatorParamList>;
  [NavigatorName.Exchange]?: NavigatorScreenParams<PtxNavigatorParamList>;
  [NavigatorName.ExchangeStack]: NavigatorScreenParams<ExchangeStackNavigatorParamList> & {
    mode?: "buy" | "sell";
  };
  [NavigatorName.PlatformExchange]: NavigatorScreenParams<PlatformExchangeNavigatorParamList>;
  [NavigatorName.AccountSettings]: NavigatorScreenParams<AccountSettingsNavigatorParamList>;
  [NavigatorName.PasswordAddFlow]?: NavigatorScreenParams<PasswordAddFlowParamList>;
  [NavigatorName.PasswordModifyFlow]?: NavigatorScreenParams<PasswordModifyFlowParamList>;
  [NavigatorName.NotificationCenter]: NavigatorScreenParams<NotificationCenterNavigatorParamList>;
  [NavigatorName.Accounts]: NavigatorScreenParams<AccountsNavigatorParamList>;
  [NavigatorName.WalletConnect]: NavigatorScreenParams<WalletConnectLiveAppNavigatorParamList>;
  [NavigatorName.CustomImage]: NavigatorScreenParams<CustomImageNavigatorParamList>;
  [NavigatorName.PostOnboarding]: NavigatorScreenParams<PostOnboardingNavigatorParamList>;
  [NavigatorName.CustomError]: NavigatorScreenParams<CustomErrorNavigatorParamList>;
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
  [NavigatorName.CeloManageAssetsNavigator]: {
    params?: {
      account?: AccountLike;
      accountId?: string | null;
      parentId?: string | null;
    };
  };

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

  // Hedera
  [NavigatorName.HederaAssociateTokenFlow]: NavigatorScreenParams<HederaAssociateTokenFlowParamList>;
  [NavigatorName.HederaDelegationFlow]: NavigatorScreenParams<HederaDelegationFlowParamList>;
  [NavigatorName.HederaUndelegationFlow]: NavigatorScreenParams<HederaUndelegationFlowParamList>;
  [NavigatorName.HederaRedelegationFlow]: NavigatorScreenParams<HederaRedelegationFlowParamList>;
  [NavigatorName.HederaClaimRewardsFlow]: NavigatorScreenParams<HederaClaimRewardsFlowParamList>;

  // Canton
  [NavigatorName.CantonOnboard]: NavigatorScreenParams<CantonOnboardAccountParamList>;

  [ScreenName.DeviceConnect]: {
    appName?: string;
    onSuccess: (result: AppResult) => void;
    onClose: () => void;
  };
  [NavigatorName.NoFundsFlow]: NavigatorScreenParams<NoFundsNavigatorParamList>;
  [NavigatorName.StakeFlow]: NavigatorScreenParams<StakeNavigatorParamList>;

  [ScreenName.RedirectToOnboardingRecoverFlow]: undefined;

  [NavigatorName.AnalyticsOptInPrompt]: NavigatorScreenParams<AnalyticsOptInPromptNavigatorParamList>;
  [ScreenName.MockedAddAssetButton]: undefined;

  [ScreenName.MockedWalletScreen]: undefined;

  // WALLET SYNC
  [NavigatorName.WalletSync]: NavigatorScreenParams<WalletSyncNavigatorStackParamList>;

  [ScreenName.MockedModularDrawer]: undefined;

  [ScreenName.FirmwareUpdate]: {
    deviceInfo?: DeviceInfo | null;
    firmwareUpdateContext?: FirmwareUpdateContext | null;
    device?: Device | null;
    onBackFromUpdate: FirmwareUpdateProps["onBackFromUpdate"];
    isBeforeOnboarding?: boolean;
  };
  [NavigatorName.LandingPages]: NavigatorScreenParams<LandingPagesNavigatorParamList>;
  [NavigatorName.WalletTab]: NavigatorScreenParams<WalletTabNavigatorStackParamList>;
  [NavigatorName.DeviceSelection]?: Partial<
    NavigatorScreenParams<DeviceSelectionNavigatorParamsList>
  >;
  [NavigatorName.Assets]?: Partial<NavigatorScreenParams<AssetsNavigatorParamsList>>;
  [NavigatorName.Analytics]?: Partial<NavigatorScreenParams<AnalyticsNavigatorParamsList>>;
  [ScreenName.SwapHistory]: undefined;
  [ScreenName.SwapLoading]: undefined;
  [ScreenName.SwapPendingOperation]: { swapOperation: SwapOperation };
  [ScreenName.LedgerSyncDeepLinkHandler]: undefined;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends BaseNavigatorStackParamList {}
  }
}
