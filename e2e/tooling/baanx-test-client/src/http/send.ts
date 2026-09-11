import { extractApiMessage, looksAccountLocked, redactBody, redactSecretsInText } from "./body";
import {
  BaanxHttpError,
  BaanxInvalidClientKeyError,
  BaanxInvalidCredentialsError,
  BaanxMissingClientKeyError,
  BaanxRateLimitError,
  BaanxTransportError,
} from "../errors";
import { DEFAULT_REQUEST_TIMEOUT_MS } from "../types";
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
  secrets?: readonly string[];
  requestTimeoutMs?: number;
}

const MAX_NON_JSON_BODY = 2_000;

export async function sendJson({
  baseUrl,
  path,
  clientKey,
  region,
  body,
  fetchImpl,
  secrets = [],
  requestTimeoutMs = DEFAULT_REQUEST_TIMEOUT_MS,
}: SendJsonArgs): Promise<BaanxResponse> {
  const headers: Record<string, string> = {
    "x-client-key": clientKey,
    "Content-Type": "application/json",
  };
  if (region === "us") headers["x-us-env"] = "true";

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), requestTimeoutMs);
  try {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    return {
      status: response.status,
      ok: response.ok,
      body: await parseBody(response, secrets),
      retryAfter: response.headers.get("retry-after"),
    };
  } catch (error) {
    throw new BaanxTransportError(
      baseUrl,
      redactSecretsInText(transportReason(error, requestTimeoutMs), secrets),
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Do not use `instanceof Error`. Jest (and Detox) run fetch's rejection in
 * another VM realm, so that check is false for a real undici failure. Read
 * `name`, `message` and `cause` as fields. undici's own message is "fetch
 * failed"; `AbortError` or the OS error is on `cause`.
 */
function transportReason(error: unknown, requestTimeoutMs: number): string {
  const cause = isRecord(error) && "cause" in error ? error.cause : undefined;

  if (stringProp(error, "name") === "AbortError" || stringProp(cause, "name") === "AbortError") {
    return `request timed out after ${requestTimeoutMs}ms`;
  }

  const message = messageOf(error);
  if (!message) return "unknown transport failure";

  const causeMessage = messageOf(cause);
  return causeMessage && causeMessage !== message ? `${message}: ${causeMessage}` : message;
}

function messageOf(value: unknown): string | null {
  if (typeof value === "string") return value.trim() ? value : null;
  return stringProp(value, "message");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function stringProp(value: unknown, key: string): string | null {
  if (!isRecord(value)) return null;
  const prop = value[key];
  return typeof prop === "string" && prop.trim() ? prop : null;
}

async function parseBody(response: Response, secrets: readonly string[]): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { nonJsonBody: redactSecretsInText(text, secrets).slice(0, MAX_NON_JSON_BODY) };
  }
}

export function toTypedError(response: BaanxResponse, secrets: readonly string[] = []): Error {
  const rawMessage = extractApiMessage(response.body);
  const apiMessage = rawMessage ? redactSecretsInText(rawMessage, secrets) : null;

  switch (response.status) {
    case 498:
      return new BaanxInvalidClientKeyError(apiMessage);
    case 499:
      return new BaanxMissingClientKeyError(apiMessage);
    case 401:
      return new BaanxInvalidCredentialsError(apiMessage, looksAccountLocked(apiMessage));
    case 429:
      return new BaanxRateLimitError(
        apiMessage,
        response.retryAfter === null ? null : redactSecretsInText(response.retryAfter, secrets),
      );
    default:
      return new BaanxHttpError(response.status, apiMessage, redactBody(response.body, secrets));
  }
}
