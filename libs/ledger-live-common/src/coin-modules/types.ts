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
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type Prando from "prando";
import type { Resolver } from "../hw/getAddress/types";
import type { SignMessage } from "../hw/signMessage/types";
import type { CoinFrameworkSigner } from "../bridge/generic-coin-framework/types";
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
  cliTools?: any;
};

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
  loadSetup: () => Promise<FamilySetup<T, A, U, O, R>>;
  loadTransaction: () => Promise<TransactionModule<T, U, A, TRaw, URaw>>;
  loadDeviceTxConfig?: () => Promise<DeviceTransactionConfigFn<T, any, A>>;
  loadWalletApiAdapter?: () => Promise<WalletApiAdapterModule<W, A>>;
  loadPlatformAdapter?: () => Promise<PlatformAdapterModule>;
  loadAccount?: () => Promise<AccountModule<A>>;
  loadMockBridge?: () => Promise<MockBridgeModule<T, A, U, O, R>>;
  loadMockAccount?: () => Promise<MockAccountModule<A>>;
  loadValidateAddress?: () => Promise<ValidateAddressFn>;
  loadSigner?: () => Promise<CoinFrameworkSigner>;
  loadBridgeExtensions?: () => Promise<AccountBridgeExtensions>;
};
