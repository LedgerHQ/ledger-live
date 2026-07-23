/**
 * Thin async client for the Ledger Earn backend (https://earn.api.live.ledger.com).
 *
 * Uses the global `fetch` (Bun) rather than `@ledgerhq/live-network`: wallet-cli does not
 * depend on live-network anywhere and keeping the surface tiny avoids dragging extra deps into
 * the Bun `--compile` bundle. Responses are validated with the Zod schemas in api.types.ts.
 *
 * Base URL is configurable via the EARN_API_BASE_URL env var (default below), following the same
 * lightweight `process.env` override convention used elsewhere in wallet-cli config.
 */

import { walletCliDebug } from "../../shared/log";
import { getEarnApiBaseUrl, getSolanaValidatorApyUrl, getSolanaValidatorsUrl } from "./config";
import {
  CurrencyProvidersResponseSchema,
  DefiProductsResponseSchema,
  DefiTransactionResponseSchema,
  EthTxStatusResponseSchema,
  GrowResponseSchema,
  SolanaValidatorApyResponseSchema,
  SolanaValidatorsResponseSchema,
  StakesV1ResponseSchema,
  StakesV3ResponseSchema,
  type CurrencyProvidersResponse,
  type DefiApproveRequest,
  type DefiApproveResponse,
  type DefiDepositRequest,
  type DefiProductsResponse,
  type DefiTransactionResponse,
  type DefiWithdrawRequest,
  type EthTxStatusResponse,
  type GrowResponse,
  type SolanaValidatorWithApy,
  type StakesRequest,
  type StakesV1Response,
  type StakesV3Response,
} from "./api.types";

// Endpoint configuration (base URL + Solana validators/APY hosts) lives in config.ts; re-exported
// here so callers keep their `wallet/earn/api` entry point.
export { getEarnApiBaseUrl, getSolanaValidatorApyUrl, getSolanaValidatorsUrl } from "./config";

type RequestOptions = {
  method?: "GET" | "POST";
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
};

type EarnResponse = {
  status: number;
  body: unknown;
};

/**
 * A deliberate, non-retryable Earn API failure (a 4xx client error or a malformed/contract-violating
 * response body). Distinct from a plain `Error` (which we treat as a retryable transport blip) so
 * callers like the status poll loop can fail fast instead of retrying something that will never resolve.
 */
export class EarnApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EarnApiError";
  }
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${getEarnApiBaseUrl()}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }
  return url.toString();
}

/** Raw HTTP result of an Earn API call: status + body text, before any ok/JSON interpretation. */
type EarnFetchResult = {
  status: number;
  statusText: string;
  ok: boolean;
  text: string;
};

/**
 * Issue the HTTP request and read the body text, without interpreting the status. Shared by the
 * throwing (`earnRequestWithStatus`) and non-throwing (`earnRequestWithStatusNoThrow`) variants,
 * which only differ in how they react to a non-2xx / non-JSON response.
 */
async function earnFetch(path: string, options: RequestOptions = {}): Promise<EarnFetchResult> {
  const { method = "GET", query, body } = options;
  const url = buildUrl(path, query);
  walletCliDebug(`earn-api: ${method} ${url}`);

  const response = await fetch(url, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });

  return {
    status: response.status,
    statusText: response.statusText,
    ok: response.ok,
    text: await response.text(),
  };
}

async function earnRequestWithStatus(
  path: string,
  options: RequestOptions = {},
): Promise<EarnResponse> {
  const method = options.method ?? "GET";
  const { status, statusText, ok, text } = await earnFetch(path, options);
  if (!ok) {
    throw new Error(
      `Earn API ${method} ${path} failed: ${status} ${statusText}${
        text ? ` — ${text.slice(0, 500)}` : ""
      }`,
    );
  }

  if (!text) return { status, body: undefined };
  try {
    return { status, body: JSON.parse(text) };
  } catch {
    throw new Error(`Earn API ${method} ${path} returned non-JSON response: ${text.slice(0, 200)}`);
  }
}

