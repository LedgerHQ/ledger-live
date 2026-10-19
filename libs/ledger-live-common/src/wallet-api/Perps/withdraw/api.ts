import network from "@ledgerhq/live-network/network";
import { getSwapAPIBaseURL, getSwapUserIP } from "../../../exchange/swap";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../exchange/swap/const/timeout";
import { PERPS_WITHDRAW_SUBMIT_PATH } from "./constants";
import { WithdrawApiError, WithdrawSubmitUnknownOutcomeError, toWithdrawError } from "./errors";
import {
  WithdrawSubmitResultSchema,
  type WithdrawPayload,
  type WithdrawSubmitResult,
} from "./schemas";

// TODO(LIVE-39366): confirm the submit body with the backend.
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
    // Keep the error body so SwapKit error codes can be mapped.
    validateStatus: () => true,
    ...(data !== undefined ? { data } : {}),
    ...(headers !== undefined ? { headers } : {}),
  });

  if (response.status < 200 || response.status >= 300) {
    throw toWithdrawError({ status: response.status, body: response.data });
  }
  return response.data;
}

/** Never retried: an unknown outcome throws `WithdrawSubmitUnknownOutcomeError`. */
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

// Gateway errors may hide a submit that already reached Hyperliquid.
const UNKNOWN_OUTCOME_STATUSES = [502, 504];

function isDefiniteSubmitFailure(error: unknown): boolean {
  return (
    error instanceof WithdrawApiError &&
    !(error instanceof WithdrawSubmitUnknownOutcomeError) &&
    !UNKNOWN_OUTCOME_STATUSES.includes(error.status ?? 0)
  );
}
