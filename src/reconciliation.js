// @flow
// libcore reconciliation by the React definition. https://reactjs.org/docs/reconciliation.html
// TODO move to account/

import isEqual from "lodash/isEqual";
import { BigNumber } from "bignumber.js";
import type {
  Operation,
  OperationRaw,
  Account,
  AccountRaw,
  SubAccount,
  SubAccountRaw
} from "./types";
import {
  fromAccountRaw,
  fromOperationRaw,
  fromSubAccountRaw,
  fromTronResourcesRaw
} from "./account";

const sameOp = (a: Operation, b: Operation) =>
  a === b ||
  (a.id === b.id && // hash, accountId, type are in id
    a.date.getTime() === b.date.getTime() &&
    (a.fee ? a.fee.isEqualTo(b.fee) : a.fee === b.fee) &&
    (a.value ? a.value.isEqualTo(b.value) : a.value === b.value) &&
    isEqual(a.senders, b.senders) &&
    isEqual(a.recipients, b.recipients));

function findExistingOp(ops, op) {
  return ops.find(o => o.id === op.id);
}

// aim to build operations with the minimal diff & call to libcore possible
export async function minimalOperationsBuilder<CO>(
  existingOperations: Operation[],
  coreOperations: CO[],
  buildOp: (coreOperation: CO) => Promise<?Operation>
): Promise<Operation[]> {
  if (existingOperations.length === 0 && coreOperations.length === 0) {
    return existingOperations;
  }
  let operations = [];
  let existingOps = existingOperations || [];

  let immutableOpCmpDoneOnce = false;
  for (let i = coreOperations.length - 1; i >= 0; i--) {
    const coreOperation = coreOperations[i];
    const newOp = await buildOp(coreOperation);
    if (!newOp) continue;
    const existingOp = findExistingOp(existingOps, newOp);

    if (existingOp && !immutableOpCmpDoneOnce) {
      // an Operation is supposedly immutable.
      if (existingOp.blockHeight !== newOp.blockHeight) {
        // except for blockHeight that can temporarily be null
        operations.push(newOp);
        continue; // eslint-disable-line no-continue
      } else {
        immutableOpCmpDoneOnce = true;
        // we still check the first existing op we meet...
        if (!sameOp(existingOp, newOp)) {
          // this implement a failsafe in case an op changes (when we fix bugs)
          // trade-off: in such case, we assume all existingOps are to trash
          console.warn("op mismatch. doing a full clear cache.");
          existingOps = [];
          operations.push(newOp);
          continue; // eslint-disable-line no-continue
        }
      }
    }

    if (existingOp) {
      // as soon as we've found a first matching op in old op list,
      const j = existingOps.indexOf(existingOp);
      const rest = existingOps.slice(j);
      if (rest.length > i + 1) {
        // if libcore happen to have less ops that what we had,
        // we actually need to continue because we don't know where hole will be,
        // but we can keep existingOp
        operations.push(existingOp);
      } else {
        // otherwise we stop the libcore iteration and continue with previous data
        // and we're done on the iteration
        if (operations.length === 0 && j === 0) {
          // special case: we preserve the operations array as much as possible
          operations = existingOps;
        } else {
          operations = operations.concat(rest);
        }
        break;
      }
    } else {
      // otherwise it's a new op
      operations.push(newOp);
    }
  }
  return operations;
}

// SYNC version of the same code...
export function minimalOperationsBuilderSync<CO>(
  existingOperations: Operation[],
  coreOperations: CO[],
  buildOp: (coreOperation: CO) => ?Operation
): Operation[] {
  if (existingOperations.length === 0 && coreOperations.length === 0) {
    return existingOperations;
  }
  let operations = [];
  let existingOps = existingOperations || [];
  let immutableOpCmpDoneOnce = false;
  for (let i = coreOperations.length - 1; i >= 0; i--) {
    const coreOperation = coreOperations[i];
    const newOp = buildOp(coreOperation);
    if (!newOp) continue;
    const existingOp = findExistingOp(existingOps, newOp);
    if (existingOp && !immutableOpCmpDoneOnce) {
      if (existingOp.blockHeight !== newOp.blockHeight) {
        operations.push(newOp);
        continue; // eslint-disable-line no-continue
      } else {
        immutableOpCmpDoneOnce = true;
        if (!sameOp(existingOp, newOp)) {
          console.warn("op mismatch. doing a full clear cache.");
          existingOps = [];
          operations.push(newOp);
          continue; // eslint-disable-line no-continue
        }
      }
    }
    if (existingOp) {
      const j = existingOps.indexOf(existingOp);
      const rest = existingOps.slice(j);
      if (rest.length > i + 1) {
        operations.push(existingOp);
      } else {
        if (operations.length === 0 && j === 0) {
          operations = existingOps;
        } else {
          operations = operations.concat(rest);
        }
        break;
      }
    } else {
      operations.push(newOp);
    }
  }
  return operations;
}

