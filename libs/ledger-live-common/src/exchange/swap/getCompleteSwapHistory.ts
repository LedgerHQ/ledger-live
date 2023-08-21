import { findTokenById } from "@ledgerhq/cryptoassets";
import type { SwapHistorySection, SwapOperation, MappedSwapOperation } from "./types";
import { accountWithMandatoryTokens, getAccountCurrency } from "../../account";
import type { AccountLike } from "@ledgerhq/types-live";

const getSwapOperationMap =
  (account: AccountLike, accounts: AccountLike[]) =>
  (swapOperation: SwapOperation): MappedSwapOperation | null | undefined => {
    const {
      provider,
      swapId,
      receiverAccountId,
      operationId,
      fromAmount,
      toAmount,
      status,
      tokenId,
    } = swapOperation;
    const operation = account.operations.find(o => o.id === operationId);
    const optimisticOperation = !operation
      ? account.pendingOperations.find(o => o.id === operationId)
      : null;
    const op = operation || optimisticOperation;

    if (op) {
      let toAccount = accounts.find(a => a.id === receiverAccountId);
      let toParentAccount;
      let toExists = !optimisticOperation;

      if (toAccount && tokenId) {
        const token = findTokenById(tokenId);

        if (token && toAccount.type === "Account") {
          toParentAccount = toAccount;
          // Enhance the account with the given token in case we don't have funds yet.
          toAccount = (accountWithMandatoryTokens(toAccount, [token]).subAccounts || []).find(
            a => getAccountCurrency(a).id === tokenId,
          );
          toExists = (toParentAccount.subAccounts || []).includes(toAccount);
        }
      }

      if (account && toAccount && status) {
        let fromParentAccount;

        if (account.type !== "Account") {
          fromParentAccount = accounts.find(a => a.id === account.parentId);
        }

        return {
          provider,
          swapId,
          status,
          toAccount,
          toParentAccount,
          fromAccount: account,
          fromParentAccount: fromParentAccount?.type === "Account" ? fromParentAccount : undefined,
          operation: op,
          fromAmount,
          toAmount,
          toExists,
        };
      }
    }
  };

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const getCompleteSwapHistory = (accounts: AccountLike[]): SwapHistorySection[] => {
  const swaps: MappedSwapOperation[] = [];

  for (const account of accounts) {
    const { swapHistory } = account;
    const mapFn = getSwapOperationMap(account, accounts);

    if (swapHistory) {
      const mappedSwapHistory = swapHistory.map(mapFn);

      if (mappedSwapHistory) {
        const filteredMappdSwapOperations = <MappedSwapOperation[]>(
          mappedSwapHistory.filter(Boolean)
        );
        swaps.push(...filteredMappdSwapOperations);
      }
    }
  }

  swaps.sort((a, b) => b.operation.date.valueOf() - a.operation.date.valueOf());
  if (!swaps.length) return [];
  const sections: SwapHistorySection[] = [];
  let day = startOfDay(swaps[0].operation.date);
  let data = [swaps[0]];
  let skip = true;

  for (const swap of swaps) {
    if (startOfDay(swap.operation.date) < day) {
      sections.push({
        day,
        data,
      });
      // Move to a new section
      day = startOfDay(swap.operation.date);
      data = [swap];
      continue;
    } else if (!skip && !data.find(d => d.swapId === swap.swapId)) {
      data.push(swap);
    }

    skip = false;
  }

  if (data.length > 0) {
    sections.push({
      day,
      data,
    });
  }

  return sections;
};

export default getCompleteSwapHistory;
