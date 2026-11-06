import { getCoinModuleApi } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/index";
import { buildContext } from "@ledgerhq/live-common/bridge/generic-coin-framework/api/context";
import { resolveOperationHistoryBound } from "@ledgerhq/live-common/bridge/generic-coin-framework/operationHistoryBound";

// One budget for every chain, so that throughputs are comparable
export const HUGE_BUDGET_MS = 2 * 60 * 1000;

export interface Throughput {
  operations: number;
  pageDurations: number[];
  exhausted: boolean;
}

/**
 * A huge account cannot be scanned within the timeout, so we measure how fast its history is read:
 * `listOperations` is walked page by page, as the generic bridge does, until the time budget is
 * spent or the history is exhausted. Operations are counted, not kept.
 */
export async function measureThroughput(
  currencyId: string,
  family: string,
  address: string,
  budgetMs = HUGE_BUDGET_MS,
): Promise<Throughput> {
  const api = await getCoinModuleApi(currencyId, "local");
  const context = buildContext(currencyId);
  // Same page size as the bridge: a `limit` is only sent to the families known to support it
  const { pageSize } = resolveOperationHistoryBound(currencyId, family);
  const start = Date.now();
  const pageDurations: number[] = [];
  const followed = new Set<string>();
  let operations = 0;
  let cursor: string | undefined;

  do {
    const pageStart = Date.now();
    const { items, next } = await api.listOperations(context, address, {
      minHeight: 0,
      cursor,
      order: "desc",
      ...(pageSize !== undefined ? { limit: pageSize } : {}),
    });
    pageDurations.push(Date.now() - pageStart);
    operations += items.length;
    // A falsy `next` ends the stream; an empty page with a `next` does not
    cursor = next || undefined;
    // Same guard as the bridge: re-reading pages would inflate the throughput
    if (cursor && followed.has(cursor)) {
      throw new Error(`Cursor ${cursor} was served twice`);
    }
    if (cursor) followed.add(cursor);
  } while (cursor && Date.now() - start < budgetMs);

  return { operations, pageDurations, exhausted: !cursor };
}
