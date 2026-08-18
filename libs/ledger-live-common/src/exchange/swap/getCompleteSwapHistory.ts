import { BigNumber } from "bignumber.js";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountLike, Operation, SwapOperation } from "@ledgerhq/types-live";
import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import { accountWithMandatoryTokens, getAccountCurrency } from "../../account";
import type { MappedSwapOperation, SwapHistorySection } from "./types";

// Sum the atomic value credited to an account by the given transaction: direct
// incoming operations (token receives) plus incoming internal operations
// (native receives that happen inside a contract call).
const sumIncomingOperationValue = (operations: Operation[], txHash: string): BigNumber => {
  let total = new BigNumber(0);
  for (const operation of operations) {
    if (operation.hash !== txHash) continue;
    if (operation.type === "IN") {
      total = total.plus(operation.value);
    } else if (operation.internalOperations?.length) {
      for (const internalOperation of operation.internalOperations) {
        if (internalOperation.type === "IN") total = total.plus(internalOperation.value);
      }
    }
  }
  return total;
};

// For DEX swaps the received amount is settled on-chain in the receiving
// account, so we read the real credited amount from that account's incoming
// operation(s) sharing the swap transaction hash. Returned in atomic units to
// match the `toAmount` convention.
const getDexReceivedAmount = (
  toAccount: AccountLike,
  txHash: string | undefined,
): BigNumber | undefined => {
  if (!txHash) return undefined;
  const received = sumIncomingOperationValue(toAccount.operations ?? [], txHash);
  return received.isGreaterThan(0) ? received : undefined;
};

const getSwapOperationMap =
  (account: AccountLike, accounts: AccountLike[]) =>
  async (swapOperation: SwapOperation): Promise<MappedSwapOperation | null | undefined> => {
    const {
      provider,
      swapId,
      receiverAccountId,
      operationId,
      fromAmount,
      toAmount,
      finalAmount,
      status,
      tokenId,
    } = swapOperation;
    // Find operation by matching its hash which is embedded in the operationId
    const operation = account.operations.find(
      o => operationId.includes(o.hash) || o.id === operationId,
    );
    const optimisticOperation = !operation
      ? account.pendingOperations.find(o => operationId.includes(o.hash) || o.id === operationId)
      : null;
    const op = operation || optimisticOperation;

    if (op) {
      let toAccount = accounts.find(a => a.id === receiverAccountId);
      let toParentAccount;
      let toExists = !optimisticOperation;

      if (toAccount?.type === "Account" && account.type === "TokenAccount") {
        toExists = true;
      }
      if (toAccount && tokenId) {
        const token = await getCryptoAssetsStore().findTokenById(tokenId);

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

        if (account.type === "TokenAccount") {
          fromParentAccount = accounts.find(a => a.id === account.parentId);
          if (fromParentAccount?.type !== "Account") return null;
        }

        if (toAccount.type === "TokenAccount" && !toParentAccount) {
          const toAccountParentId = toAccount.parentId;
          const foundParent = accounts.find(
            a => a.type === "Account" && a.id === toAccountParentId,
          );
          if (foundParent?.type !== "Account") return null;
          toParentAccount = foundParent;
        }

        const toCurrency = getAccountCurrency(toAccount);
        const toMagnitude = toCurrency.units[0].magnitude;
        // CEX providers report the final amount remotely (stored in human units).
        const persistedFinalAmount =
          finalAmount && finalAmount.isGreaterThan(0)
            ? finalAmount.times(new BigNumber(10).pow(toMagnitude))
            : undefined;
        // DEX swaps (swapId embedded in operationId) never persist a finalAmount,
        // so once the swap is finished we derive the real received amount from the
        // receiving account's on-chain operation.
        const isDexSwap = Boolean(operationId && swapId && operationId.includes(swapId));
        const magnitudeAwareFinalAmount =
          persistedFinalAmount ??
          (isDexSwap && status === TransactionStatus.Finished
            ? getDexReceivedAmount(toAccount, op.hash)
            : undefined);

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
          finalAmount: magnitudeAwareFinalAmount,
          toExists,
        };
      }
    }
  };

function startOfDay(t) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const getCompleteSwapHistory = async (accounts: AccountLike[]): Promise<SwapHistorySection[]> => {
  const swaps: MappedSwapOperation[] = [];

  for (const account of accounts) {
    const { swapHistory } = account;

    const mapFn = getSwapOperationMap(account, accounts);

    if (swapHistory) {
      const mappedSwapHistory = await Promise.all(swapHistory.map(mapFn));

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
