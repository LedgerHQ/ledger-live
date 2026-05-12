import type {
  Account,
  AccountBridge,
  AccountBridgeExtensions,
  AnyMessage,
  AddressValidationCurrencyParameters,
  CurrencyBridge,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { Resolver } from "../hw/getAddress/types";
import type { SignMessage } from "../hw/signMessage/types";
import type { GetWalletAPITransactionSignFlowInfos } from "../wallet-api/types";
import type { CoinFrameworkSigner } from "../bridge/generic-coin-framework/types";
export type { CoinFrameworkSigner };

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
  formatTransaction(tx: any, account: Account): string | Promise<string>;
  fromTransactionStatusRaw?(raw: any): TransactionStatusCommon;
  toTransactionStatusRaw?(status: any): Record<string, unknown>;
  formatTransactionStatus?(tx: any, status: any, mainAccount?: Account): string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DeviceTransactionConfigFn = (arg: any) => Promise<any[]>;

export type WalletApiAdapterModule = {
  getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<any, any>;
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
  injectGetAddressParams?: (account: any) => Record<string, unknown>;
  [key: string]: unknown;
};

export type MockBridgeModule = {
  currencyBridge: CurrencyBridge;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    accountBridge: AccountBridge<any, any, any, any, any>;
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
  loadSetup: () => Promise<FamilySetup>;
  loadTransaction: () => Promise<TransactionModule>;
  loadDeviceTxConfig?: () => Promise<DeviceTransactionConfigFn>;
  loadWalletApiAdapter?: () => Promise<WalletApiAdapterModule>;
  loadPlatformAdapter?: () => Promise<PlatformAdapterModule>;
  loadAccount?: () => Promise<AccountModule>;
  loadMockBridge?: () => Promise<MockBridgeModule>;
  loadMockAccount?: () => Promise<MockAccountModule>;
  loadValidateAddress?: () => Promise<ValidateAddressFn>;
  loadSigner?: () => Promise<CoinFrameworkSigner>;
  loadBridgeExtensions?: () => Promise<AccountBridgeExtensions>;
};
