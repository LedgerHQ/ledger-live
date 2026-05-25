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
  TransactionStatusCommon,
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

export type TransactionModule = {
  fromTransactionRaw(raw: any): TransactionCommon;
  toTransactionRaw(tx: any): Record<string, unknown>;
  formatTransaction(tx: any, account: Account): string | Promise<string>;
  fromTransactionStatusRaw?(raw: any): TransactionStatusCommon;
  toTransactionStatusRaw?(status: any): Record<string, unknown>;
  formatTransactionStatus?(tx: any, status: any, mainAccount?: Account): string;
};

export type DeviceTransactionConfigFn<
  T extends TransactionCommon = any,
  U extends TransactionStatusCommon = any,
  A extends Account = any,
> = (arg: {
  account: A;
  parentAccount: A | null | undefined;
  transaction: T;
  status: U;
}) => Promise<any[]>;

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
> = {
  family: string;
  loadSetup: () => Promise<FamilySetup<T, A, U, O, R>>;
  loadTransaction: () => Promise<TransactionModule>;
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
