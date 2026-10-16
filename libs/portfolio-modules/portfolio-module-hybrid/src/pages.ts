import type {
  Ordering,
  PageQuery,
  PageView,
  UpdateView,
} from "@ledgerhq/portfolio-module-framework";
import { orNotFound, portfolioNotFound } from "./portfolios";
import { encodeCursors, type Cursors } from "./token";
import type { Side } from "./types";

export type MergedPage<T> = { items: T[]; nextToken?: string };

/**
 * One page of each side still going, items concatenated in side order. NOT_FOUND on a side counts
 * as an exhausted side, unless every side read answers it.
 */
export async function readSidePages<T>(
  portfolioId: string,
  sides: readonly Side[],
  cursors: Cursors,
  read: (side: Side, token: string | undefined) => Promise<PageView<T>>,
): Promise<MergedPage<T>> {
  const pending = sides.flatMap(side => {
    const cursor = cursors[side];
    return cursor === null ? [] : [{ side, cursor }];
  });
  const results = await Promise.all(
    pending.map(async ({ side, cursor }) => ({ side, page: await orNotFound(read(side, cursor)) })),
  );
  if (results.length > 0 && results.every(({ page }) => page === undefined)) {
    throw portfolioNotFound(portfolioId);
  }
  const next: Cursors = Object.fromEntries(sides.map(side => [side, null]));
  for (const { side, page } of results) next[side] = page?.nextToken || null;
  const items = results.flatMap(({ page }) => page?.items ?? []);
  const exhausted = sides.every(side => next[side] === null);
  return exhausted ? { items } : { items, nextToken: encodeCursors(next) };
}

/** The query a side receives: the hybrid one with that side's own token. */
export const sideQuery = <Q extends PageQuery>(
  { token: _hybridToken, ...query }: Q,
  token: string | undefined,
) => (token === undefined ? query : { ...query, token });

export function sortByTime(updates: UpdateView[], order: Ordering = "DESC"): UpdateView[] {
  const direction = order === "ASC" ? 1 : -1;
  return updates.sort((a, b) => direction * (Date.parse(a.time) - Date.parse(b.time)));
}
