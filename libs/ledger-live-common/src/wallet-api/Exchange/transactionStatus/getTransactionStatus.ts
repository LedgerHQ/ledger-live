import BigNumber from "bignumber.js";
import { parseFiniteBigNumber } from "@ledgerhq/ledger-wallet-framework/bignumber";
import type { AccountLike } from "@ledgerhq/types-live";
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
import { findWithdrawSwapEntry, mapWithdrawSwapEntry } from "./withdrawSwapEntry";

export type GetTransactionStatusContext = {
  accounts: AccountLike[];
};

export async function getTransactionStatus(
  args: GetTransactionStatusArgs,
  context: GetTransactionStatusContext,
): Promise<GetTransactionStatusResponse> {
  const accounts = flattenAccounts(context.accounts);
  const swapOperation = await findSwapOperation(accounts, args.swapId);
  // A perps withdraw stays out of the swap history until its payout operation is found on the
  // receiving account (hash unknown yet, or known but not synced yet): its details come from its
  // entry meanwhile, e.g. when opened right after signing.
  const withdrawEntry = swapOperation ? undefined : findWithdrawSwapEntry(accounts, args.swapId);
  const provider = swapOperation?.provider ?? withdrawEntry?.provider ?? args.provider;

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
    getTransactionStatusValue(swapOperation?.status ?? withdrawEntry?.status);
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
    ...(withdrawEntry
      ? mapWithdrawSwapEntry(withdrawEntry, accounts, remoteStatus)
      : {
          finalAmount:
            getMagnitudeAwareRemoteFinalAmount(remoteStatus?.finalAmount, swapOperation) ??
            getFinalAmount(swapOperation),
          ...mapSwapOperation(swapOperation),
        }),
  };
}

function getFinalAmount(swapOperation: MappedSwapOperation | undefined): string | undefined {
  return swapOperation?.finalAmount?.isGreaterThan(0)
    ? swapOperation.finalAmount.toFixed()
    : undefined;
}

function getMagnitudeAwareRemoteFinalAmount(
  finalAmount: string | undefined,
  swapOperation: MappedSwapOperation | undefined,
): string | undefined {
  const amount = parseFiniteBigNumber(finalAmount);
  if (!amount?.isGreaterThan(0) || !swapOperation) return undefined;

  const toCurrency = getAccountCurrency(swapOperation.toAccount);
  const toMagnitude = toCurrency.units[0].magnitude;
  return amount.times(new BigNumber(10).pow(toMagnitude)).toFixed();
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
    feesAmount: getFeesAmount(swapOperation),
    payoutFeesAmount: swapOperation.payoutFeesAmount,
    operationHash: swapOperation.operation.hash,
    createdAt,
  };
}

/**
 * The fee of an operation the sender did not make (a perps withdraw payout) is not the sender's:
 * the swap history entry carries its fees instead.
 */
function getFeesAmount({
  fromAccount,
  operation,
  feesAmount,
}: MappedSwapOperation): string | undefined {
  const senderOperations = [...fromAccount.operations, ...fromAccount.pendingOperations];
  const isSenderOperation = senderOperations.some(o => o.id === operation.id);
  if (isSenderOperation) return operation.fee?.toFixed();
  return feesAmount;
}

function getOperationCreatedAt(
  operationDate: MappedSwapOperation["operation"]["date"],
): number | undefined {
  if (operationDate instanceof Date) return operationDate.getTime();
  if (typeof operationDate === "number") return operationDate;
  return undefined;
}
