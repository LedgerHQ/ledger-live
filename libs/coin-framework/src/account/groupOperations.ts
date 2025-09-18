import type {
  AccountLike,
  AccountLikeArray,
  DailyOperations,
  Operation,
} from "@ledgerhq/types-live";
import { flattenOperationWithInternalsAndNfts } from "../operation";
import { flattenAccounts } from "./helpers";
import { startOfDay } from "./balanceHistoryCache";

const emptyDailyOperations = {
  sections: [],
  completed: true,
};
type GroupOpsByDayOpts = {
  count: number;
  withSubAccounts?: boolean;
  filterOperation?: (arg0: Operation, arg1: AccountLike) => boolean;
};

const hasStableOperation = (account: AccountLike, hash: string) =>
  account.operations.some(op => op.hash === hash);

/**
 * Compares two operations to determine if the first one (`op1`) is more recent than the second (`op2`).
 * This is used to sort operations in descending chronological order.
 *
 * - First compares by `date` (newer dates come first).
 * - If both operations have the same `date`, and both define `transactionSequenceNumber`,
 *   the one with the higher sequence number is considered more recent.
 * - If only one operation has a defined `transactionSequenceNumber`, it is prioritized
 *   over the one that does not (under the assumption it's more precisely ordered).
 * - If neither has a defined sequence, fallback returns `false` (preserving existing order).
 *
 * @param op1 - First operation
 * @param op2 - Second operation
 * @returns `true` if `op1` should come before `op2`, `false` otherwise
 */
function compareOps(op1: Operation, op2: Operation): boolean {
  if (op1.date > op2.date) return true;
  if (op1.date < op2.date) return false;

  const seq1 = op1.transactionSequenceNumber;
  const seq2 = op2.transactionSequenceNumber;

  if (seq1 !== undefined && seq2 !== undefined) {
    return seq1 > seq2;
  }

  if (seq1 !== undefined && seq2 === undefined) return true;
  if (seq1 === undefined && seq2 !== undefined) return false;

  return false;
}

/**
 * Groups operations from one or more accounts into day-based sections,
 * ordered from most recent to oldest.
 *
 * This function collects operations incrementally, scanning one operation
 * at a time per account in a round-robin fashion (including subaccounts if enabled).
 * In each round, it picks the most recent operation based on:
 * - `date` (newer comes first)
 * - `transactionSequenceNumber` (higher means more recent, used as a tiebreaker when dates are equal)
 *
 * The process stops once the requested `count` of operations has been collected.
 * Pending operations are included unless:
 * - They are duplicates of confirmed operations (based on `hash`)
 * - They are filtered out via the optional `filterOperation` callback
 *
 * ⚠️ Due to its round-by-account design, operations from the same account
 * are not compared against each other in the same pass. This may lead to
 * chronological inconsistencies if relying solely on `transactionSequenceNumber`
 * for intra-account ordering. Consider sorting operations manually if strict ordering is required.
 *
 * @param inputAccounts - A list of accounts (or parent accounts) to pull operations from
 * @param options - Options to configure grouping behavior
 * @param options.count - Maximum number of operations to include in the result
 * @param options.withSubAccounts - Whether to include subaccounts in the input set
 * @param options.filterOperation - Optional function to selectively include/exclude operations
 *
 * @returns A `DailyOperations` object containing:
 * - `sections`: An array of `{ day, data[] }` groups
 * - `completed`: Boolean indicating whether fewer operations were available than requested
 *
 * @memberof account
 */
export function groupAccountsOperationsByDay(
  inputAccounts: AccountLikeArray,
  { count, withSubAccounts, filterOperation }: GroupOpsByDayOpts,
): DailyOperations {
  const accounts = withSubAccounts ? flattenAccounts(inputAccounts) : inputAccounts;
  // Track indexes of account.operations[] for each account
  const indexes: number[] = Array(accounts.length).fill(0);
  // Track indexes of account.pendingOperations[] for each account
  const indexesPending: number[] = Array(accounts.length).fill(0);

  // Returns the next most recent operation from the account with current indexes
  function getNext():
    | {
        ops: Operation[];
        date: Date;
      }
    | null
    | undefined {
    let bestOp: Operation | null | undefined;
    let bestOpInfo = {
      accountI: 0,
      fromPending: false,
    };

    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      // look in operations
      let op = account.operations[indexes[i]];

      if (filterOperation) {
        // skip operation we want to filter out
        while (op && !filterOperation(op, account)) {
          op = account.operations[++indexes[i]];
        }
      }

      if (op && (!bestOp || compareOps(op, bestOp))) {
        bestOp = op;
        bestOpInfo = {
          accountI: i,
          fromPending: false,
        };
      }

      // look in pending operations
      let opP = account.pendingOperations[indexesPending[i]];

      while (
        opP && // skip all pending operations that are already in operations
        (hasStableOperation(account, opP.hash) || // but also if we want to filter it
          (filterOperation && !filterOperation(opP, account)))
      ) {
        opP = account.pendingOperations[++indexesPending[i]];
      }

      if (opP && (!bestOp || compareOps(opP, bestOp))) {
        bestOp = opP;
        bestOpInfo = {
          accountI: i,
          fromPending: true,
        };
      }
    }

    if (bestOp) {
      if (bestOpInfo.fromPending) {
        indexesPending[bestOpInfo.accountI]++;
      } else {
        indexes[bestOpInfo.accountI]++;
      }

      const ops = flattenOperationWithInternalsAndNfts(bestOp);
      return {
        ops,
        date: bestOp.date,
      };
    }
  }

  let next = getNext();
  if (!next) return emptyDailyOperations;
  const sections: Array<{
    day: Date;
    data: Operation[];
  }> = [];
  let totalOperations = 0;
  let day = startOfDay(next.date);
  let data: Operation[] = [];

  while (totalOperations < count && next) {
    if (next.date < day) {
      if (data.length > 0) {
        const slicedData = data.slice(0, count - totalOperations);
        sections.push({
          day,
          data: slicedData,
        });
        totalOperations += slicedData.length;
      }

      day = startOfDay(next.date);
      data = next.ops;
    } else {
      data = data.concat(next.ops);
    }

    next = getNext();
  }

  if (data.length > 0 && totalOperations < count) {
    sections.push({
      day,
      data,
    });
    data = [];
  }
  return {
    sections,
    completed: !next && data.length === 0,
  };
}

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof account
 */
export function groupAccountOperationsByDay(
  account: AccountLike,
  arg: GroupOpsByDayOpts,
): DailyOperations {
  const accounts: AccountLike[] = [account];
  return groupAccountsOperationsByDay(accounts, arg);
}
