import BigNumber from "bignumber.js";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import type { AccountLike, Operation, SwapOperation } from "@ledgerhq/types-live";
import type { AccountUUID } from "@domain/entity-account-descriptor";
import type { SwapHistoryEntry } from "@domain/entity-swap-history";
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
      fromAccountId,
      feesAmount,
      payoutFeesAmount,
    } = swapOperation;
    // Not anchored to an operation yet (a withdraw before its payout tx is known).
    if (!operationId) return null;
    // The source account, when it has no operation of its own to hold the entry.
    const fromAccount = fromAccountId ? accounts.find(a => a.id === fromAccountId) : account;
    if (!fromAccount) return null;
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

      if (toAccount?.type === "Account" && fromAccount.type === "TokenAccount") {
        toExists = true;
      }
      if (toAccount && tokenId) {
        const token = await getCryptoAssetsStore().findTokenById(tokenId);

        if (token && toAccount.type === "Account") {
          toParentAccount = toAccount;
          // Enhance the account with the given token in case we don't have funds yet.
          const tokenAccount = (
            accountWithMandatoryTokens(toAccount, [token]).subAccounts || []
          ).find(a => getAccountCurrency(a).id === tokenId);
          toAccount = tokenAccount;
          toExists =
            tokenAccount !== undefined &&
            (toParentAccount.subAccounts || []).includes(tokenAccount);
        }
      }

      if (toAccount && status) {
        let fromParentAccount;

        if (fromAccount.type === "TokenAccount") {
          const { parentId } = fromAccount;
          fromParentAccount = accounts.find(a => a.id === parentId);
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
          fromAccount,
          fromParentAccount: fromParentAccount?.type === "Account" ? fromParentAccount : undefined,
          operation: op,
          fromAmount,
          toAmount,
          finalAmount: magnitudeAwareFinalAmount,
          toExists,
          ...(feesAmount !== undefined && { feesAmount }),
          ...(payoutFeesAmount !== undefined && { payoutFeesAmount }),
        };
      }
    }
  };

function startOfDay(t: Date) {
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
}

const isMapped = (swap: MappedSwapOperation | null | undefined): swap is MappedSwapOperation =>
  Boolean(swap);

const getCompleteSwapHistory = async (accounts: AccountLike[]): Promise<SwapHistorySection[]> => {
  const swaps: MappedSwapOperation[] = [];

  for (const account of accounts) {
    const { swapHistory } = account;

    const mapFn = getSwapOperationMap(account, accounts);

    if (swapHistory) {
      const mappedSwapHistory = await Promise.all(swapHistory.map(mapFn));
      swaps.push(...mappedSwapHistory.filter(isMapped));
    }
  }

  return toSections(swaps);
};

/** The legacy account or token account of an account's asset. */
const findLegacyAccount = (
  accounts: AccountLike[],
  parentId: string | undefined,
  assetId: string | undefined,
): AccountLike | undefined =>
  parentId === undefined
    ? undefined
    : accounts.find(a =>
        a.type === "Account"
          ? a.id === parentId && a.currency.id === assetId
          : a.parentId === parentId && a.token.id === assetId,
      );

/** The same sections, from the swap history entity; legacy accounts only join operations and render rows. */
export const getSwapHistorySections = async (
  entries: readonly SwapHistoryEntry[],
  accounts: AccountLike[],
  toLegacyAccountId: (accountUUID: AccountUUID) => string | undefined,
): Promise<SwapHistorySection[]> => {
  const legacyIdOf = (accountUUID: AccountUUID | undefined) =>
    accountUUID === undefined ? undefined : toLegacyAccountId(accountUUID);
  const swaps = await Promise.all(
    entries.map(entry => {
      const account = findLegacyAccount(accounts, legacyIdOf(entry.accountUUID), entry.assetId);
      const receiverParentId = legacyIdOf(entry.toAccountUUID);
      if (!account || receiverParentId === undefined) return null;
      // The receiving token account when it exists, else the parent and the token it will hold.
      const receiver = findLegacyAccount(accounts, receiverParentId, entry.toAssetId);
      const receiverAccountId = receiver?.id ?? receiverParentId;
      const tokenId = receiver ? undefined : entry.toAssetId;
      const fromAccountId =
        entry.fromAccountUUID &&
        findLegacyAccount(accounts, legacyIdOf(entry.fromAccountUUID), entry.fromAssetId)?.id;
      if (entry.fromAccountUUID && !fromAccountId) return null;
      const swapOperation: SwapOperation = {
        provider: entry.provider,
        swapId: entry.swapId,
        status: entry.status,
        receiverAccountId,
        tokenId,
        operationId: entry.operationId ?? "",
        fromAmount: new BigNumber(entry.fromAmount),
        toAmount: new BigNumber(entry.toAmount),
        ...(entry.finalAmount !== undefined && { finalAmount: new BigNumber(entry.finalAmount) }),
        ...(fromAccountId && { fromAccountId }),
        ...(entry.feesAmount !== undefined && { feesAmount: entry.feesAmount }),
        ...(entry.payoutFeesAmount !== undefined && { payoutFeesAmount: entry.payoutFeesAmount }),
        ...(entry.createdAt !== undefined && { createdAt: entry.createdAt }),
      };
      return getSwapOperationMap(account, accounts)(swapOperation);
    }),
  );
  return toSections(swaps.filter(isMapped));
};

const toSections = (swaps: MappedSwapOperation[]): SwapHistorySection[] => {
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
