import { extractApiMessage, looksAccountLocked, redactBody, redactSecretsInText } from "./body";
import { ENV_VARS } from "../config";
import {
  BaanxHttpError,
  BaanxInvalidClientKeyError,
  BaanxInvalidCredentialsError,
  BaanxMissingClientKeyError,
  BaanxRateLimitError,
  BaanxTransportError,
} from "../errors";
import type { BaanxRegion, FetchImpl } from "../types";

export interface BaanxResponse {
  status: number;
  ok: boolean;
  body: unknown;
  retryAfter: string | null;
}

export interface SendJsonArgs {
  baseUrl: string;
  path: string;
  clientKey: string;
  region: BaanxRegion;
  body: unknown;
  fetchImpl: FetchImpl;
}

const MAX_NON_JSON_BODY = 2_000;

export async function sendJson({
  baseUrl,
  path,
  clientKey,
  region,
  body,
  fetchImpl,
}: SendJsonArgs): Promise<BaanxResponse> {
  const headers: Record<string, string> = {
    "x-client-key": clientKey,
    "Content-Type": "application/json",
  };
  if (region === "us") headers["x-us-env"] = "true";

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  } catch (error) {
    throw new BaanxTransportError(baseUrl, transportReason(error));
  }

  return {
    status: response.status,
    ok: response.ok,
    body: await parseBody(response),
    retryAfter: response.headers.get("retry-after"),
  };
}

/**
 * Duck-typed rather than `instanceof Error`. Under a VM-context host — Jest,
 * and therefore Detox — undici builds its rejection in Node's realm, so
 * `instanceof Error` is false for a real `fetch` failure. undici's own message
 * is only ever "fetch failed"; the useful text hangs off `cause`.
 */
function transportReason(error: unknown): string {
  const message = messageOf(error);
  if (!message) return "unknown transport failure";

  const cause = messageOf((error as { cause?: unknown } | null)?.cause);
  return cause && cause !== message ? `${message}: ${cause}` : message;
}

function messageOf(value: unknown): string | null {
  if (typeof value === "string") return value.trim() ? value : null;

  const message = (value as { message?: unknown } | null | undefined)?.message;
  return typeof message === "string" && message.trim() ? message : null;
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { nonJsonBody: text.slice(0, MAX_NON_JSON_BODY) };
  }
}

export function toTypedError(response: BaanxResponse, secrets: readonly string[] = []): Error {
  const rawMessage = extractApiMessage(response.body);
  const apiMessage = rawMessage ? redactSecretsInText(rawMessage, secrets) : null;

  switch (response.status) {
    case 498:
      return new BaanxInvalidClientKeyError(apiMessage, ENV_VARS.clientKey);
    case 499:
      return new BaanxMissingClientKeyError(apiMessage, ENV_VARS.clientKey);
    case 401:
      return new BaanxInvalidCredentialsError(apiMessage, looksAccountLocked(apiMessage));
    case 429:
      return new BaanxRateLimitError(apiMessage, response.retryAfter);
    default:
      return new BaanxHttpError(response.status, apiMessage, redactBody(response.body, secrets));
  }
}
