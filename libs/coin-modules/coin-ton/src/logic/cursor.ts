import { InvalidParameterError } from "@ledgerhq/coin-module-framework/errors";

export type HistoryOrder = "asc" | "desc";

export type SourcePage = {
  utimes: number[];
  full: boolean;
};

export type PageCut = { consumed: number[]; next: number | undefined } | { crowdedSecond: number };

export function parseCursor(cursor: string | undefined): number | undefined {
  if (!cursor) return undefined;
  const second = Number(cursor);
  if (!/^\d+$/.test(cursor) || !Number.isSafeInteger(second)) {
    throw new InvalidParameterError(`Invalid TON history cursor: ${cursor}`);
  }
  return second;
}

/**
 * Emits whole seconds only: the indexer orders the jetton rows of one second differently from one
 * request to the next, so a page cannot resume inside one. The page stops before the boundary
 * second, the latest (`desc`) or earliest (`asc`) last `utime` among full sources, and the next
 * page starts at it. A full source holding only that second makes it a `crowdedSecond`.
 */
export function cutPage(order: HistoryOrder, sources: SourcePage[]): PageCut {
  const lastOfFull = sources.flatMap(({ utimes, full }) => {
    const last = utimes.at(-1);
    return full && last !== undefined ? [last] : [];
  });
  if (lastOfFull.length === 0) {
    return { consumed: sources.map(({ utimes }) => utimes.length), next: undefined };
  }

  const boundary = order === "desc" ? Math.max(...lastOfFull) : Math.min(...lastOfFull);
  const reachesBoundary = (utime: number) =>
    order === "desc" ? utime <= boundary : utime >= boundary;
  const consumed = sources.map(({ utimes }) => {
    const index = utimes.findIndex(reachesBoundary);
    return index === -1 ? utimes.length : index;
  });

  return consumed.every(count => count === 0)
    ? { crowdedSecond: boundary }
    : { consumed, next: boundary };
}
