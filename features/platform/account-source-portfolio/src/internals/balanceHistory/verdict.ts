import type {
  AccountBalanceHistory,
  BalanceHistoryRange,
} from "@domain/entity-account-balance-history";
import type { AddressAccountDescriptor } from "@domain/entity-account-descriptor";
import { toAssetHistories } from "./map";
import type { HistoryRead } from "./read";

export type Verdict =
  | { status: "served"; history: AccountBalanceHistory; detail?: string }
  | { status: "failed"; detail: string };

export function verdictOf(
  descriptor: AddressAccountDescriptor,
  range: BalanceHistoryRange,
  { groups, truncated }: Pick<HistoryRead, "groups" | "truncated">,
): Verdict {
  if (truncated) return { status: "failed", detail: "The history read stopped before its end" };
  if (groups.some(group => !("items" in group))) {
    return { status: "failed", detail: "The service failed its group" };
  }
  const points = groups.flatMap(group => ("items" in group ? group.items : []));
  const { series, unmapped, unreadable } = toAssetHistories(descriptor, points);
  if (unreadable > 0) {
    return { status: "failed", detail: `${unreadable} assets with an unreadable point` };
  }
  const detail = unmapped > 0 ? `${unmapped} token points without a CAL id left out` : undefined;
  return { status: "served", history: { range, series }, detail };
}
