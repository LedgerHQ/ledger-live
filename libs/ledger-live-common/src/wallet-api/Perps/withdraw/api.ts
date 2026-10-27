import network from "@ledgerhq/live-network/network";
import { getSwapAPIBaseURL, getSwapUserIP } from "../../../exchange/swap";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../exchange/swap/const/timeout";
import { PERPS_WITHDRAW_SUBMIT_PATH } from "./constants";
import {
  WithdrawAddressScreeningError,
  WithdrawApiError,
  WithdrawLowLiquidityError,
  WithdrawMinimumAmountError,
  WithdrawSubmitUnknownOutcomeError,
  toWithdrawError,
} from "./errors";
import {
  WithdrawSubmitResultSchema,
  type WithdrawPayload,
  type WithdrawSubmitResult,
} from "./schemas";

export type WithdrawSubmitParams = {
  payload: WithdrawPayload;
  signature: string;
};

type WithdrawRequest = {
  method: "POST";
  path: string;
  data?: unknown;
};

async function request({ method, path, data }: WithdrawRequest): Promise<unknown> {
  const headers = getSwapUserIP();
  const response = await network<unknown>({
    method,
    url: `${getSwapAPIBaseURL()}${path}`,
    timeout: DEFAULT_SWAP_TIMEOUT_MS,
    validateStatus: () => true,
    ...(data !== undefined ? { data } : {}),
    ...(headers !== undefined ? { headers } : {}),
  });

  if (response.status < 200 || response.status >= 300) {
    throw toWithdrawError({ status: response.status, body: response.data });
  }
  return response.data;
}

export async function submitWithdraw({
  payload,
  signature,
}: WithdrawSubmitParams): Promise<WithdrawSubmitResult> {
  const path = PERPS_WITHDRAW_SUBMIT_PATH;
  let data: unknown;
  try {
    data = await request({ method: "POST", path, data: { ...payload, signature } });
  } catch (error) {
    if (isDefiniteSubmitFailure(error)) throw error;
    if (error instanceof WithdrawSubmitUnknownOutcomeError) throw error;
    throw new WithdrawSubmitUnknownOutcomeError(error instanceof Error ? error.message : undefined);
  }

  const result = WithdrawSubmitResultSchema.safeParse(data);
  if (!result.success) {
    throw new WithdrawSubmitUnknownOutcomeError(`Unexpected response from ${path}`);
  }
  return result.data;
}

// Definite only when the backend says it rejected the transfer: a 4xx or a known rejection code.
function isDefiniteSubmitFailure(error: unknown): boolean {
  if (!(error instanceof WithdrawApiError) || error instanceof WithdrawSubmitUnknownOutcomeError) {
    return false;
  }
  if (
    error instanceof WithdrawMinimumAmountError ||
    error instanceof WithdrawLowLiquidityError ||
    error instanceof WithdrawAddressScreeningError
  ) {
    return true;
  }
  const status = error.status ?? 0;
  return status >= 400 && status < 500;
}
