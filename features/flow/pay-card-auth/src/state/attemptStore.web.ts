import { parseAttempt, serializeAttempt } from "./internals/attemptPayload";
import type { PayCardStoredAttempt } from "./types";

/**
 * Web and desktop half of the PKCE store. The attempt lives in renderer memory for the length of the
 * login: the external browser redirects back into this same renderer, so memory is enough, and a
 * reload simply asks the user to start again.
 */
let payload: string | null = null;

export async function saveAttempt(attempt: PayCardStoredAttempt): Promise<void> {
  payload = serializeAttempt(attempt);
}

export async function loadAttempt(): Promise<PayCardStoredAttempt | null> {
  return parseAttempt(payload);
}

export async function clearAttempt(): Promise<void> {
  payload = null;
}
