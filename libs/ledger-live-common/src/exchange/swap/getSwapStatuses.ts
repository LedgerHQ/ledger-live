import { TransactionStatus } from "@ledgerhq/wallet-api-exchange-module";
import type { AccountLike } from "@ledgerhq/types-live";
import { getMultipleStatus } from "./getStatus";
import type { SwapStatus, SwapStatusRequest } from "./types";

const ONEINCH_PROVIDER = "oneinch";
const ONEINCH_FUSION_PROVIDER = "oneinchfusion";

export function getSwapStatusNetwork(account: AccountLike): string {
  return account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.id;
}

// The backend finds a 1inch Fusion order only with its network
function withFusionNetwork(
  request: SwapStatusRequest,
  network: string | undefined,
): SwapStatusRequest {
  if (request.provider !== ONEINCH_FUSION_PROVIDER || !network) return request;
  return { ...request, network };
}

function isUnknownOneinchSwap({ provider, status }: SwapStatus): boolean {
  return provider === ONEINCH_PROVIDER && status === TransactionStatus.Unknown;
}

// The swap live app saves 1inch Fusion swaps as "oneinch" (LIVE-38612)
async function resolveOneinchSwapsAsFusion(
  statuses: SwapStatus[],
  network: string | undefined,
): Promise<SwapStatus[]> {
  const unknownSwaps = statuses.filter(isUnknownOneinchSwap);
  if (!unknownSwaps.length || !network) return statuses;

  let fusionStatuses: SwapStatus[];
  try {
    fusionStatuses = await getMultipleStatus(
      unknownSwaps.map(({ swapId }) => ({ provider: ONEINCH_FUSION_PROVIDER, swapId, network })),
    );
  } catch {
    // Pending, not unknown: the status dialog stops polling on unknown
    return statuses.map(status =>
      isUnknownOneinchSwap(status) ? { ...status, status: TransactionStatus.Pending } : status,
    );
  }

  return statuses.map(status => {
    if (!isUnknownOneinchSwap(status)) return status;
    const fusionStatus = fusionStatuses.find(({ swapId }) => swapId === status.swapId);
    if (!fusionStatus || fusionStatus.status === TransactionStatus.Unknown) return status;
    return { ...fusionStatus, provider: ONEINCH_PROVIDER };
  });
}

export async function getSwapStatuses(
  requests: SwapStatusRequest[],
  network: string | undefined,
): Promise<SwapStatus[]> {
  const statuses = await getMultipleStatus(
    requests.map(request => withFusionNetwork(request, network)),
  );
  return resolveOneinchSwapsAsFusion(statuses, network);
}
