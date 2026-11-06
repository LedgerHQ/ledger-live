import BigNumber from "bignumber.js";
import type { AccountLike, SwapOperation } from "@ledgerhq/types-live";
import { flattenAccounts, getAccountCurrency } from "../../../account";
import getCompleteSwapHistory from "../../../exchange/swap/getCompleteSwapHistory";
import { swapProviderRequiresOperationId } from "../../../exchange/swap/providersRequiringOperationId";
import {
  fetchTransactionSwapStatus,
  getSwapTransactionLegStatusesFromAccounts,
  isTransactionStatusValue,
} from "../../../exchange/swapTransactionStatus/transactionStatus";
import type {
  MappedSwapOperation,
  SwapStatus,
  SwapStatusRequest,
} from "../../../exchange/swap/types";
import type {
  GetTransactionStatusArgs,
  GetTransactionStatusResponse,
  TransactionStatusValue,
} from "./types";

export type GetTransactionStatusContext = {
  accounts: AccountLike[];
};

export async function getTransactionStatus(
  args: GetTransactionStatusArgs,
  context: GetTransactionStatusContext,
): Promise<GetTransactionStatusResponse> {
  const accounts = flattenAccounts(context.accounts);
  const swapOperation = await findSwapOperation(accounts, args.swapId);
  // A perps withdraw stays out of the swap history until its payout tx hash is known: its details
  // come from its entry meanwhile, e.g. when opened right after signing.
  const unanchoredEntry = swapOperation
    ? undefined
    : findUnanchoredSwapEntry(accounts, args.swapId);
  const provider = swapOperation?.provider ?? unanchoredEntry?.provider ?? args.provider;

  if (!provider) {
    return {
      swapId: args.swapId,
      providerRequired: true,
    };
  }

  const remoteStatus = await fetchTransactionStatusSafely(
    buildSwapStatusRequest({
      provider,
      swapId: args.swapId,
      swapOperation,
    }),
  );
  const status =
    remoteStatus?.status ??
    getTransactionStatusValue(swapOperation?.status ?? unanchoredEntry?.status);
  const legStatuses = getSwapTransactionLegStatusesFromAccounts({
    accounts,
    operationHash: swapOperation?.operation.hash,
    providerStatus: status,
  });

  return {
    swapId: args.swapId,
    provider,
    status,
    ...legStatuses,
    ...(unanchoredEntry
      ? mapUnanchoredSwapEntry(unanchoredEntry, accounts, remoteStatus)
      : {
          finalAmount:
            getMagnitudeAwareRemoteFinalAmount(remoteStatus?.finalAmount, swapOperation) ??
            getFinalAmount(swapOperation),
          ...mapSwapOperation(swapOperation),
        }),
  };
}

/** A perps withdraw entry, held by the receiving account and not anchored to an operation yet. */
function findUnanchoredSwapEntry(
  accounts: AccountLike[],
  swapId: string,
): SwapOperation | undefined {
  for (const account of accounts) {
    const entry = account.swapHistory?.find(
      e => e.swapId === swapId && !e.operationId && e.fromAccountId,
    );
    if (entry) return entry;
  }
  return undefined;
}

function mapUnanchoredSwapEntry(
  entry: SwapOperation,
  accounts: AccountLike[],
  remoteStatus: SwapStatus | undefined,
): Partial<GetTransactionStatusResponse> {
  const receiver = accounts.find(account => account.id === entry.receiverAccountId);
  const finalAmount =
    receiver && remoteStatus?.finalAmount && isAmountGreaterThanZero(remoteStatus.finalAmount)
      ? new BigNumber(remoteStatus.finalAmount)
          .shiftedBy(getAccountCurrency(receiver).units[0].magnitude)
          .toFixed()
      : undefined;

  return {
    finalAmount,
    fromAccountId: entry.fromAccountId,
    toAccountId: entry.receiverAccountId,
    sentAmount: entry.fromAmount.absoluteValue().toFixed(),
    receivedAmount: finalAmount ?? entry.toAmount.toFixed(),
    feesAmount: entry.feesAmount,
    payoutFeesAmount: entry.payoutFeesAmount,
    // The payout tx, for the explorer link, once the swap status returns it.
    operationHash: remoteStatus?.txHash,
  };
}

