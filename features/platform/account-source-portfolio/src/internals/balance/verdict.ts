import {
  AccountAssetBalanceSchema,
  type AccountAssetBalance,
} from "@domain/entity-account-balance";
import { currencyIdFromNetwork, type AccountDescriptor } from "@domain/entity-account-descriptor";
import { toAccountBalances } from "./map";
import type { BalanceRead } from "./read";

export type Verdict =
  | { status: "served"; rows: AccountAssetBalance[]; detail?: string }
  | { status: "failed"; detail: string };

/** The native coin comes first in every balance: a synchronized account the service lists without it holds none. */
const zeroNative = (descriptor: AccountDescriptor): AccountAssetBalance =>
  AccountAssetBalanceSchema.parse({
    assetId: descriptor.network,
    balance: "0",
    spendableBalance: "0",
  });

/** Every entry names the group's account and network: the group is picked by its account id only. */
const isOwnedBy =
  (group: { account_id: string; network: string }) =>
  (entry: { account_id: string; network: string }) =>
    entry.account_id === group.account_id && entry.network === group.network;

/**
 * The balance of a synchronized account: no group means it holds nothing; a scan that stopped
 * short, a failed group or one holding another account's entries serves none, so a stored balance is kept.
 */
export function verdictOf(
  descriptor: AccountDescriptor,
  id: string,
  { groups, truncated, failed }: Pick<BalanceRead, "groups" | "truncated" | "failed">,
): Verdict {
  if (failed?.has(id)) return { status: "failed", detail: "Its balance call failed" };
  // A capped scan can have more groups of any account beyond its last page.
  if (truncated) return { status: "failed", detail: "The balance scan stopped before the end" };
  const group = groups.get(id);
  if (!group) return { status: "served", rows: [zeroNative(descriptor)] };
  if ("error" in group) return { status: "failed", detail: "The service failed its group" };
  if (!group.items.every(isOwnedBy(group))) {
    return { status: "failed", detail: "The service answered with another account's balances" };
  }
  const { rows, unmapped, unreadable } = toAccountBalances(descriptor, group.items);
  if (unreadable > 0) {
    return { status: "failed", detail: `${unreadable} assets with an unreadable amount` };
  }
  const detail = unmapped > 0 ? `${unmapped} tokens without a CAL id left out` : undefined;
  const withNative =
    rows[0]?.assetId === currencyIdFromNetwork(descriptor.network)
      ? rows
      : [zeroNative(descriptor), ...rows];
  return { status: "served", rows: withNative, detail };
}
