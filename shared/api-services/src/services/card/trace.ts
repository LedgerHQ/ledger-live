import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { REDACTED } from "./constants";

/**
 * A development-only trace of what the Card provider answered.
 *
 * Nothing in the client reads a renewal answer: every answer but a new session ends the session. So
 * no shipped log carries one either, on purpose — a token endpoint can echo the token it rejected.
 * That rule is right for a shipped log, and it leaves a developer with no way to see what a real
 * provider actually answered.
 *
 * This trace is that way, and it keeps the same rule. It prints in a development build only, it
 * never prints the body of a successful answer, and it replaces every field that can hold a
 * credential.
 */

/**
 * Declared here rather than imported.
 *
 * This package compiles into React Native, into Electron and into tests, and only the last of those
 * has Node's types. Every bundler in the set replaces this expression with a literal.
 */
declare const process: { readonly env?: { readonly NODE_ENV?: string } } | undefined;

/** Read at call time, so one test can turn the trace on and the rest stay quiet. */
function isEnabled(): boolean {
  return typeof process !== "undefined" && process?.env?.NODE_ENV === "development";
}

/** One line, in a development build only. */
export function traceCard(scope: string, message: string): void {
  if (!isEnabled()) {
    return;
  }

  // eslint-disable-next-line no-console
  console.log(`[card ${scope}] ${message}`);
}

export type CardApiAnswer = {
  readonly method: string;
  readonly url: string;
  /** The status of an answer that succeeded. A failure carries its own. */
  readonly responseStatus: number | undefined;
  readonly error: FetchBaseQueryError | undefined;
};

/**
 * Traces one answer from the Card provider.
 *
 * A success prints its status alone: the body is a whole session for either grant, and user data
 * for every other endpoint. A failure prints its body too, redacted, because that body is what the
 * renewal decision reads and what a developer cannot otherwise see.
 */
export function traceCardApiAnswer(answer: CardApiAnswer): void {
  if (!isEnabled()) {
    return;
  }

  const { method, url, responseStatus, error } = answer;

  if (!error) {
    traceCard("api", `${method} ${url} → ${responseStatus ?? "ok"}`);
    return;
  }

  const body = JSON.stringify(redactValue(readErrorBody(error)));
  traceCard("api", `${method} ${url} → ${String(error.status)} ${body}`);
}

/** `data` on an HTTP failure, `error` on a transport one. */
function readErrorBody(error: FetchBaseQueryError): unknown {
  if ("data" in error && error.data !== undefined) {
    return error.data;
  }

  return "error" in error ? error.error : undefined;
}

const MAX_STRING_LENGTH = 200;
const MAX_ITEMS = 10;
const MAX_DEPTH = 4;

/**
 * The keys whose value can be a credential, matched without case.
 *
 * A token endpoint answers a rejected grant with the reason, and this list decides what a
 * development build is allowed to print next to it.
 */
const CREDENTIAL_KEYS = new Set([
  "access_token",
  "assertion",
  "authorization",
  "client_key",
  "client_secret",
  "code",
  "code_verifier",
  "id_token",
  "password",
  "refresh_token",
  "token",
]);

function isCredentialKey(key: string): boolean {
  const lower = key.toLowerCase();
  return CREDENTIAL_KEYS.has(lower) || lower.endsWith("_token") || lower.endsWith("_secret");
}

/** Replaces every credential field, and caps the rest so one answer stays one line. */
function redactValue(value: unknown, depth = 0): unknown {
  if (typeof value === "string") {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }

  if (value === null || typeof value !== "object") {
    return value;
  }

  if (depth >= MAX_DEPTH) {
    return REDACTED;
  }

  if (Array.isArray(value)) {
    return value.slice(0, MAX_ITEMS).map(item => redactValue(item, depth + 1));
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    redacted[key] = isCredentialKey(key) ? REDACTED : redactValue(item, depth + 1);
  }

  return redacted;
}
