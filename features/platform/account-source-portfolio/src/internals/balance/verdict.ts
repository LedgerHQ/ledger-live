import type { Portfolio } from "@domain/api-account-portfolio";
import type { AccountAssetBalance } from "@domain/entity-account-balance";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import { serverAccountId } from "../../evm";
import { toAccountBalances } from "./map";
import type { BalanceRead } from "./read";

export type Verdict =
  | { status: "served"; rows: AccountAssetBalance[]; detail?: string }
  | { status: "waiting" | "failed"; detail: string };

export function verdictOf(
  descriptor: AddressAccountDescriptor,
  portfolio: Portfolio,
  { groups, truncated }: Pick<BalanceRead, "groups" | "truncated">,
): Verdict {
  const id = serverAccountId(descriptor);
  const group = groups.get(id);
  if (group) {
    if (!("items" in group)) return { status: "failed", detail: "The service failed its group" };
    const { rows, unmapped, unreadable } = toAccountBalances(descriptor, group.items);
    if (unreadable > 0) {
      return { status: "failed", detail: `${unreadable} assets with an unreadable amount` };
    }
    // A balance without its native coin would understate the account.
    if (rows[0]?.assetId !== descriptor.network) {
      return { status: "waiting", detail: "No native coin balance yet" };
    }
    const detail = unmapped > 0 ? `${unmapped} tokens without a CAL id left out` : undefined;
    return { status: "served", rows, detail };
  }
  const accounts = portfolio.accounts ?? [];
  const account = accounts.find(each => each.id === id);
  if (!account) {
    const address = descriptor.address.toLowerCase();
    return accounts.some(each => each.id.endsWith(`:${address}`))
      ? { status: "failed", detail: `The fan-out tracks no ${descriptor.network} account` }
      : { status: "waiting", detail: "Service account not created yet" };
  }
  if (account.status !== "synchronized") {
    return { status: "waiting", detail: `Service account ${account.status}` };
  }
  if (truncated) return { status: "failed", detail: "The balance scan stopped before it" };
  return { status: "waiting", detail: "No balance for it yet" };
}
