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

/**
 * The one place this package talks to the network.
 *
 * Nothing here logs. A stray `console.log` in this file would put the password,
 * the client key or the token into CI output, so the module deliberately has no
 * logging at all — failures are described by the typed errors instead.
 */

export interface BaanxResponse {
  status: number;
  ok: boolean;
  body: unknown;
  retryAfter: string | null;
}

export interface SendJsonArgs {
  baseUrl: string;
  /** Path beginning with a slash, e.g. "/v1/auth/login". */
  path: string;
  method?: string;
  clientKey: string;
  region: BaanxRegion;
  /** Serialised as JSON when present. Omitted entirely for GET-style calls. */
  body?: unknown;
  /** Extra headers, e.g. Authorization. Merged over the defaults. */
  headers?: Record<string, string>;
  fetchImpl: FetchImpl;
}

/** Longest a non-JSON error page we quote back is allowed to be. */
const MAX_NON_JSON_BODY = 2_000;

export async function sendJson({
  baseUrl,
  path,
  method = "POST",
  clientKey,
  region,
  body,
  headers: extraHeaders,
  fetchImpl,
}: SendJsonArgs): Promise<BaanxResponse> {
  const headers: Record<string, string> = { "x-client-key": clientKey };
  // Only meaningful when we are actually sending a payload.
  if (body !== undefined) headers["Content-Type"] = "application/json";
  // US users live on a separate tenant; the header selects it.
  if (region === "us") headers["x-us-env"] = "true";
  Object.assign(headers, extraHeaders);

  let response: Response;
  try {
    response = await fetchImpl(`${baseUrl}${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    // Report the shape of the failure, never the request we attempted.
    throw new BaanxTransportError(
      baseUrl,
      error instanceof Error ? error.message : "unknown transport failure",
    );
  }

  return {
    status: response.status,
    ok: response.ok,
    body: await parseBody(response),
    retryAfter: response.headers.get("retry-after"),
  };
}

async function parseBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    // An HTML error page or a proxy notice. Keep a bounded slice so the caller
    // can tell "wrong host" from "bad payload".
    return { nonJsonBody: text.slice(0, MAX_NON_JSON_BODY) };
  }
}

/**
 * Strip known credential values out of a string.
 *
 * Baanx (or a proxy in front of it) controls the text in `message`, and an API
 * that echoes a submitted value would otherwise put it straight into an error.
 * Redacting the attached body is not enough on its own — the message is a
 * separate path, and this is the chokepoint both go through.
 */
export function redactSecrets(text: string | null, secrets: readonly string[]): string | null {
  if (!text) return text;
  return redactSecretsInText(text, secrets);
}

/**
 * Map a non-2xx onto the error that explains it, keeping Baanx's own message.
 *
 * Shared by the login flow and by `baanxRequest`, so a 429 during data setup
 * reads exactly like a 429 during login. `secrets` are scrubbed from the
 * API-supplied message before it is interpolated.
 */
export function toTypedError(response: BaanxResponse, secrets: readonly string[] = []): Error {
  const apiMessage = redactSecrets(extractApiMessage(response.body), secrets);

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
