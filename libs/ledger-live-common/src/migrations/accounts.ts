import type { Account, AccountLike, SubAccount } from "../types";
import type { SwapOperation } from "../exchange/swap/types";
import {
  encodeTokenAccountId,
  decodeTokenAccountId,
  decodeAccountId,
} from "../account";
import { encodeOperationId, decodeOperationId } from "../operation";

function sameSwap(a: SwapOperation, b: SwapOperation) {
  return (
    a.operationId === b.operationId &&
    a.receiverAccountId === b.receiverAccountId &&
    a.tokenId === b.tokenId
  );
}

export const implicitMigration = (accounts: Account[]): Account[] => {
  // this infer the next account id following ongoing libcore->js migration
  function targetEthereumJSaccountId(a: AccountLike) {
    if (a.type === "Account") {
      const decoded = decodeAccountId(a.id);

      if (decoded.type !== "libcore") {
        return a.id;
      }

      // currently there were only ethereum migration
      if (decoded.currencyId !== "ethereum") {
        return a.id;
      }

      return `js:2:${decoded.currencyId}:${a.freshAddress}:${decoded.derivationMode}`;
    } else if (a.type === "TokenAccount") {
      const parent = accounts.find((p) => p.id === a.parentId);

      if (parent) {
        const { token } = decodeTokenAccountId(a.id);
        if (!token) return a.id;
        return encodeTokenAccountId(targetEthereumJSaccountId(parent), token);
      }
    }

    return a.id;
  }

  function migrateSwapHistory<A extends AccountLike>(a: A): A {
    const { swapHistory } = a;
    // duplicate the history of "ethereum libcore:" into a "ethereum js:" one
    // we keep both libcore and js ids because there is going to be a transient time where some accounts will still be in libcore before migration.. we can consider clean up later.
    const all = swapHistory.slice(0);
    swapHistory.forEach((swap) => {
      let copy;
      // migrate swap.operationId
      const accountId = targetEthereumJSaccountId(a);
      const parts = decodeOperationId(swap.operationId);
      const newId = encodeOperationId(accountId, parts.hash, parts.type);

      if (newId !== swap.operationId) {
        if (!copy) copy = { ...swap };
        copy.operationId = newId;
      }

      // migrate swap.receiverAccountId
      const receiverAccount = accounts.find(
        (a) => a.id === swap.receiverAccountId
      );

      if (receiverAccount) {
        const newId = targetEthereumJSaccountId(receiverAccount);

        if (newId !== swap.receiverAccountId) {
          if (!copy) copy = { ...swap };
          copy.receiverAccountId = newId;
        }
      }

      // if a change was expected, update. but only if it was not already there
      const newOp = copy;

      if (newOp && !all.some((s) => sameSwap(s, newOp))) {
        all.push(newOp);
      }
    });

    // also migrate sub accounts
    if (a.type === "Account") {
      const { subAccounts } = <Account>a;

      if (subAccounts) {
        const copy: SubAccount[] = subAccounts.map(migrateSwapHistory);

        // only clone a if one sub account have changes
        if (copy.some((a, i) => a !== subAccounts[i])) {
          a = { ...a, subAccounts: copy };
        }
      }
    }

    if (swapHistory.length === all.length) return a;
    // $FlowFixMe
    return { ...a, swapHistory: all };
  }

  return accounts.map(migrateSwapHistory);
};
