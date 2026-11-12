import type {
  AccountBalanceHistory,
  BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { Fiat } from "../fiat";
import { toAssetHistories } from "./map";
import type { HistoryRead } from "./read";

export type Verdict =
  | { status: "served"; history: AccountBalanceHistory; detail?: string }
  | { status: "failed"; detail: string };

/** Every point names its group's account and network: a group is picked by its account id only. */
const isOwnedBy =
  (group: { account_id: string; network: string }) =>
  (point: { account_id: string; network: string }) =>
    point.account_id === group.account_id && point.network === group.network;

/** A failed group, told by its `error` even when it carries points, or one holding another account's points serves none. */
export function verdictOf(
  descriptor: AccountDescriptor,
  range: BalanceHistoryRange,
  { groups, truncated }: Pick<HistoryRead, "groups" | "truncated">,
  fiat?: Fiat,
): Verdict {
  if (truncated) return { status: "failed", detail: "The history read stopped before its end" };
  const points = [];
  for (const group of groups) {
    if ("error" in group) return { status: "failed", detail: "The service failed its group" };
    if (!group.items.every(isOwnedBy(group))) {
      return { status: "failed", detail: "The service answered with another account's history" };
    }
    points.push(...group.items);
  }
  const { series, unmapped, unreadable } = toAssetHistories(descriptor, points, fiat);
  if (unreadable > 0) {
    return { status: "failed", detail: `${unreadable} assets with an unreadable point` };
  }
  const detail = unmapped > 0 ? `${unmapped} token points without a CAL id left out` : undefined;
  return { status: "served", history: { range, series }, detail };
}
