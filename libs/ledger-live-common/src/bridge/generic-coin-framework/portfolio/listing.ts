import type {
  CoinModuleApi,
  ListOperationsOptions,
} from "@ledgerhq/coin-module-framework/api/types";
import type { Context } from "@ledgerhq/coin-module-framework/config";
import { walkListing } from "../assembly/operations";
import type { OperationHistoryBound } from "../operationHistoryBound";

/** No operation history bound: every operation listed, no page size sent. */
export const UNBOUNDED_HISTORY: OperationHistoryBound = Object.freeze({
  maxOperations: undefined,
  pageSize: undefined,
});

/** How the last listing of the local side ended: on the operation history bound, or not. */
export type ListingWalk = { bounded: boolean };

/** The listing of an account the local side syncs: under `bound`, its end told in `walk`. */
export type BoundedListing = { bound: OperationHistoryBound; walk: ListingWalk };

type ListingCoinModule = Pick<CoinModuleApi<any, any, any>, "listOperations">;

/**
 * The coin module the single-address account module syncs with: its own, but for its listing,
 * which walks as the legacy path walks (`walkListing`: the page size of the bound sent as `limit`,
 * the operations a sync leaves out dropped per page, the walk stopped on the bound at a block
 * boundary) and answers that walk as one page. The account module asks for what legacy asks for
 * (the operations above its resume height), so the coin module serves both paths the same pages,
 * and the account stores the same operations. `walk` tells whether the bound stopped it.
 */
export function boundedListingModule<M extends ListingCoinModule>(
  coinModuleApi: M,
  { bound, walk }: BoundedListing,
): M {
  const listOperations: ListingCoinModule["listOperations"] = async (
    context: Context<any>,
    address: string,
    { minHeight }: ListOperationsOptions,
  ) => {
    const { items, bounded } = await walkListing(
      options => coinModuleApi.listOperations(context, address, options),
      minHeight,
      bound,
    );
    walk.bounded = bounded;
    return { items };
  };
  return new Proxy(coinModuleApi, {
    get: (target, key, receiver) =>
      key === "listOperations" ? listOperations : Reflect.get(target, key, receiver),
  });
}
