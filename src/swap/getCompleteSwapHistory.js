// @flow

import type { AccountLike } from "../types";
import type { SwapHistorySection, SwapOperation } from "./types";

const getSwapOperationMap = (
  account: AccountLike,
  accounts: AccountLike[]
) => async (swapOperation: SwapOperation) => {
  const {
    provider,
    swapId,
    receiverAccountId,
    operationId,
    fromAmount,
    toAmount,
    status,
  } = swapOperation;

  const toAccount = accounts.find((a) => a.id === receiverAccountId);
  const operation = account.operations.find((o) => o.id === operationId);

  if (account && toAccount && operation && status) {
    return {
      provider,
      swapId,
      status,
      toAccount,
      fromAccount: account,
      operation,
      fromAmount,
      toAmount,
    };
  }
};

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const getCompleteSwapHistory = async (
  accounts: AccountLike[]
): Promise<SwapHistorySection[]> => {
  const swaps = [];
  for (const account of accounts) {
    const { swapHistory } = account;
    const mapFn = getSwapOperationMap(account, accounts);
    if (swapHistory) {
      const mappedSwapHistory = await Promise.all(swapHistory.map(mapFn));

      if (mappedSwapHistory) {
        swaps.push(...mappedSwapHistory.filter(Boolean));
      }
    }
  }

  swaps.sort((a, b) => b.operation.date - a.operation.date);
  if (!swaps.length) return [];

  let sections = [];
  let day = startOfDay(swaps[0].operation.date);
  let data = [swaps[0]];
  let skip = true;

  for (const swap of swaps) {
    if (startOfDay(swap.operation.date) < day) {
      sections.push({ day, data });
      // Move to a new section
      day = startOfDay(swap.operation.date);
      data = [swap];
      continue;
    } else if (!skip) {
      data.push(swap);
    }
    skip = false;
  }

  if (data.length > 0) {
    sections.push({ day, data });
  }

  return sections;
};

export default getCompleteSwapHistory;