function getFinalAmount(swapOperation: MappedSwapOperation | undefined): string | undefined {
  return swapOperation?.finalAmount?.isGreaterThan(0)
    ? swapOperation.finalAmount.toFixed()
    : undefined;
}

function isAmountGreaterThanZero(amount: string): boolean {
  return new BigNumber(amount).isGreaterThan(0);
}

function getMagnitudeAwareRemoteFinalAmount(
  finalAmount: string | undefined,
  swapOperation: MappedSwapOperation | undefined,
): string | undefined {
  if (!finalAmount || !isAmountGreaterThanZero(finalAmount) || !swapOperation) return undefined;

  const toCurrency = getAccountCurrency(swapOperation.toAccount);
  const toMagnitude = toCurrency.units[0].magnitude;
  return new BigNumber(finalAmount).times(new BigNumber(10).pow(toMagnitude)).toFixed();
}

function getTransactionStatusValue(status: string | undefined): TransactionStatusValue | undefined {
  if (!status || !isTransactionStatusValue(status)) return undefined;
  return status;
}

async function findSwapOperation(
  accounts: AccountLike[],
  swapId: string,
): Promise<MappedSwapOperation | undefined> {
  const sections = await getCompleteSwapHistory(accounts);
  return sections.flatMap(section => section.data).find(operation => operation.swapId === swapId);
}

function buildSwapStatusRequest({
  provider,
  swapId,
  swapOperation,
}: {
  provider: string;
  swapId: string;
  swapOperation: MappedSwapOperation | undefined;
}): SwapStatusRequest {
  const requiresOperationId = swapProviderRequiresOperationId(provider);
  return {
    provider,
    swapId,
    transactionId: requiresOperationId ? swapOperation?.operation.hash : undefined,
    ...(requiresOperationId && swapOperation ? { operationId: swapOperation.operation.id } : {}),
  };
}

async function fetchTransactionStatusSafely(
  request: SwapStatusRequest,
): Promise<SwapStatus | undefined> {
  try {
    return await fetchTransactionSwapStatus(request);
  } catch {
    return undefined;
  }
}

function mapSwapOperation(
  swapOperation: MappedSwapOperation | undefined,
): Partial<GetTransactionStatusResponse> {
  if (!swapOperation) return {};
  const receivedAmount = swapOperation.finalAmount?.isGreaterThan(0)
    ? swapOperation.finalAmount
    : swapOperation.toAmount;
  const createdAt = getOperationCreatedAt(swapOperation.operation.date);

  return {
    fromAccountId: swapOperation.fromAccount.id,
    toAccountId: swapOperation.toAccount.id,
    sentAmount: swapOperation.fromAmount.absoluteValue().toFixed(),
    receivedAmount: receivedAmount.toFixed(),
    // The fee of an operation the sender did not make (a perps withdraw payout) is not the sender's:
    // the swap history entry carries its fees instead.
    feesAmount: isSenderOperation(swapOperation)
      ? swapOperation.operation.fee?.toFixed()
      : swapOperation.feesAmount,
    payoutFeesAmount: swapOperation.payoutFeesAmount,
    operationHash: swapOperation.operation.hash,
    createdAt,
  };
}

function isSenderOperation({ fromAccount, operation }: MappedSwapOperation): boolean {
  return [...fromAccount.operations, ...fromAccount.pendingOperations].some(
    o => o.id === operation.id,
  );
}

function getOperationCreatedAt(
  operationDate: MappedSwapOperation["operation"]["date"],
): number | undefined {
  if (operationDate instanceof Date) return operationDate.getTime();
  if (typeof operationDate === "number") return operationDate;
  return undefined;
}