export function patchAccount(
  account: Account,
  updatedRaw: AccountRaw
): Account {
  // id can change after a sync typically if changing the version or filling more info. in that case we consider all changes.
  if (account.id !== updatedRaw.id) return fromAccountRaw(updatedRaw);

  let subAccounts;
  if (updatedRaw.subAccounts) {
    const existingSubAccounts = account.subAccounts || [];
    let subAccountsChanged =
      updatedRaw.subAccounts.length !== existingSubAccounts.length;
    subAccounts = updatedRaw.subAccounts.map(ta => {
      const existing = existingSubAccounts.find(t => t.id === ta.id);
      const patched = patchSubAccount(existing, ta);
      if (patched !== existing) {
        subAccountsChanged = true;
      }
      return patched;
    });
    if (!subAccountsChanged) {
      subAccounts = existingSubAccounts;
    }
  }

  const operations = patchOperations(
    account.operations,
    updatedRaw.operations,
    updatedRaw.id,
    subAccounts
  );

  const pendingOperations = patchOperations(
    account.pendingOperations,
    updatedRaw.pendingOperations,
    updatedRaw.id,
    subAccounts
  );

  const next: Account = { ...account };

  let changed = false;

  if (subAccounts && account.subAccounts !== subAccounts) {
    next.subAccounts = subAccounts;
    changed = true;
  }

  if (account.operations !== operations) {
    next.operations = operations;
    changed = true;
  }

  if (
    account.operationsCount !== updatedRaw.operationsCount &&
    updatedRaw.operationsCount
  ) {
    next.operationsCount = updatedRaw.operationsCount;
    changed = true;
  }

  if (account.pendingOperations !== pendingOperations) {
    next.pendingOperations = pendingOperations;
    changed = true;
  }

  if (updatedRaw.balance !== account.balance.toString()) {
    next.balance = BigNumber(updatedRaw.balance);
    changed = true;
  }

  if (updatedRaw.spendableBalance !== account.spendableBalance.toString()) {
    next.spendableBalance = BigNumber(
      updatedRaw.spendableBalance || updatedRaw.balance
    );
    changed = true;
  }

  if (updatedRaw.lastSyncDate !== account.lastSyncDate.toISOString()) {
    next.lastSyncDate = new Date(updatedRaw.lastSyncDate);
    changed = true;
  }

  if (account.freshAddress !== updatedRaw.freshAddress) {
    next.freshAddress = updatedRaw.freshAddress;
    changed = true;
  }

  if (account.freshAddressPath !== updatedRaw.freshAddressPath) {
    next.freshAddressPath = updatedRaw.freshAddressPath;
    changed = true;
  }

  if (account.blockHeight !== updatedRaw.blockHeight) {
    next.blockHeight = updatedRaw.blockHeight;
    changed = true;
  }

  if (
    updatedRaw.tronResources &&
    account.tronResources !== updatedRaw.tronResources
  ) {
    next.tronResources = fromTronResourcesRaw(updatedRaw.tronResources);
    changed = true;
  }

  if (!changed) return account; // nothing changed at all

  return next;
}

export function patchSubAccount(
  account: ?SubAccount,
  updatedRaw: SubAccountRaw
): SubAccount {
  // id can change after a sync typically if changing the version or filling more info. in that case we consider all changes.
  if (
    !account ||
    account.id !== updatedRaw.id ||
    account.parentId !== updatedRaw.parentId
  ) {
    return fromSubAccountRaw(updatedRaw);
  }

  const operations = patchOperations(
    account.operations,
    updatedRaw.operations,
    updatedRaw.id
  );

  const pendingOperations = patchOperations(
    account.pendingOperations,
    updatedRaw.pendingOperations,
    updatedRaw.id
  );

  // $FlowFixMe destructing union type?
  const next: $Exact<SubAccount> = {
    ...account
  };

  let changed = false;

  if (
    account.operationsCount !== updatedRaw.operationsCount &&
    updatedRaw.operationsCount
  ) {
    next.operationsCount = updatedRaw.operationsCount;
    changed = true;
  }

  if (account.operations !== operations) {
    next.operations = operations;
    changed = true;
  }

  if (account.pendingOperations !== pendingOperations) {
    next.pendingOperations = pendingOperations;
    changed = true;
  }

  if (updatedRaw.balance !== account.balance.toString()) {
    next.balance = BigNumber(updatedRaw.balance);
    changed = true;
  }

  if (!changed) return account; // nothing changed at all

  return next;
}

export function patchOperations(
  operations: Operation[],
  updated: OperationRaw[],
  accountId: string,
  subAccounts: ?(SubAccount[])
): Operation[] {
  return minimalOperationsBuilderSync(
    operations,
    updated.slice(0).reverse(),
    raw => fromOperationRaw(raw, accountId, subAccounts)
  );
}