async function earnRequest(path: string, options: RequestOptions = {}): Promise<unknown> {
  return (await earnRequestWithStatus(path, options)).body;
}

/**
 * Like `earnRequestWithStatus` but never throws on a non-2xx response: the HTTP status is returned
 * so the caller can decide. Used by status polling, where a 5xx means "not mined yet" rather than a
 * hard failure. A transport error (network down) still rejects.
 */
async function earnRequestWithStatusNoThrow(
  path: string,
  options: RequestOptions = {},
): Promise<EarnResponse> {
  const { status, ok, text } = await earnFetch(path, options);
  if (!ok || !text) return { status, body: undefined };
  try {
    return { status, body: JSON.parse(text) };
  } catch {
    return { status, body: undefined };
  }
}

// ---------------------------------------------------------------------------
// Read endpoints (no auth, no device)
// ---------------------------------------------------------------------------

/** GET /v0/grow?dashboard_supported=true — yield opportunities across all supported networks. */
export async function getGrow(
  params: { dashboardSupported?: boolean } = {},
): Promise<GrowResponse> {
  const raw = await earnRequest("/v0/grow", {
    query: { dashboard_supported: params.dashboardSupported ?? true },
  });
  return GrowResponseSchema.parse(raw);
}

/** GET /v0/currency/{id}/providers — staking providers available for a given currency id. */
export async function getCurrencyProviders(currencyId: string): Promise<CurrencyProvidersResponse> {
  const raw = await earnRequest(`/v0/currency/${encodeURIComponent(currencyId)}/providers`);
  return CurrencyProvidersResponseSchema.parse(raw);
}

/** GET /v1/defi/products — Kiln ERC-4626 vaults (acts as the trusted-vault allowlist, eth only). */
export async function getDefiProducts(): Promise<DefiProductsResponse> {
  const raw = await earnRequest("/v1/defi/products");
  return DefiProductsResponseSchema.parse(raw);
}

/**
 * GET the Figment validators summary — a `{ voteAccount: delegator_apy }` map (apy is a fraction).
 *
 * APY is best-effort context: any failure (network, non-2xx, bad shape) degrades to an empty map so
 * the validators are still listed, just without a rate. Mirrors coin-solana's `fetchFigmentApy`.
 */
export async function getSolanaValidatorApy(): Promise<Record<string, number>> {
  const url = getSolanaValidatorApyUrl();
  walletCliDebug(`earn-api: GET ${url}`);
  try {
    const response = await fetch(url, { headers: { Accept: "application/json" } });
    if (!response.ok) return {};
    const parsed = SolanaValidatorApyResponseSchema.parse(await response.json());
    return Object.fromEntries(parsed.map(v => [v.address, v.delegator_apy]));
  } catch (error) {
    walletCliDebug(`earn-api: Figment apy fetch failed: ${String(error)}`);
    return {};
  }
}

/**
 * GET Ledger's Solana validators list, enriched with APY — vote accounts usable as
 * `earn deposit --product`.
 *
 * Fetches the validators list and the Figment APY summary in parallel and merges the latter in by
 * vote account (the list itself carries no APY). Served from its own host (see getSolanaValidatorsUrl),
 * so this does not go through earnRequest.
 */
