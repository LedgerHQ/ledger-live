import { getSwapStatuses } from "../../swap/fusionSwapStatus";
import type { SwapStatus, SwapStatusRequest } from "../../swap/types";

export async function fetchTransactionSwapStatus(
  request: SwapStatusRequest,
  network?: string,
): Promise<SwapStatus | undefined> {
  const [status] = await getSwapStatuses([request], network);
  return status;
}
