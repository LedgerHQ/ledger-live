import { ListOperationsOptions, Operation, Page } from "@ledgerhq/coin-module-framework/api/types";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
import { listOperations } from "./listOperations";

type PaginationState = {
  readonly pageSize: number;
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation[];
};

export async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<Page<Operation>> {
  const state: PaginationState = {
    pageSize: 200,
    heightLimit: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  // unfortunately, the stellar API does not support an option to filter by min height
  // so the only strategy to get ALL operations is to iterate over all of them in descending order
  // until we reach the desired minHeight
  while (state.continueIterations) {
    const options: ListOperationsOptions = { limit: state.pageSize, order: "desc", minHeight };
    if (state.apiNextCursor) {
      options.cursor = state.apiNextCursor;
    }
    try {
      const { items: operations, next: nextCursor } = await listOperations(address, options);
      state.accumulator.push(...operations);
      state.apiNextCursor = nextCursor ?? "";
      state.continueIterations = !!nextCursor;
    } catch (e: unknown) {
      if (e instanceof LedgerAPI4xx && e.status === 429) {
        log("coin:stellar", "(api/operations): TooManyRequests, retrying in 4s");
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        throw e;
      }
    }
  }

  return { items: state.accumulator, next: state.apiNextCursor ? state.apiNextCursor : "" };
}
