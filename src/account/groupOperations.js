// @flow
import type {
  Account,
  TokenAccount,
  Operation,
  DailyOperations
} from "../types";
import { flattenAccounts } from "./helpers";
import { flattenOperationWithInternals } from "../operation";

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const emptyDailyOperations = { sections: [], completed: true };

type GroupOpsByDayOpts = {
  count: number,
  withTokenAccounts?: boolean
};

/**
 * @memberof account
 */
export function groupAccountsOperationsByDay(
  inputAccounts: Account[] | TokenAccount[] | (Account | TokenAccount)[],
  { count, withTokenAccounts }: GroupOpsByDayOpts
): DailyOperations {
  const accounts = withTokenAccounts
    ? flattenAccounts(inputAccounts)
    : inputAccounts;
  // Track indexes of account.operations[] for each account
  const indexes: number[] = Array(accounts.length).fill(0);
  // Track indexes of account.pendingOperations[] for each account
  const indexesPending: number[] = Array(accounts.length).fill(0);
  // Returns the next most recent operation from the account with current indexes
  function getNext(): ?{ ops: Operation[], date: Date } {
    let bestOp: ?Operation;
    let bestOpInfo = { accountI: 0, fromPending: false };
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      // look in operations
      const op = account.operations[indexes[i]];
      if (op && (!bestOp || op.date > bestOp.date)) {
        bestOp = op;
        bestOpInfo = { accountI: i, fromPending: false };
      }
      // look in pending operations
      const opP = account.pendingOperations[indexesPending[i]];
      if (opP && (!bestOp || opP.date > bestOp.date)) {
        bestOp = opP;
        bestOpInfo = { accountI: i, fromPending: true };
      }
    }
    if (bestOp) {
      if (bestOpInfo.fromPending) {
        indexesPending[bestOpInfo.accountI]++;
      } else {
        indexes[bestOpInfo.accountI]++;
      }
      const ops = flattenOperationWithInternals(bestOp);
      return { ops, date: bestOp.date };
    }
  }

  let next = getNext();
  if (!next) return emptyDailyOperations;
  const sections = [];
  let day = startOfDay(next.date);
  let data: Operation[] = [];
  for (let i = 0; i < count && next; i++) {
    if (next.date < day) {
      sections.push({ day, data });
      day = startOfDay(next.date);
      data = next.ops;
    } else {
      data = data.concat(next.ops);
    }
    next = getNext();
  }
  sections.push({ day, data });
  return {
    sections,
    completed: !next
  };
}

/**
 * Return a list of `{count}` operations grouped by day.
 * @memberof account
 */
export function groupAccountOperationsByDay(
  account: Account | TokenAccount,
  arg: GroupOpsByDayOpts
): DailyOperations {
  const accounts: (Account | TokenAccount)[] = [account];
  return groupAccountsOperationsByDay(accounts, arg);
}
