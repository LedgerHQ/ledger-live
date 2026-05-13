import BigNumber from "bignumber.js";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { flattenAccounts, getAccountCurrency } from "../../../account";
import getCompleteSwapHistory from "../../../exchange/swap/getCompleteSwapHistory";
import { fetchTransactionSwapStatus } from "../../../exchange/transactionStatus/fetchSwapStatus";
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

const PROVIDERS_REQUIRING_OPERATION_ID = ["thorswap", "lifi", "nearintents", "swapsxyz"];

export async function getTransactionStatus(
  args: GetTransactionStatusArgs,
  context: GetTransactionStatusContext,
): Promise<GetTransactionStatusResponse> {
  const accounts = flattenAccounts(context.accounts as Account[]);
  const swapOperation = await findSwapOperation(accounts, args.swapId);
  const provider = swapOperation?.provider ?? args.provider;

  if (!provider) {
    return {
      kind: "swap",
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

  return {
    kind: "swap",
    swapId: args.swapId,
    provider,
    status: remoteStatus?.status ?? getTransactionStatusValue(swapOperation?.status),
    finalAmount:
      getMagnitudeAwareRemoteFinalAmount(remoteStatus?.finalAmount, swapOperation) ??
      getFinalAmount(swapOperation),
    ...mapSwapOperation(swapOperation),
  };
}

function getFinalAmount(swapOperation: MappedSwapOperation | undefined): string | undefined {
  return swapOperation?.finalAmount?.isGreaterThan(0)
    ? swapOperation.finalAmount.toFixed()
    : undefined;
}

function getPositiveAmount(amount: string | undefined): string | undefined {
  if (!amount) return undefined;
  return new BigNumber(amount).isGreaterThan(0) ? amount : undefined;
}

function getMagnitudeAwareRemoteFinalAmount(
  finalAmount: string | undefined,
  swapOperation: MappedSwapOperation | undefined,
): string | undefined {
  const positiveFinalAmount = getPositiveAmount(finalAmount);
  if (!positiveFinalAmount || !swapOperation) return undefined;

  const toCurrency = getAccountCurrency(swapOperation.toAccount);
  const toMagnitude = toCurrency.units[0].magnitude;
  return new BigNumber(positiveFinalAmount).times(new BigNumber(10).pow(toMagnitude)).toFixed();
}

function getTransactionStatusValue(status: string | undefined): TransactionStatusValue | undefined {
  switch (status) {
    case "pending":
    case "onhold":
    case "expired":
    case "finished":
    case "refunded":
    case "unknown":
      return status;
    default:
      return undefined;
  }
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
  const requiresOperationId = PROVIDERS_REQUIRING_OPERATION_ID.includes(provider);
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

  return {
    fromAccountId: swapOperation.fromAccount.id,
    toAccountId: swapOperation.toAccount.id,
    sentAmount: swapOperation.fromAmount.absoluteValue().toFixed(),
    receivedAmount: receivedAmount.toFixed(),
    feesAmount: swapOperation.operation.fee?.toFixed(),
    operationHash: swapOperation.operation.hash,
    createdAt:
      swapOperation.operation.date instanceof Date
        ? swapOperation.operation.date.getTime()
        : typeof swapOperation.operation.date === "number"
          ? swapOperation.operation.date
          : undefined,
  };
}
