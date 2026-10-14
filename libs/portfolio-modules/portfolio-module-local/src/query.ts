import {
  pageOf,
  type Ordering,
  type PageQuery,
  type PageView,
  type ReadFilter,
} from "@ledgerhq/portfolio-module-framework";
import type { StoredAccount } from "./types";

export const accountsMatching = (
  accounts: StoredAccount[],
  { network, account }: ReadFilter,
): StoredAccount[] =>
  accounts.filter(
    stored =>
      (network === undefined || stored.network === network) &&
      (account === undefined || stored.id === account),
  );

export function inOrder<T>(items: T[], compareAscending: (a: T, b: T) => number, order: Ordering) {
  const ascending = [...items].sort(compareAscending);
  return order === "ASC" ? ascending : ascending.reverse();
}

export const pageFrom = <T>(items: T[], query: PageQuery, defaultSize: number): PageView<T> =>
  pageOf(items, {
    size: query.size ?? defaultSize,
    ...(query.token === undefined ? {} : { token: query.token }),
  });
