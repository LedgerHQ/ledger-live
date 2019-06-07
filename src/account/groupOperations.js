// @flow
import type {
  Account,
  TokenAccount,
  Operation,
  DailyOperations
} from "../types";
import { flattenAccounts } from "./helpers";

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
  // Returns the most recent operation from the account with current indexes
  function getNextOperation(): ?Operation {
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
      if (account.type === "Account") {
        const opP = account.pendingOperations[indexesPending[i]];
        if (opP && (!bestOp || opP.date > bestOp.date)) {
          bestOp = opP;
          bestOpInfo = { accountI: i, fromPending: true };
        }
      }
    }
    if (bestOp) {
      if (bestOpInfo.fromPending) {
        indexesPending[bestOpInfo.accountI]++;
      } else {
        indexes[bestOpInfo.accountI]++;
      }
    }
    return bestOp;
  }

  let op = getNextOperation();
  if (!op) return emptyDailyOperations;
  const sections = [];
  let day = startOfDay(op.date);
  let data = [];
  for (let i = 0; i < count && op; i++) {
    if (op.date < day) {
      sections.push({ day, data });
      day = startOfDay(op.date);
      data = [op];
    } else {
      data.push(op);
    }
    op = getNextOperation();
  }
  sections.push({ day, data });
  return {
    sections,
    completed: !op
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
