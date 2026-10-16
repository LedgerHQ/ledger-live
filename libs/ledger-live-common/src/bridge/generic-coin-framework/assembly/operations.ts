import type {
  Operation as CoreOperation,
  ListOperationsOptions,
  Page,
} from "@ledgerhq/coin-module-framework/api/types";
import type { OperationHistoryBound } from "../operationHistoryBound";
import { paginateOperations, type PaginateOperationsResult } from "../paginateOperations";

const NFT_OPERATION_TYPES: ReadonlySet<string> = new Set(["NFT_IN", "NFT_OUT"]);

/** The type an operation shows: the coin module's own `ledgerOpType` first. */
function shownType(operation: CoreOperation): string {
  const ledgerOpType = operation.details?.ledgerOpType;
  return typeof ledgerOpType === "string" ? ledgerOpType : operation.type;
}

export function isNftCoreOp(operation: CoreOperation): boolean {
  const ledgerOpType = operation.details?.ledgerOpType;
  return typeof ledgerOpType === "string" && NFT_OPERATION_TYPES.has(ledgerOpType);
}

export function isIncomingCoreOp(operation: CoreOperation): boolean {
  return shownType(operation) === "IN";
}

/** Whether a sync keeps an operation it lists: neither an NFT transfer nor a failed incoming one. */
export function isListedCoreOp(operation: CoreOperation): boolean {
  return !isNftCoreOp(operation) && (!isIncomingCoreOp(operation) || !operation.tx.failed);
}

/**
 * Same date: by coin module id, numerically, so `<hash>-OUT-2` comes before `<hash>-OUT-10`. An
 * operation without a date (or an id) keeps its listing order on that key.
 */
function newestFirst(a: CoreOperation, b: CoreOperation): number {
  const [timeA, timeB] = [a.tx.date?.getTime(), b.tx.date?.getTime()];
  const byDate = timeA === undefined || timeB === undefined ? 0 : timeB - timeA;
  return byDate !== 0 ? byDate : (a.id ?? "").localeCompare(b.id ?? "", "en", { numeric: true });
}

/**
 * The operations a sync lists, whichever path listed them: NFT transfers and failed incoming
 * operations left out, newest first. Operations sharing a date take one order on both paths (the
 * local history orders them by id, a coin module by its own listing), which also keeps the emission
 * order of a coin module's per-recipient ids, so the sub-operation indexes of `adaptOperations`
 * match.
 */
export function listedOperations(core: CoreOperation[]): CoreOperation[] {
  return core.filter(isListedCoreOp).sort(newestFirst);
}

/**
 * Walks a coin module's listing from `minHeight`, newest first, under the operation history bound,
 * as both paths walk it: every page asks for `pageSize` operations (`limit`, sent only to a family
 * whose support is established, never `undefined`), the operations a sync leaves out are dropped
 * per page, before `maxOperations` counts them (a prefix made only of those would otherwise stop the
 * walk and retain nothing), and `paginateOperations` stops on that bound at a block boundary
 * (`bounded`). An empty page carrying a cursor is followed, a run of them is bounded by its
 * empty-page budget, and a cursor served twice fails the walk.
 */
export function walkListing(
  list: (options: ListOperationsOptions) => Promise<Page<CoreOperation>>,
  minHeight: number,
  { maxOperations, pageSize }: OperationHistoryBound,
): Promise<PaginateOperationsResult<CoreOperation>> {
  return paginateOperations(
    cursor =>
      list({
        minHeight,
        cursor,
        order: "desc",
        ...(pageSize === undefined ? {} : { limit: pageSize }),
      }).then(page => ({ ...page, items: page.items.filter(isListedCoreOp) })),
    maxOperations,
    op => op.tx.block?.height,
    op => op.tx.date?.getTime(),
  );
}
