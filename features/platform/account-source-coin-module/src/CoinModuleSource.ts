import type {
  AssetInfo,
  Balance,
  Operation,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { AccountDataSource, AccountTarget } from "@domain/api-account-data-source";
import type { AccountId, AnyAccountId, TokenAccountId } from "@domain/entity-account";
import {
  accountKeyOf,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  AccountBalanceSchema,
  AmountStrSchema,
  type AccountBalance,
} from "@domain/entity-account-balance";
import type { AccountDatum } from "@domain/entity-account-data";
import {
  AccountOperationSchema,
  OperationAmountSchema,
  type AccountOperation,
  type AccountOperationsPage,
  type AccountOperationsQuery,
} from "@domain/entity-account-operations";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { DateTimeIsoSchema } from "@shared/schema-primitives";

/** One currency's coin module, with its context already bound. */
export type CoinModule = {
  getBalance(address: string): Promise<Balance[]>;
  listOperations(address: string, query: AccountOperationsQuery): Promise<Page<Operation>>;
  /** The token an asset is, or `undefined` when the wallet does not know it. */
  tokenOf(asset: AssetInfo): Promise<{ id: string } | undefined>;
};

export type CoinModuleSourceConfig = {
  loadCoinModule(currencyId: string): Promise<CoinModule>;
  /**
   * The families this source serves, per datum. A family served for `balance` says nothing about
   * `operations`: each is gated on its own parity. A datum left out is not served.
   */
  families: Partial<Record<AccountDatum, () => Iterable<string>>>;
  /** The legacy token account id encoding, injected so it lives in one place. */
  tokenAccountIdOf(parentId: AccountId, tokenId: string): TokenAccountId;
  blacklistedTokenIds?(): readonly string[];
};

// Operation types whose native value is reported without the fee the account also paid.
const FEE_BEARING_TYPES = new Set(["OUT", "FEES", "DELEGATE", "UNDELEGATE", "REDELEGATE"]);

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(item => typeof item === "string") ? value : undefined;
}

function operationValue(operation: Operation): bigint {
  const { fees, failed } = operation.tx;
  if (failed) return fees;
  if (operation.asset.type === "native" && FEE_BEARING_TYPES.has(operation.type)) {
    return operation.value + fees;
  }
  return operation.value;
}

function throwIfAborted(signal: AbortSignal | undefined): void {
  if (signal?.aborted) throw new DOMException("aborted before the read started", "AbortError");
}

/** What the coin module is asked about: the account's currency, and the key it reads it by. */
function coinModuleInputOf({ descriptor }: AccountTarget) {
  return {
    currencyId: currencyIdFromNetwork(descriptor.network),
    address: accountKeyOf(descriptor),
  };
}

/** Reads straight from a coin module: one `getBalance` or one `listOperations` page, no full sync. */
export class CoinModuleSource implements AccountDataSource {
  readonly id = "coin-module";

  constructor(private readonly config: CoinModuleSourceConfig) {}

  supports(descriptor: AccountDescriptor, datum: AccountDatum): boolean {
    const families = this.config.families[datum];
    if (families === undefined) return false;
    let family: string | undefined;
    try {
      family = findCryptoCurrencyById(currencyIdFromNetwork(descriptor.network))?.family;
    } catch {
      return false;
    }
    if (family === undefined) return false;
    for (const served of families()) if (served === family) return true;
    return false;
  }

  /** `supports` for any datum this source serves: the same coin module answers the question. */
  supportsExists(descriptor: AccountDescriptor): boolean {
    return this.supports(descriptor, "operations") || this.supports(descriptor, "balance");
  }

  /** One operation is enough to say yes; a non-zero balance covers an account with no history. */
  async exists(target: AccountTarget, signal?: AbortSignal): Promise<boolean> {
    throwIfAborted(signal);
    const { currencyId, address } = coinModuleInputOf(target);
    const coinModule = await this.config.loadCoinModule(currencyId);
    const page = await coinModule.listOperations(address, { limit: 1 });
    if (page.items.length > 0) return true;
    throwIfAborted(signal);
    const balances = await coinModule.getBalance(address);
    return balances.some(balance => balance.value > 0n);
  }

