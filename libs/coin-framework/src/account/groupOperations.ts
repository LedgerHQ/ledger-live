import { flattenAccounts } from "./helpers";
import { flattenOperationWithInternalsAndNfts } from "../operation";
import type {
  AccountLike,
  AccountLikeArray,
  DailyOperations,
  Operation,
} from "@ledgerhq/types-live";

function startOfDay(t: Date) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

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
  account.operations.some((op) => op.hash === hash);

/**
 * @memberof account
 */
export function groupAccountsOperationsByDay(
  inputAccounts: AccountLikeArray,
  { count, withSubAccounts, filterOperation }: GroupOpsByDayOpts
): DailyOperations {
  const accounts = withSubAccounts
    ? flattenAccounts(inputAccounts)
    : inputAccounts;
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

      if (op && (!bestOp || op.date > bestOp.date)) {
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

      if (opP && (!bestOp || opP.date > bestOp.date)) {
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
  }

  return {
    sections,
    completed: !next,
  };
}

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof account
 */
export function groupAccountOperationsByDay(
  account: AccountLike,
  arg: GroupOpsByDayOpts
): DailyOperations {
  const accounts: AccountLike[] = [account];
  return groupAccountsOperationsByDay(accounts, arg);
}
