import type {
  AssetInfo,
  Balance,
  Operation as CoreOperation,
} from "@ledgerhq/coin-module-framework/api/types";
import type { AccountDataSource } from "@domain/api-account-data-source";
import { AccountIdSchema, encodeTokenAccountId, type AccountRef } from "@domain/entity-account";
import type { AccountDatum } from "@domain/entity-account-data";
import { AccountBalanceSchema, type AccountBalance } from "@domain/entity-account-balance";
import {
  AccountOperationSchema,
  type AccountOperation,
  type AccountOperationsPage,
  type AccountOperationsQuery,
} from "@domain/entity-account-operations";
import { findCryptoCurrencyById } from "@domain/entity-currency-crypto";

/** The coin module, already bound to its context by the app. */
export type CoinModuleApi = {
  getBalance(address: string): Promise<Balance[]>;
  listOperations(
    address: string,
    options: { cursor?: string; limit?: number },
  ): Promise<{ items: CoreOperation[]; next?: string }>;
};

export type CoinModuleSourceHost = {
  loadApi(currencyId: string): Promise<CoinModuleApi>;
  resolveToken(currencyId: string, asset: AssetInfo): Promise<{ id: string } | undefined>;
  /** Which families are read directly, per datum. Injected: this package holds no family list. */
  granular: { balance?: () => Iterable<string>; operations?: () => Iterable<string> };
  blacklistedTokenIds?: () => readonly string[];
};

const FEE_INCLUDED_TYPES: ReadonlySet<string> = new Set([
  "OUT",
  "FEES",
  "DELEGATE",
  "UNDELEGATE",
  "REDELEGATE",
]);

// Same format as the legacy token account id (dash and underscore included), duplicated on purpose:
// this source imports no legacy helper, but both sources must name the same row the same way.
const safeEncodeTokenId = (tokenId: string): string =>
  encodeURIComponent(tokenId).replace(/-/g, "~!dash!~").replace(/_/g, "~!underscore!~");

const nonNegative = (value: bigint): string => (value < 0n ? 0n : value).toString();

/** Direct coin-module reads: no account object, no sync. */
export class CoinModuleSource implements AccountDataSource {
  readonly id = "coin-module";

  constructor(private readonly host: CoinModuleSourceHost) {}

  supports(ref: AccountRef, datum: AccountDatum): boolean {
    if (datum !== "balance" && datum !== "operations") return false;
    const family = findCryptoCurrencyById(ref.currencyId)?.family;
    if (family === undefined) return false;
    return new Set(this.host.granular[datum]?.()).has(family);
  }

  async balance(ref: AccountRef): Promise<AccountBalance[]> {
    const balances = await (await this.host.loadApi(ref.currencyId)).getBalance(ref.address);
    const at = new Date().toISOString();
    const row = (
      accountId: string,
      assetId: string,
      { value, locked }: Pick<Balance, "value" | "locked">,
      parentId?: string,
    ) =>
      AccountBalanceSchema.parse({
        accountId,
        assetId,
        balance: value.toString(),
        spendableBalance: nonNegative(value - (locked ?? 0n)),
        ...(parentId ? { parentId } : {}),
        at,
      });

    const native = balances.find(balance => balance.asset.type === "native");
    const blacklisted = new Set(this.host.blacklistedTokenIds?.());
    const tokenRows = await Promise.all(
      balances
        .filter(balance => balance.asset.type !== "native")
        .map(async balance => {
          const token = await this.host.resolveToken(ref.currencyId, balance.asset);
          if (!token || blacklisted.has(token.id)) return [];
          const tokenAccountId = encodeTokenAccountId(ref.accountId, safeEncodeTokenId(token.id));
          return [row(tokenAccountId, token.id, balance, ref.accountId)];
        }),
    );
    return [row(ref.accountId, ref.currencyId, native ?? { value: 0n }), ...tokenRows.flat()];
  }

  async operations(
    ref: AccountRef,
    { cursor, limit }: AccountOperationsQuery,
  ): Promise<AccountOperationsPage> {
    const page = await (
      await this.host.loadApi(ref.currencyId)
    ).listOperations(ref.address, { cursor, limit });
    const rows = await Promise.all(page.items.map(operation => this.toOperation(ref, operation)));
    const nextCursor = page.next || undefined;
    return {
      operations: rows.flat(),
      ...(nextCursor === undefined ? {} : { nextCursor }),
      complete: nextCursor === undefined,
    };
  }

  private async toOperation(ref: AccountRef, core: CoreOperation): Promise<AccountOperation[]> {
    const isNative = core.asset.type === "native";
    const token = isNative ? undefined : await this.host.resolveToken(ref.currencyId, core.asset);
    if (!isNative && !token) return [];

    const accountId = token
      ? encodeTokenAccountId(ref.accountId, safeEncodeTokenId(token.id))
      : AccountIdSchema.parse(ref.accountId);
    const fees = core.tx.fees;
    const failed = core.tx.failed;
    const feesIncluded = isNative && FEE_INCLUDED_TYPES.has(core.type);
    const value = failed ? fees : feesIncluded ? core.value + fees : core.value;
    return [
      AccountOperationSchema.parse({
        id: `${accountId}-${core.tx.hash}-${core.type}`,
        accountId,
        assetId: token ? token.id : ref.currencyId,
        hash: core.tx.hash,
        type: core.type,
        value: value.toString(),
        fee: fees.toString(),
        senders: stringArray(core.details?.parentSenders) ?? core.senders,
        recipients: stringArray(core.details?.parentRecipients) ?? core.recipients,
        blockHeight: core.tx.block.height ?? null,
        date: core.tx.date.toISOString(),
        ...(failed ? { hasFailed: true } : {}),
      }),
    ];
  }
}

function stringArray(value: unknown): string[] | undefined {
  return Array.isArray(value) && value.every(item => typeof item === "string") ? value : undefined;
}
