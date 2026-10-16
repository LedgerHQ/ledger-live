import network from "@ledgerhq/live-network/network";
import type BigNumber from "bignumber.js";
import type { z } from "zod";
import { getSwapAPIBaseURL, getSwapUserIP } from "../../../exchange/swap";
import { DEFAULT_SWAP_TIMEOUT_MS } from "../../../exchange/swap/const/timeout";
import { PERPS_WITHDRAW_ENDPOINTS } from "./constants";
import { toSwapKitCurrencyId } from "./currencyMapping";
import { WithdrawApiError, WithdrawSubmitUnknownOutcomeError, toWithdrawError } from "./errors";
import {
  WithdrawCurrenciesSchema,
  WithdrawPayloadSchema,
  WithdrawQuoteSchema,
  WithdrawStatusSchema,
  WithdrawSubmitResultSchema,
  type WithdrawCurrencies,
  type WithdrawPayload,
  type WithdrawQuote,
  type WithdrawStatus,
  type WithdrawSubmitResult,
} from "./schemas";

// TODO(LIVE-39366): placeholder request bodies, confirm with the backend.
export type WithdrawQuoteParams = {
  amount: BigNumber;
  sourceAddress: string;
  toCurrencyId: string;
  destinationAddress: string;
};

export type WithdrawPayloadParams = WithdrawQuoteParams & {
  quoteId?: string;
};

export type WithdrawSubmitParams = {
  payload: WithdrawPayload;
  signature: string;
};

type WithdrawRequest = {
  method: "GET" | "POST";
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

function parse<T>(schema: z.ZodType<T, unknown>, data: unknown, path: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new WithdrawApiError(`Unexpected response from ${path}`);
  }
  return result.data;
}

function toQuoteBody({
  amount,
  sourceAddress,
  toCurrencyId,
  destinationAddress,
}: WithdrawQuoteParams) {
  return {
    amount: amount.toFixed(),
    sourceAddress,
    toCurrencyId: toSwapKitCurrencyId(toCurrencyId),
    destinationAddress,
  };
}

export async function fetchWithdrawCurrencies(): Promise<WithdrawCurrencies> {
  const path = PERPS_WITHDRAW_ENDPOINTS.currencies;
  return parse(WithdrawCurrenciesSchema, await request({ method: "GET", path }), path);
}

export async function fetchWithdrawQuote(params: WithdrawQuoteParams): Promise<WithdrawQuote> {
  const path = PERPS_WITHDRAW_ENDPOINTS.quote;
  const data = await request({ method: "POST", path, data: toQuoteBody(params) });
  return parse(WithdrawQuoteSchema, data, path);
}

export async function fetchWithdrawPayload(
  params: WithdrawPayloadParams,
): Promise<WithdrawPayload> {
  const path = PERPS_WITHDRAW_ENDPOINTS.payload;
  const data = await request({
    method: "POST",
    path,
    data: { ...toQuoteBody(params), quoteId: params.quoteId },
  });
  return parse(WithdrawPayloadSchema, data, path);
}

/** Never retried: an unknown outcome throws `WithdrawSubmitUnknownOutcomeError`. */
export async function submitWithdraw({
  payload,
  signature,
}: WithdrawSubmitParams): Promise<WithdrawSubmitResult> {
  const path = PERPS_WITHDRAW_ENDPOINTS.submit;
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

export async function fetchWithdrawStatus(swapId: string): Promise<WithdrawStatus> {
  const path = `${PERPS_WITHDRAW_ENDPOINTS.status}?swapId=${encodeURIComponent(swapId)}`;
  return parse(WithdrawStatusSchema, await request({ method: "GET", path }), path);
}
