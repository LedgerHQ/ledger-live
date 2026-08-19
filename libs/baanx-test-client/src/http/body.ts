/**
 * Reading untrusted response bodies, and redacting them before they can be
 * attached to an error or printed.
 *
 * Baanx answers 200 with wildly different shapes depending on how far the login
 * got, so every read here is defensive: nothing is assumed to be present or to
 * have the type we expect.
 */

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** Pull out whatever Baanx used to describe a failure. */
export function extractApiMessage(body: unknown): string | null {
  const record = asRecord(body);

  const direct =
    asString(record.message) ??
    asString(record.error) ??
    asString(record.errorMessage) ??
    asString(record.error_description);
  if (direct) return direct;

  if (Array.isArray(record.errors)) {
    const messages = record.errors
      .map(entry => asString(entry) ?? asString(asRecord(entry).message))
      .filter((entry): entry is string => Boolean(entry));
    if (messages.length > 0) return messages.join("; ");
  }

  // Some gateways nest the real payload one level down.
  return asString(asRecord(record.data).message);
}

export const REDACTION_PLACEHOLDER = "[redacted]";

/**
 * Field names whose values must never be shown. `otpcode` is included
 * deliberately: it is derived from the TOTP secret, so echoing codes leaks
 * material about it. Whether a code was used is reported as `otpUsed` instead.
 */
const REDACTED_KEYS = new Set([
  "password",
  "newpassword",
  "currentpassword",
  "clientkey",
  "client_key",
  "x-client-key",
  "secret",
  "clientsecret",
  "client_secret",
  "totpsecret",
  "otpcode",
  "otp",
  "accesstoken",
  "access_token",
  "refreshtoken",
  "refresh_token",
  "token",
  "authorization",
]);

/**
 * Strip credential-ish fields from a body before it is attached to an error.
 *
 * Unlike a UI tool that renders the token on purpose, everything here is bound
 * for an error object or a log line, so `accessToken` is redacted too — the
 * caller already has the real token from the session object.
 */
export function redactBody(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactBody);

  if (typeof value === "object" && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        REDACTED_KEYS.has(key.toLowerCase()) ? REDACTION_PLACEHOLDER : redactBody(entry),
      ]),
    );
  }

  return value;
}

/** Case-insensitive match against the documented onboarding phase strings. */
export function looksAccountLocked(message: string | null): boolean {
  if (!message) return false;
  return /lock|too many (failed )?attempts|temporarily (disabled|blocked)/i.test(message);
}
