import type {
  AssetInfo,
  Balance,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data";
import { AccountDataSourceIdSchema, type AccountDataKind } from "@domain/entity-account-data";
import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  AccountOperationSchema,
  type AccountOperation,
  type AccountOperationsPage,
} from "@domain/entity-account-operations";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

/** One currency's coin module, its context already bound. */
export type CoinModule = {
  getBalance(address: string): Promise<Balance[]>;
  listOperations(
    address: string,
    page: { cursor?: string; limit?: number },
  ): Promise<Page<Operation>>;
  /** The token an asset is, or `undefined` when the wallet does not know it. */
  tokenOf(asset: AssetInfo): Promise<{ id: string } | undefined>;
  /** The native balance comes in partitions (liquid, staked…) to sum, rather than a total first. */
  partitionsNativeBalance?: boolean;
};

export type CoinModuleSourceConfig = {
  loadCoinModule(currencyId: string): Promise<CoinModule>;
  /** Per kind, the families served: each kind is gated on its own parity with the full sync. */
  families: Partial<Record<AccountDataKind, () => Iterable<string>>>;
  blacklistedTokenIds?(): readonly string[];
};

// Operation types whose native value is reported without the fee the account also paid.
const FEE_BEARING_TYPES = new Set([
  "OUT",
  "FEES",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
  "CONTRACT_CALL",
  "UPDATE_ACCOUNT",
]);

const stringArray = (value: unknown): string[] | undefined =>
  Array.isArray(value) && value.every(item => typeof item === "string") ? value : undefined;

// EVM addresses are case-insensitive; others keep their case.
const normalized = (address: string) =>
  address.startsWith("0x") ? address.toLowerCase() : address;
const sameAddress = (a: string, b: string) => normalized(a) === normalized(b);

function operationValue(operation: Operation, address: string): bigint {
  const { fees, failed, feesPayer } = operation.tx;
  // A failed operation moved nothing but the fee, which is paid in the native coin.
  if (failed) return operation.asset.type === "native" ? fees : 0n;
  // A sponsored transaction's fee was paid by another account.
  const paidFees = feesPayer === undefined || sameAddress(feesPayer, address);
  if (operation.asset.type === "native" && paidFees && FEE_BEARING_TYPES.has(operation.type)) {
    return operation.value + fees;
  }
  return operation.value;
}

/** What the coin module reads an account by: its address, or its xpub on a UTXO family. */
const keyOf = (descriptor: AccountDescriptor) =>
  descriptor.type === "address" ? descriptor.address : descriptor.xpub;

function familyOf(descriptor: AccountDescriptor): string | undefined {
  try {
    return findCryptoCurrencyById(currencyIdFromNetwork(descriptor.network))?.family;
  } catch {
    return undefined;
  }
}

function toBalance(assetId: string, { value, locked }: Pick<Balance, "value" | "locked">) {
  const spendable = locked === undefined ? value : value - locked;
  return AccountAssetBalanceSchema.parse({
    assetId,
    balance: value.toString(),
    spendableBalance: (spendable < 0n ? 0n : spendable).toString(),
  });
}

/** Reads straight from a coin module: one `getBalance`, or one `listOperations` page. No full sync. */
export function createCoinModuleSource(config: CoinModuleSourceConfig) {
  async function balance({ descriptor }: AccountTarget): Promise<AccountAssetBalance[]> {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    const coinModule = await config.loadCoinModule(currencyId);
    const balances = await coinModule.getBalance(keyOf(descriptor));
    const blacklisted = new Set(config.blacklistedTokenIds?.() ?? []);
    // As the full sync: sum the partitions where the module splits them, else the first row is the total.
    const all = balances.filter(each => each.asset.type === "native");
    const natives = coinModule.partitionsNativeBalance ? all : all.slice(0, 1);
    const native = {
      value: natives.reduce((sum, each) => sum + each.value, 0n),
      locked: natives.reduce((sum, each) => sum + (each.locked ?? 0n), 0n),
    };
    const tokens = await Promise.all(
      balances
        .filter(each => each.asset.type !== "native")
        .map(async each => {
          const token = await coinModule.tokenOf(each.asset);
          return token && !blacklisted.has(token.id) ? toBalance(token.id, each) : undefined;
        }),
    );
    return [toBalance(currencyId, native), ...tokens.filter(row => row !== undefined)];
  }

  async function toOperation(
    coinModule: CoinModule,
    currencyId: string,
    address: string,
    operation: Operation,
  ): Promise<AccountOperation | undefined> {
    const token =
      operation.asset.type === "native" ? undefined : await coinModule.tokenOf(operation.asset);
    if (operation.asset.type !== "native" && !token) return undefined;
    const assetId = token ? token.id : currencyId;
    const { hash, fees, failed, block, date } = operation.tx;
    return AccountOperationSchema.parse({
      id: `${operation.id}-${assetId}`,
      assetId,
      hash,
      type: operation.type,
      value: operationValue(operation, address).toString(),
      fee: fees.toString(),
      // A token row names who moved the token; a native row, who signed the transaction.
      senders:
        stringArray(operation.details?.[token ? "assetSenders" : "parentSenders"]) ??
        operation.senders,
      recipients:
        stringArray(operation.details?.[token ? "assetRecipients" : "parentRecipients"]) ??
        operation.recipients,
      blockHeight: block.height ?? null,
      date: date.toISOString(),
      hasFailed: failed,
    });
  }

  async function operations(
    { descriptor, cursor }: AccountTarget,
    query: { limit?: number } | undefined,
  ): Promise<AccountOperationsPage> {
    const currencyId = currencyIdFromNetwork(descriptor.network);
    const coinModule = await config.loadCoinModule(currencyId);
    const page = await coinModule.listOperations(keyOf(descriptor), {
      cursor,
      limit: query?.limit,
    });
    // A failed incoming transfer is not the account's, as the full sync drops it.
    const usable = page.items.filter(item => !(item.type === "IN" && item.tx.failed));
    const blacklisted = new Set(config.blacklistedTokenIds?.() ?? []);
    const rows = await Promise.all(
      usable.map(item => toOperation(coinModule, currencyId, keyOf(descriptor), item)),
    );
    const found = rows
      .filter(row => row !== undefined)
      .filter(row => !blacklisted.has(row.assetId));
    // A falsy `next` ends the stream, per the coin module contract.
    return page.next ? { operations: found, nextCursor: page.next } : { operations: found };
  }

  return {
    id: AccountDataSourceIdSchema.parse("coin-module"),
    supports(descriptor: AccountDescriptor, kind: AccountDataKind) {
      const family = familyOf(descriptor);
      const served = config.families[kind];
      if (family === undefined || served === undefined) return false;
      for (const each of served()) if (each === family) return true;
      return false;
    },
    read: { balance, operations },
  } satisfies AccountDataSource;
}
