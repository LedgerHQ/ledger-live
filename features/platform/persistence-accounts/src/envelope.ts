import { appendEntries } from "@shared/persistence";
import type { z } from "zod";
import { accountsVersions, type accountEnvelopeSchema } from "./accountsVersions";
import { accountIdOfPayload } from "./envelope.internals";

export const ACCOUNTS_RECORD_KEY = "accounts";

/** The version that apps/cli writes, and the e2e seeds after it. */
export const CLI_WRITTEN_VERSION = 1;

export type StoredAccount = z.infer<ReturnType<typeof accountEnvelopeSchema>>;
export type StoredAccountData = StoredAccount["data"];

/**
 * Upgrades 1 stored account to the latest version, with no app decode. The error has no value: a
 * `RecordDecodeError`, or a `NewerRecordVersionError` for an account of a newer app.
 */
export function parseStoredAccount(stored: unknown): StoredAccount {
  return accountsVersions.decode(stored, ACCOUNTS_RECORD_KEY);
}

/** The id of a stored account of any version, read with no decode: an unreadable one keeps it. */
export function storedAccountId(stored: unknown): string | undefined {
  return accountIdOfPayload(accountsVersions.payloadOf(stored));
}

/** Wraps a raw account as apps/cli writes it. For the e2e seeds, which cannot decode accounts. */
export function wrapRaw<Raw extends StoredAccountData>(raw: Raw): { data: Raw; version: number } {
  const envelope = { data: raw, version: CLI_WRITTEN_VERSION };
  parseStoredAccount(envelope);
  return envelope;
}

/**
 * Keeps the stored accounts as they are, also those that do not decode, and adds each new account
 * whose id is not stored yet. For the tools that add accounts to an `app.json` file.
 */
export const appendAccounts = (
  stored: ReadonlyArray<unknown>,
  added: ReadonlyArray<unknown>,
): unknown[] => appendEntries(storedAccountId, stored, added);
