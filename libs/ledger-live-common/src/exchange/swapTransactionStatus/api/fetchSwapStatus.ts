import { getMultipleStatus } from "../../swap/getStatus";
import type { SwapStatus, SwapStatusRequest } from "../../swap/types";

export async function fetchTransactionSwapStatus(
  request: SwapStatusRequest,
): Promise<SwapStatus | undefined> {
  const [status] = await getMultipleStatus([request]);
  return status;
}
