import {
  AccountBalanceSchema,
  AmountStrSchema,
  type AccountBalance,
  type BalanceAssetId,
} from "@domain/entity-account-balance";
import { AccountIdSchema, DateTimeIsoSchema, type AccountId } from "@shared/schema-primitives";
import type {
  AccountDataSource,
  AccountRef,
  AccountSlice,
  FetchRequest,
  SliceUpdate,
} from "../port";

/**
 * One asset held at an account's address, as the granular coin-module API reports it.
 *
 * Already keyed by account id: mapping an on-chain asset to the token account that represents it
 * requires the account-id encoding, which lives in the account layer — so the adapter does it and
 * this package never learns the encoding.
 */
export type AssetBalanceRow = {
  accountId: AccountId;
  assetId: BalanceAssetId;
  /** Total held, decimal-encoded, in the asset's smallest unit. */
  value: string;
  /** Non-spendable part of `value` — minimum balance, rent reserve, locked stake. Defaults to `0`. */
  locked?: string;
  /** Set for a token account; absent for the account's native balance. */
  parentId?: AccountId;
};

/**
 * What the app must provide for this source to work: a way to ask a coin module what it can serve,
 * and a way to read every asset an address holds in one call.
 */
export type CoinModuleApiPort = {
  /**
   * Slices the coin module for this currency can serve on its own. Empty when the currency has no
   * granular module — which is how the hardcoded "families with the new API" lists go away: the
   * answer comes from the module, not from a JSON file in the wallet.
   */
  capabilities(ref: AccountRef): ReadonlySet<AccountSlice>;
  /**
   * Every asset balance at `ref.address`, native and tokens alike, in **one** call.
   *
   * That single call is the efficiency argument for this source: a portfolio row showing an account
   * and its twelve token accounts costs one request, not thirteen.
   */
  getBalances(ref: AccountRef, signal?: AbortSignal): Promise<AssetBalanceRow[]>;
};

export const COIN_MODULE_API_SOURCE_ID = "coin-module-api";

const NO_CAPABILITIES: ReadonlySet<AccountSlice> = new Set();

const subtractLocked = (value: string, locked: string | undefined): string => {
  if (!locked || locked === "0") return value;
  const spendable = BigInt(value) - BigInt(locked);
  return (spendable < 0n ? 0n : spendable).toString();
};

const toAccountBalance = (row: AssetBalanceRow, at: string): AccountBalance => {
  // Parsed *before* the arithmetic: `BigInt` throws a bare SyntaxError on a fractional string, so a
  // module reporting "1.5" has to fail validation with a message that names the field instead.
  const value = AmountStrSchema.parse(row.value);
  const locked = row.locked === undefined ? undefined : AmountStrSchema.parse(row.locked);

  return AccountBalanceSchema.parse({
    accountId: AccountIdSchema.parse(row.accountId),
    assetId: row.assetId,
    balance: value,
    spendableBalance: subtractLocked(value, locked),
    ...(row.parentId ? { parentId: AccountIdSchema.parse(row.parentId) } : {}),
    at: DateTimeIsoSchema.parse(at),
  });
};

/**
 * The granular path: read the balance straight off the chain, and stop there.
 *
 * This is the source that makes the whole exercise worth it. It calls `getBalance(address)` and
 * emits balance rows — it never assembles an `Account`, never fetches an operation history, and
 * never pays for a slice nobody asked for. Highest priority of the in-process sources, because per
 * request it is the cheapest thing that can answer the question.
 */
export function createCoinModuleApiSource(
  port: CoinModuleApiPort,
  { priority = 10 }: { priority?: number } = {},
): AccountDataSource {
  // A token account's balance is not independently readable: one chain call returns every asset the
  // *address* holds, so it arrives with the parent's read. Serving a token ref here would key an
  // account-wide `replaceAccountBalances` under a token id and wipe the parent's row set.
  const capabilities = (ref: AccountRef) =>
    ref.parentId ? NO_CAPABILITIES : port.capabilities(ref);

  return {
    id: COIN_MODULE_API_SOURCE_ID,
    priority,

    supports: ref => capabilities(ref).size > 0,

    capabilities,

    // Exactly what was asked for, never more: every read on this source is independently callable,
    // so there is no side-effect data to declare.
    deliveries: capabilities,

    async *fetch({ ref, slices, signal }: FetchRequest): AsyncIterable<SliceUpdate> {
      if (!slices.includes("balance") || !capabilities(ref).has("balance")) return;
      const rows = await port.getBalances(ref, signal);
      const at = new Date().toISOString();
      yield {
        slice: "balance",
        accountId: ref.accountId,
        balances: rows.map(row => toAccountBalance(row, at)),
      };
    },
  };
}
