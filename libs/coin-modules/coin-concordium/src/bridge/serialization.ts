import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, AccountRaw, Operation, OperationType } from "@ledgerhq/types-live";
import type { ConcordiumAccount, ConcordiumAccountRaw, RawOperation } from "../types";

export function isConcordiumAccount(account: Account): account is ConcordiumAccount {
  return account.currency?.family === "concordium" && "concordiumResources" in account;
}

function isConcordiumAccountRaw(accountRaw: AccountRaw): accountRaw is ConcordiumAccountRaw {
  return "concordiumResources" in accountRaw;
}

/**
 * Copies concordiumResources from Account to AccountRaw.
 *
 * Note: ConcordiumResources contains only primitives (boolean, string, number),
 * so no transformation is needed - the object can be directly assigned.
 */
export function assignToAccountRaw(account: Account, accountRaw: AccountRaw): void {
  if (!isConcordiumAccount(account) || !account.concordiumResources) {
    return;
  }

  Object.assign(accountRaw, {
    concordiumResources: account.concordiumResources,
  });
}

/**
 * Copies concordiumResources from AccountRaw to Account.
 *
 * Note: ConcordiumResources contains only primitives (boolean, string, number),
 * so no transformation is needed - the object can be directly assigned.
 */
export function assignFromAccountRaw(accountRaw: AccountRaw, account: Account): void {
  if (!isConcordiumAccountRaw(accountRaw) || !accountRaw.concordiumResources) {
    return;
  }

  Object.assign(account, {
    concordiumResources: accountRaw.concordiumResources,
  });
}

export function mapRawOperationToBridgeOperation(op: RawOperation, accountId: string): Operation {
  const type: OperationType = op.type;

  const extra: Record<string, unknown> = op.memo ? { memo: op.memo } : {};

  return {
    id: encodeOperationId(accountId, op.hash, type),
    hash: op.hash,
    accountId,
    type,
    value: new BigNumber(op.value),
    fee: new BigNumber(op.fee),
    blockHash: op.blockHash,
    blockHeight: op.blockHeight,
    senders: [op.sender],
    recipients: [op.recipient],
    date: op.date,
    extra,
  };
}