export async function getSolanaValidators(): Promise<SolanaValidatorWithApy[]> {
  const url = getSolanaValidatorsUrl();
  walletCliDebug(`earn-api: GET ${url}`);

  const [response, apyMap] = await Promise.all([
    fetch(url, { headers: { Accept: "application/json" } }),
    getSolanaValidatorApy(),
  ]);

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `Solana validators GET failed: ${response.status} ${response.statusText}${
        text ? ` — ${text.slice(0, 500)}` : ""
      }`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Solana validators returned non-JSON response: ${text.slice(0, 200)}`);
  }
  const validators = SolanaValidatorsResponseSchema.parse(parsed);
  return validators.map(v => ({ ...v, apy: apyMap[v.vote_account] }));
}

/**
 * POST /v1/stakes — positions for a batch of { network, address }.
 * Returns a bare BatchedView[] array. Use `getStakesV3` for the staleness-aware variant.
 */
export async function getStakes(request: StakesRequest): Promise<StakesV1Response> {
  const raw = await earnRequest("/v1/stakes", { method: "POST", body: request });
  return StakesV1ResponseSchema.parse(raw);
}

/** POST /v3/stakes — same as getStakes but wrapped in `{ data, meta:{ is_stale, ... } }`. */
export async function getStakesV3(request: StakesRequest): Promise<StakesV3Response> {
  const raw = await earnRequest("/v3/stakes", { method: "POST", body: request });
  return StakesV3ResponseSchema.parse(raw);
}

// ---------------------------------------------------------------------------
// ETH vault deposit pipeline
// ---------------------------------------------------------------------------

/** POST /v1/defi/approve — prebuilt ERC-20 approve calldata, or 204 when already approved. */
export async function postDefiApprove(request: DefiApproveRequest): Promise<DefiApproveResponse> {
  const { status, body } = await earnRequestWithStatus("/v1/defi/approve", {
    method: "POST",
    body: request,
  });
  if (status === 204) return { status: 204, kind: "no-action" };
  return { status: 200, kind: "transaction", ...DefiTransactionResponseSchema.parse(body) };
}

/** POST /v1/defi/deposit — prebuilt vault deposit calldata + `to`. */
export async function postDefiDeposit(
  request: DefiDepositRequest,
): Promise<DefiTransactionResponse> {
  const raw = await earnRequest("/v1/defi/deposit", { method: "POST", body: request });
  return DefiTransactionResponseSchema.parse(raw);
}

/** POST /v1/defi/withdraw — prebuilt redeem calldata. */
export async function postDefiWithdraw(
  request: DefiWithdrawRequest,
): Promise<DefiTransactionResponse> {
  const raw = await earnRequest("/v1/defi/withdraw", { method: "POST", body: request });
  return DefiTransactionResponseSchema.parse(raw);
}

/**
 * GET /v1/defi/eth/transaction/status — poll status of a submitted vault transaction.
 *
 * A freshly broadcast transaction is not yet in a block, so the backend cannot find its receipt
 * and answers 5xx (`TransactionReceiptNotFoundError` — "may not be processed on a block yet").
 * That is a transient race, not a failure: only 5xx is mapped to `pending_confirmation` so the poll
 * loop keeps waiting instead of aborting the deposit flow. Genuine non-success states (`error`)
 * still come back from the parsed body, and a persistently unreachable endpoint never reaches
 * `success`.
 *
 * A 4xx, by contrast, is a genuine client error (bad/unknown tx hash, bad params) that will never
 * resolve on its own — we throw it rather than masquerading as pending and spinning the full poll.
 */
export async function getEthTxStatus(txHash: string): Promise<EthTxStatusResponse> {
  const { status, body } = await earnRequestWithStatusNoThrow("/v1/defi/eth/transaction/status", {
    query: { tx_hash: txHash },
  });
  if (status >= 200 && status < 300) {
    const parsed = EthTxStatusResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw new EarnApiError(
        `Earn API GET /v1/defi/eth/transaction/status returned an unparseable body (tx_hash=${txHash}).`,
      );
    }
    return parsed.data;
  }
  if (status >= 500) {
    walletCliDebug(
      `earn-api: tx status ${txHash} not ready yet (HTTP ${status}); treating as pending_confirmation`,
    );
    return { data: { status: "pending_confirmation" } };
  }
  throw new EarnApiError(
    `Earn API GET /v1/defi/eth/transaction/status failed: ${status} (tx_hash=${txHash}).`,
  );
}
