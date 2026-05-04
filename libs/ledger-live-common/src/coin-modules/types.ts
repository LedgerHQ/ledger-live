import type {
  Account,
  AccountBridge,
  AccountLike,
  AnyMessage,
  AddressValidationCurrencyParameters,
  CurrencyBridge,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type { Resolver } from "../hw/getAddress/types";
import type { SignMessage } from "../hw/signMessage/types";
import type { GetWalletAPITransactionSignFlowInfos } from "../wallet-api/types";
import type { AlpacaSigner } from "../bridge/generic-alpaca/types";
export type { AlpacaSigner };

export type MessageSignerModule = {
  signMessage: SignMessage;
  prepareMessageToSign?: (opts: { account: Account; message: string }) => AnyMessage;
};

/* eslint-disable @typescript-eslint/no-explicit-any */
// Parameters are `any` because each family uses its own transaction/raw types at the loader boundary.
// Method syntax enables bivariant param checking so family-specific implementations are assignable.
export type TransactionModule = {
  fromTransactionRaw(raw: any): TransactionCommon;
  toTransactionRaw(tx: any): Record<string, unknown>;
  formatTransaction(tx: any, account: Account): string;
  fromTransactionStatusRaw?(raw: any): TransactionStatusCommon;
  toTransactionStatusRaw?(status: any): Record<string, unknown>;
  formatTransactionStatus?(tx: any, status: any, mainAccount?: Account): string;
};

export type DeviceTransactionConfigFn = (arg: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: any;
  status: any;
}) => Promise<CommonDeviceTransactionField[]>;

export type WalletApiAdapterModule = {
  getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<WalletAPITransaction, any>;
};

export type PlatformAdapterModule = {
  getPlatformTransactionSignFlowInfos: (tx: any) => {
    canEditFees: boolean;
    hasFeesProvided: boolean;
    liveTx: Partial<TransactionCommon>;
  };
};
/* eslint-enable @typescript-eslint/no-explicit-any */

export type AccountModule = {
  injectGetAddressParams?: (account: Account) => Record<string, unknown>;
};

export type MockBridgeModule = {
  currencyBridge: CurrencyBridge;
  accountBridge: AccountBridge<TransactionCommon>;
  loadCoinConfig?: () => void;
};

export type MockAccountModule = {
  postSyncAccount?: (account: Account) => Account;
  postScanAccount?: (account: Account, opts?: { isEmpty?: boolean }) => Account;
};

export type FamilySetup = {
  bridge?: {
    currencyBridge: CurrencyBridge;
    accountBridge: AccountBridge<TransactionCommon>;
  };
  resolver?: Resolver;
  messageSigner?: MessageSignerModule;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cliTools?: any;
};

export type ValidateAddressFn = (
  address: string,
  parameters: Partial<AddressValidationCurrencyParameters>,
) => Promise<boolean>;

export type CoinModuleLoader = {
  family: string;
  loadSetup: () => FamilySetup;
  loadTransaction: () => TransactionModule;
  loadDeviceTxConfig?: () => DeviceTransactionConfigFn;
  loadWalletApiAdapter?: () => WalletApiAdapterModule;
  loadPlatformAdapter?: () => PlatformAdapterModule;
  loadAccount?: () => AccountModule;
  loadMockBridge?: () => MockBridgeModule;
  loadMockAccount?: () => MockAccountModule;
  loadValidateAddress?: () => ValidateAddressFn;
  loadSigner?: () => AlpacaSigner;
  /**
   * Optional per-family AccountBridge method overrides for alpacaized families.
   *
   * The generic-alpaca bridge covers the core sync/send/sign pipeline; coin-specific
   * helpers (e.g. isEditableOperation, getStakesCount) that don't fit the generic
   * pipeline are registered here and merged at bridge-construction time in impl.ts.
   *
   * Part of the generic-alpaca architecture where each family self-registers its
   * extensions via a lazy require() rather than being imported statically by the
   * bridge layer.
   */
  loadBridgeExtensions?: () => Partial<AccountBridge<any>>;
};
