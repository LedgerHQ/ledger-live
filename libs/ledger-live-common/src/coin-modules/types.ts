import type {
  Account,
  AccountBridge,
  AccountLike,
  AnyMessage,
  AddressValidationCurrencyParameters,
  CurrencyBridge,
  Operation,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { GetWalletAPITransactionSignFlowInfos } from "../wallet-api/types";
import type { Resolver } from "../hw/getAddress/types";
import type { AlpacaSigner } from "../bridge/generic-alpaca/types";
export type { AlpacaSigner };

export type MessageSignerModule = {
  signMessage: any; // old-style SignMessage or new alpaca-style MessageSigner<T> at the loader boundary
  prepareMessageToSign?: (opts: { account: Account; message: string }) => AnyMessage;
};

// Parameters are `any` because each family uses its own transaction/raw types at the loader boundary.
// Method syntax enables bivariant param checking so family-specific implementations are assignable.
export type TransactionModule = {
  fromTransactionRaw(raw: any): TransactionCommon;
  toTransactionRaw(tx: any): Record<string, unknown>;
  // Some coins (e.g. solana) return Promise<string> — union covers both sync and async impls.
  formatTransaction(tx: any, account: Account): string | Promise<string>;
  fromTransactionStatusRaw?(raw: any): TransactionStatusCommon;
  toTransactionStatusRaw?(status: any): Record<string, unknown>;
  formatTransactionStatus?(tx: any, status: any, mainAccount?: Account): string;
};

export type DeviceTransactionConfigFn = (arg: {
  // `any` here because each coin passes its own account subtype at the loader boundary.
  account: any;
  parentAccount: Account | null | undefined;
  transaction: any;
  status: any;
}) => Promise<CommonDeviceTransactionField[]>;

export type WalletApiAdapterModule = {
  // Coin-specific wallet API transaction types — erased to `any` at the loader boundary.
  getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<any, any>;
};

export type PlatformAdapterModule = {
  getPlatformTransactionSignFlowInfos: (tx: any) => {
    canEditFees: boolean;
    hasFeesProvided: boolean;
    // Coin-specific transaction subtype — erased to `any` at the loader boundary.
    liveTx: Partial<any>;
  };
};

export type AccountModule = {
  injectGetAddressParams?: (account: any) => Record<string, unknown>;
};

export type MockBridgeModule = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<any, any, any, any, any>;
  loadCoinConfig?: () => void;
};

export type MockAccountModule = {
  postSyncAccount?: (account: Account) => Account;
  postScanAccount?: (account: Account, opts?: any) => Account;
};

export type FamilySetup = {
  bridge?: {
    currencyBridge: CurrencyBridge;
    accountBridge: AccountBridge<any, any, any, any, any>;
  };
  resolver?: Resolver;
  messageSigner?: MessageSignerModule;
  cliTools?: any;
};

export type ValidateAddressFn = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

export type HasGasTrackerFn = (currency: CryptoCurrency) => boolean;

export type IsEditableOperationFn = (
  account: Account,
  operation: Operation,
  hasGasTracker: HasGasTrackerFn,
) => boolean;

export type IsStuckOperationFn = (operation: Operation) => boolean;

export type GetStuckAccountAndOperationFn = (
  account: AccountLike,
  parentAccount: Account | null | undefined,
  hasGasTracker: HasGasTrackerFn,
) => { account: AccountLike; parentAccount: Account | undefined; operation: Operation } | undefined;

// Dynamic imports in NodeNext/CJS mode wrap exports under `.default` once or twice.
// Using `{ default: any }` at the loader boundary because TypeScript's structural
// check for module namespace types is too strict for the CJS interop case.
// The unwrapped type T is enforced by registry.ts's unwrapModuleDefault return type.
type ModuleOrDefault<T> = T | { default: any };

export type CoinModuleLoader = {
  family: string;
  loadSetup: () => FamilySetup;
  loadTransaction: () => TransactionModule;
  loadDeviceTxConfig?: () => Promise<ModuleOrDefault<DeviceTransactionConfigFn>>;
  loadWalletApiAdapter?: () => Promise<ModuleOrDefault<WalletApiAdapterModule>>;
  loadPlatformAdapter?: () => Promise<ModuleOrDefault<PlatformAdapterModule>>;
  loadAccount?: () => Promise<ModuleOrDefault<AccountModule>>;
  loadMockBridge?: () => MockBridgeModule;
  loadMockAccount?: () => MockAccountModule;
  loadIsEditableOperation?: () => IsEditableOperationFn;
  loadIsStuckOperation?: () => IsStuckOperationFn;
  loadGetStuckAccountAndOperation?: () => GetStuckAccountAndOperationFn;
  loadIsAccountEmpty?: () => (account: any) => boolean;
  loadGetVotesCount?: () => (account: any) => number;
  loadClearAccount?: () => (account: any) => void;
  loadValidateAddress?: () => ValidateAddressFn;
  loadSigner?: () => AlpacaSigner;
};
