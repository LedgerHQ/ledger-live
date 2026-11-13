import type {
  Account,
  AccountBridge,
  AccountBridgeExtensions,
  AccountLike,
  AccountRaw,
  AnyMessage,
  AddressValidationCurrencyParameters,
  CurrencyBridge,
  Operation,
  TransactionCommon,
  TransactionCommonRaw,
  TransactionStatusCommon,
  TransactionStatusCommonRaw,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@domain/entity-currency-crypto";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { AccountReceive } from "@domain/entity-account-receive";
import type { AccountStatus, AssetStatus } from "@domain/entity-account-status";
import type { TokenCurrency } from "@domain/entity-currency-token";
import type { AccountCandidate } from "@domain/entity-derivation";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type { BridgeApi } from "@ledgerhq/ledger-wallet-framework/api/types";
import type { CoinModuleImpl } from "@ledgerhq/coin-module-framework/api/index";
import type Prando from "prando";
import type { Observable } from "rxjs";
import type Transport from "@ledgerhq/hw-transport";
import type { Resolver } from "../hw/getAddress/types";
import type { SignMessage } from "../hw/signMessage/types";
import type {
  AccountRawAssignHooks,
  CoinFrameworkSigner,
} from "../bridge/generic-coin-framework/types";
import type { SponsoredCoinApi } from "../bridge/generic-coin-framework/sponsored";
export type { CoinFrameworkSigner };

export type MessageSignerModule = {
  signMessage: SignMessage;
  prepareMessageToSign?: (opts: { account: Account; message: string }) => AnyMessage;
};

export type TransactionModule<
  T extends TransactionCommon = any,
  U extends TransactionStatusCommon = TransactionStatusCommon,
  A extends Account = any,
  TRaw extends TransactionCommonRaw = any,
  URaw extends TransactionStatusCommonRaw = TransactionStatusCommonRaw,
> = {
  fromTransactionRaw(raw: TRaw): T;
  toTransactionRaw(tx: T): TRaw;
  formatTransaction(tx: T, account: A): string | Promise<string>;
  fromTransactionStatusRaw?(raw: URaw): U;
  toTransactionStatusRaw?(status: U): URaw;
  formatTransactionStatus?(tx: T, status: U, mainAccount?: A): string;
};

export type DeviceTransactionFieldBase = { type: string; label: string };

export type DeviceTransactionConfigFn<
  T extends TransactionCommon = any,
  U extends TransactionStatusCommon = any,
  A extends Account = any,
  P extends DeviceTransactionFieldBase = DeviceTransactionFieldBase,
> = (arg: {
  account: AccountLike<A>;
  parentAccount: A | null | undefined;
  transaction: T;
  status: U;
}) => Promise<P[]>;

export type WalletApiAdapterModule<
  W extends WalletAPITransaction = WalletAPITransaction,
  A extends Account = Account,
> = {
  getWalletAPITransactionSignFlowInfos(input: {
    walletApiTransaction: W;
    account: AccountLike<A>;
  }): {
    canEditFees: boolean;
    hasFeesProvided: boolean;
    liveTx: Partial<TransactionCommon>;
  };
};

export type PlatformAdapterModule = {
  getPlatformTransactionSignFlowInfos: (tx: any) => {
    canEditFees: boolean;
    hasFeesProvided: boolean;
    liveTx: Partial<TransactionCommon>;
  };
};

export type AccountModule<A extends Account = Account> = {
  injectGetAddressParams?(account: A): Record<string, unknown>;
  [key: string]: unknown;
};

export type MockBridgeModule<
  T extends TransactionCommon = any,
  A extends Account = any,
  U extends TransactionStatusCommon = TransactionStatusCommon,
  O extends Operation = any,
  R extends AccountRaw = AccountRaw,
> = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<T, A, U, O, R>;
  loadCoinConfig?: () => void;
};

export type MockAccountModule<A extends Account = Account> = {
  genAccountEnhanceOperations?(account: A, rng: Prando): A;
  postSyncAccount?(account: A): A;
  postScanAccount?(account: A, opts?: { isEmpty?: boolean }): A;
};

export type FamilySetup<
  T extends TransactionCommon = any,
  A extends Account = any,
  U extends TransactionStatusCommon = TransactionStatusCommon,
  O extends Operation = any,
  R extends AccountRaw = AccountRaw,
