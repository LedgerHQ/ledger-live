import type {
  Account,
  AccountBridge,
  AccountLike,
  AnyMessage,
  CurrencyBridge,
  TransactionCommon,
  TransactionStatusCommon,
} from "@ledgerhq/types-live";
import type { CryptoCurrencyId } from "@ledgerhq/types-cryptoassets";
import type { CommonDeviceTransactionField } from "@ledgerhq/ledger-wallet-framework/transaction/common";
import type { Transaction as WalletAPITransaction } from "@ledgerhq/wallet-api-core";
import type { AppSpec } from "@ledgerhq/ledger-wallet-framework/bot/types";
import type { Resolver } from "../hw/getAddress/types";
import type { SignMessage } from "../hw/signMessage/types";
import type { GetWalletAPITransactionSignFlowInfos } from "../wallet-api/types";

/** Shape of the `messageSigner` export in each family's `setup.ts`. */
export type MessageSignerModule = {
  signMessage: SignMessage;
  prepareMessageToSign?: (opts: { account: Account; message: string }) => Promise<AnyMessage>;
};

/**
 * Shape of the default export from each family's `transaction.ts` (or
 * `@ledgerhq/coin-{family}/transaction`).
 *
 * Method syntax is intentional: it enables bivariant parameter checking so
 * that family-specific `(raw: FamilyRaw) => FamilyTransaction` implementations
 * are assignable to this interface without explicit casts.
 *
 * Parameters are `any` because each family uses its own transaction / raw types;
 * at the loader boundary we can only enforce the return side.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export type TransactionModule = {
  fromTransactionRaw(raw: any): TransactionCommon;
  toTransactionRaw(tx: any): Record<string, unknown>;
  formatTransaction(tx: any, account: Account): string;
  fromTransactionStatusRaw?(raw: any): TransactionStatusCommon;
  toTransactionStatusRaw?(status: any): Record<string, unknown>;
  // Some families pass a 3rd mainAccount argument
  formatTransactionStatus?(tx: any, status: any, mainAccount?: any): string;
};
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * The default export from each family's `deviceTransactionConfig.ts`.
 * Returns the fields that the Ledger device displays before signing.
 *
 * Uses `CommonDeviceTransactionField` (base type) to avoid a circular
 * dependency: ExtraDeviceTransactionField variants are defined in
 * `transaction/deviceTransactionConfig.ts` which itself imports from registry.
 *
 * Parameters are `any` because each family has its own transaction / status type.
 */
export type DeviceTransactionConfigFn = (arg: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- family-specific transaction
  transaction: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- family-specific status
  status: any;
}) => Promise<CommonDeviceTransactionField[]>;

/**
 * Shape of the default export from each family's `walletApiAdapter.ts`.
 * The second type parameter is `any` because each family's wallet-API adapter
 * is parameterized over its own Transaction type.
 */
export type WalletApiAdapterModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- family Transaction is a subtype
  getWalletAPITransactionSignFlowInfos: GetWalletAPITransactionSignFlowInfos<WalletAPITransaction, any>;
};

/** Shape of the default export from each family's `platformAdapter.ts`. */
export type PlatformAdapterModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- family-specific platform transaction
  getPlatformTransactionSignFlowInfos: (tx: any) => {
    canEditFees: boolean;
    hasFeesProvided: boolean;
    liveTx: Partial<TransactionCommon>;
  };
};

/**
 * Shape of the default export from each family's `account.ts`
 * (e.g. `@ledgerhq/coin-bitcoin/account`).
 * Used in `hw/actions/app.ts` to inject hardware-device address params.
 */
export type AccountModule = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- account is family-specific
  injectGetAddressParams?: (account: any) => Record<string, unknown>;
};

/**
 * Shape of the default export from each family's `bridge/mock.ts`.
 * `AccountBridge<any>` is used because AccountBridge is invariant in its
 * transaction type parameter and each family has its own transaction type.
 */
export type MockBridgeModule = {
  currencyBridge: CurrencyBridge;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- AccountBridge is invariant in T
  accountBridge: AccountBridge<any>;
};

/**
 * Shape of the default export from each family's mock account module
 * (e.g. `@ledgerhq/coin-vechain/mock`).
 */
export type MockAccountModule = {
  postSyncAccount?: (account: Account) => Account;
  postScanAccount?: (account: Account) => Account;
};

/**
 * Shape of the default export from each family's `specs.ts`.
 * `AppSpec<any>` because each family parameterizes AppSpec over its own transaction type.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- AppSpec is generic over family Transaction
export type SpecsModule = Record<string, AppSpec<any>>;

export type FamilySetup = {
  // AccountBridge<any>: AccountBridge is invariant in T, each family has its own transaction type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bridge?: { currencyBridge: CurrencyBridge; accountBridge: AccountBridge<any> };
  resolver?: Resolver;
  messageSigner?: MessageSignerModule;
  // CLI tool helpers — deeply internal, typed at usage site
  cliTools?: unknown;
};

export type CoinModuleLoader = {
  family: string;
  // The set of CryptoCurrencyId values belonging to this family.
  // Will be auto-derived from @ledgerhq/cryptoassets once PR #15878 lands.
  currencyIds: CryptoCurrencyId[];

  // Covers bridge/js, hw-getAddress, hw-signMessage, cli-transaction via one import (families/{family}/setup.ts)
  loadSetup: () => Promise<FamilySetup>;

  loadTransaction: () => Promise<TransactionModule>;
  loadDeviceTxConfig?: () => Promise<DeviceTransactionConfigFn>;
  loadWalletApiAdapter?: () => Promise<WalletApiAdapterModule>;
  loadPlatformAdapter?: () => Promise<PlatformAdapterModule>;
  loadAccount?: () => Promise<AccountModule>;
  loadMockBridge?: () => Promise<MockBridgeModule>;
  loadMockAccount?: () => Promise<MockAccountModule>;
};
