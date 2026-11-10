import type { AccountLike, Operation } from "@ledgerhq/types-live";
import { classifyOperation } from "./classifyOperation";

const TOKEN_INTERNAL_FIELD = "assetReference";

type SharedInternalInflow = {
  internal: Operation;
  index: number;
  lastParent: Operation;
};

function isTokenInternal({ extra }: Operation): boolean {
  return typeof extra === "object" && extra !== null && TOKEN_INTERNAL_FIELD in extra;
}

function isNativeInternalInflow(operation: Operation): boolean {
  return !isTokenInternal(operation) && classifyOperation(operation) === "inflow";
}

function internalInflowId(parent: Operation, index: number): string {
  return `${parent.id}:internal-${index}`;
}

function signInternalInflow({ id, type, date, value }: Operation): string {
  return `${id}:${type}:${date.getTime()}:${value.toFixed()}`;
}

export type CostBasisOperations = {
  operations: Operation[];
  /** Changes whenever a native internal receive is added, removed or corrected. */
  internalInflowsSignature: string;
};

/**
 * Top-level operations plus the native internal receives of their transactions.
 * Each receive becomes an operation of its own, whose id sorts right after the last parent
 * that carries it, so the reducer, its bookmark and the cache all share one ordering.
 */
export function getCostBasisOperations(account: AccountLike): CostBasisOperations {
  const sharedInflows = new Map<string, SharedInternalInflow>();

  for (const parent of account.operations) {
    (parent.internalOperations ?? []).forEach((internal, index) => {
      if (!isNativeInternalInflow(internal)) return;
      const inflowKey = `${internal.hash}:${internal.type}:${index}`;
      const known = sharedInflows.get(inflowKey);
      if (known && parent.id <= known.lastParent.id) return;
      sharedInflows.set(inflowKey, {
        internal: known?.internal ?? internal,
        index,
        lastParent: parent,
      });
    });
  }

  const internalInflows = [...sharedInflows.values()].map(({ internal, index, lastParent }) => ({
    ...internal,
    id: internalInflowId(lastParent, index),
  }));

  return {
    operations: [...account.operations, ...internalInflows],
    internalInflowsSignature: internalInflows.map(signInternalInflow).join("|"),
  };
}