> = {
  bridge?: {
    currencyBridge: CurrencyBridge;
    accountBridge: AccountBridge<T, A, U, O, R>;
  };
  resolver?: Resolver;
  messageSigner?: MessageSignerModule;
  /** A derivation error ending the scan of a mode instead of failing it, as the family's legacy scan iterate does (Celo `UpdateYourApp`). */
  endsScanOn?: (error: unknown) => boolean;
  /** The descriptor of a discovery candidate, when the family is not known by the address `resolver` gives (UTXO, Hedera). */
  deriveAccountDescriptor?: DeriveAccountDescriptor;
};

/** Runs a device job on a transport: a Device Intent session (`deriveOnSession`), or any other. */
export type RunOnTransport = <T>(job: (transport: Transport) => Observable<T>) => Observable<T>;

/** Unsubscribing stops the derivation; `null` ends the mode, as the legacy scan's iterate (Hedera past the accounts of its key). */
/** An account looked up from a key (Hedera), as discovery's `LookedUpAccount`: declared here so the registry types pull in no feature package. */
export type LookedUpDescriptor = {
  readonly descriptor: AccountDescriptor;
  readonly keyHasMoreAccounts: boolean;
};

export type DeriveAccountDescriptor = (
  runOnTransport: RunOnTransport,
  currency: CryptoCurrency,
  candidate: AccountCandidate,
) => Observable<AccountDescriptor | LookedUpDescriptor | null>;

export type ValidateAddressFn = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

export type CoinModuleLoader<
  T extends TransactionCommon = any,
  A extends Account = any,
  U extends TransactionStatusCommon = TransactionStatusCommon,
  O extends Operation = any,
  R extends AccountRaw = AccountRaw,
  W extends WalletAPITransaction = WalletAPITransaction,
  TRaw extends TransactionCommonRaw = any,
  URaw extends TransactionStatusCommonRaw = TransactionStatusCommonRaw,
> = {
  family: string;
  /** Currencies this loader supports. */
  supportedCoins: string[]; // TO BE REPLACED soon by branded id
  /** How an account of this family is identified as an AccountDescriptor. */
  accountDescriptorType: AccountDescriptor["type"];
  /** `false` when a first sync needs more than the descriptor holds: an onboarding (Canton, Concordium). */
  syncsFromDescriptor?: false;
  loadSetup: () => Promise<FamilySetup<T, A, U, O, R>>;
  loadTransaction: () => Promise<TransactionModule<T, U, A, TRaw, URaw>>;
  loadDeviceTxConfig?: () => Promise<DeviceTransactionConfigFn<T, any, A>>;
  loadWalletApiAdapter?: () => Promise<WalletApiAdapterModule<W, A>>;
  loadPlatformAdapter?: () => Promise<PlatformAdapterModule>;
  loadAccount?: () => Promise<AccountModule<A>>;
  loadMockBridge?: () => Promise<MockBridgeModule<T, A, U, O, R>>;
  loadMockAccount?: () => Promise<MockAccountModule<A>>;
  loadSigner?: () => Promise<CoinFrameworkSigner>;
  loadBridgeExtensions?: () => Promise<AccountBridgeExtensions<T>>;
  loadBridgeApi?: () => Promise<BridgeApi | ((currency: CryptoCurrency) => BridgeApi)>;
  loadAccountRawAssign?: () => Promise<AccountRawAssignHooks>;
  /** The address of an account from its public key, its descriptor key; for a family whose descriptor is keyed on the public key. */
  loadAddressFromKey?: () => Promise<(publicKey: string) => string>;
  /** Where an account receives, when not on the `freshAddress` the device shows. */
  loadAccountReceive?: () => Promise<(account: A) => AccountReceive>;
  /** Whether the account was ever used and what it must do before it transacts, where `defaultAccountStatus` is wrong. */
  loadAccountStatus?: () => Promise<(account: A) => AccountStatus>;
  /** Whether the account must activate a token of its network before holding it; no gate when absent. */
  loadAssetStatus?: () => Promise<(account: A, token: TokenCurrency) => AssetStatus>;
  /**
   * Both generics are `any`: the registry is heterogeneous and cannot name one memo / `TxData`
   * instantiation for every family. Pinning `TxDataType` (its default is `TxDataNotSupported`) would
   * make a module that declares its own — coin-tron's `TronTxData`, say — unassignable, because the
   * API's methods take the intent as a parameter and so are contravariant in it.
   *
   * The impl type rather than the full contract: a module may omit the capabilities its chain has
   * none of, and `getCoinModuleApi` backfills them through `withDefaults`.
   */
  loadLocalApi?: () => Promise<(currencyId: string) => CoinModuleImpl<any, any> & BridgeApi>;
  /** Kept off `loadLocalApi` so the main coin-module api stays the generic `CoinModuleImpl` contract. */
  loadSponsoredApi?: () => Promise<(currencyId: string) => SponsoredCoinApi>;
};
