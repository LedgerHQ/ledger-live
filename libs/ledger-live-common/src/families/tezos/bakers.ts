import type { AccountLike } from "@ledgerhq/types-live";
import { loadBaker } from "@ledgerhq/coin-tezos/network/bakers";
import type { Delegation } from "./types";

export function getAccountDelegationSync(account: AccountLike): Delegation | null | undefined {
  const op = account.operations.find(
    op => !op.hasFailed && (op.type === "DELEGATE" || op.type === "UNDELEGATE"),
  );
  const pendingOp = account.pendingOperations
    .filter(op => !account.operations.some(o => op.hash === o.hash))
    .find(op => op.type === "DELEGATE" || op.type === "UNDELEGATE");
  const isPending = !!pendingOp;
  const operation = pendingOp && pendingOp.type === "DELEGATE" ? pendingOp : op;

  if (!operation || operation.type === "UNDELEGATE") {
    return null;
  }

  const recentOps = account.operations
    .filter(op => op.date > operation.date)
    .concat(account.pendingOperations);
  const sendShouldWarnDelegation = !recentOps.some(op => op.type === "OUT");
  const receiveShouldWarnDelegation = !recentOps.some(op => op.type === "IN");
  return {
    isPending,
    operation,
    address: operation.recipients[0],
    baker: null,
    sendShouldWarnDelegation,
    receiveShouldWarnDelegation,
  };
}

export function isAccountDelegating(account: AccountLike): boolean {
  return !!getAccountDelegationSync(account);
}

export async function loadAccountDelegation(
  account: AccountLike,
): Promise<Delegation | null | undefined> {
  const delegation = getAccountDelegationSync(account);
  if (!delegation) return null;
  const baker = await loadBaker(delegation.address);
  return { ...delegation, baker };
}
