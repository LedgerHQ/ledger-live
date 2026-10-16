import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/types";

/**
 * Every page of a cursor chain, following the `Page` contract: stops on a falsy `next`, or on one
 * already followed; never on an empty page.
 */
export async function* walkPages<T>(
  fetchPage: (cursor: Cursor | undefined) => Promise<Page<T>>,
): AsyncIterable<Page<T>> {
  const followed = new Set<Cursor>();
  let cursor: Cursor | undefined;
  do {
    const page = await fetchPage(cursor);
    yield page;
    cursor = page.next && !followed.has(page.next) ? page.next : undefined;
    if (cursor) followed.add(cursor);
  } while (cursor);
}