  async balance(
    target: AccountTarget,
    _query: undefined,
    signal?: AbortSignal,
  ): Promise<AccountBalance[]> {
    throwIfAborted(signal);
    const { currencyId, address } = coinModuleInputOf(target);
    const coinModule = await this.config.loadCoinModule(currencyId);
    const balances = await coinModule.getBalance(address);
    const at = DateTimeIsoSchema.parse(new Date().toISOString());
    const blacklisted = new Set(this.config.blacklistedTokenIds?.() ?? []);

    const native = balances.find(balance => balance.asset.type === "native");
    const tokenRows = await Promise.all(
      balances
        .filter(balance => balance.asset.type !== "native")
        .map(async balance => {
          const token = await coinModule.tokenOf(balance.asset);
          if (!token || blacklisted.has(token.id)) return undefined;
          return this.toBalance(balance, {
            accountId: this.config.tokenAccountIdOf(target.accountId, token.id),
            assetId: token.id,
            parentId: target.accountId,
            at,
          });
        }),
    );

    return [
      this.toBalance(native ?? { asset: { type: "native" }, value: 0n }, {
        accountId: target.accountId,
        assetId: currencyId,
        at,
      }),
      ...tokenRows.filter((row): row is AccountBalance => row !== undefined),
    ];
  }

  async operations(
    target: AccountTarget,
    query: AccountOperationsQuery | undefined,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage> {
    throwIfAborted(signal);
    const { currencyId, address } = coinModuleInputOf(target);
    const coinModule = await this.config.loadCoinModule(currencyId);
    const page = await coinModule.listOperations(address, query ?? {});
    const rows = await Promise.all(
      page.items.map(item => this.toOperation(target, coinModule, item)),
    );
    // `listOperations` reports against the address, so token operations are fanned out to their
    // token account here, as the full sync does for its sub-operations.
    const operations = rows.filter((row): row is AccountOperation => row !== undefined);
    // Falsy means the stream is exhausted, per the coin module contract.
    return page.next
      ? { operations, nextCursor: page.next, complete: false }
      : { operations, complete: true };
  }

  private toBalance(
    { value, locked }: Pick<Balance, "value" | "locked">,
    row: { accountId: AnyAccountId; assetId: string; parentId?: AccountId; at: string },
  ): AccountBalance {
    const spendable = locked === undefined ? value : value - locked;
    return AccountBalanceSchema.parse({
      ...row,
      balance: AmountStrSchema.parse(value.toString()),
      spendableBalance: AmountStrSchema.parse((spendable < 0n ? 0n : spendable).toString()),
    });
  }

  private async toOperation(
    target: AccountTarget,
    coinModule: CoinModule,
    operation: Operation,
  ): Promise<AccountOperation | undefined> {
    const { currencyId } = coinModuleInputOf(target);
    const isNative = operation.asset.type === "native";
    const token = isNative ? undefined : await coinModule.tokenOf(operation.asset);
    if (!isNative && !token) return undefined;

    const accountId = token
      ? this.config.tokenAccountIdOf(target.accountId, token.id)
      : target.accountId;
    const { hash, fees, failed, block, date } = operation.tx;
    return AccountOperationSchema.parse({
      id: `${accountId}-${hash}-${operation.type}`,
      accountId,
      assetId: token ? token.id : currencyId,
      hash,
      type: operation.type,
      value: OperationAmountSchema.parse(operationValue(operation).toString()),
      fee: OperationAmountSchema.parse(fees.toString()),
      senders: stringArray(operation.details?.parentSenders) ?? operation.senders,
      recipients: stringArray(operation.details?.parentRecipients) ?? operation.recipients,
      blockHeight: block.height ?? null,
      date: DateTimeIsoSchema.parse(date.toISOString()),
      hasFailed: failed,
    });
  }
}
