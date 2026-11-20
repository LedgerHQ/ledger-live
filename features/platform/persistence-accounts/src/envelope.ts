import { appendEntries, toRecordDecodeError } from "@shared/persistence";
import { z } from "zod";
import { ACCOUNTS_VERSION_LINE } from "./versionLine";

export const ACCOUNTS_RECORD_KEY = "accounts";
export const ACCOUNTS_RECORD_VERSION = 0;

/** The version that apps/cli writes, and the e2e seeds after it. */
export const CLI_WRITTEN_VERSION = 1;

/**
 * The stored shape of 1 account. The envelope is strict and its `version` stops at the line
 * length, so an account from a newer app does not decode. The account `data` stays loose: each
 * app codec reads it.
 */
export const accountEnvelopeSchema = (zod: typeof z) =>
  zod.strictObject({
    data: zod.looseObject({ id: zod.string(), currencyId: zod.string() }),
    version: zod.number().int().min(0).max(ACCOUNTS_VERSION_LINE.length),
  });

export type StoredAccount = z.infer<ReturnType<typeof accountEnvelopeSchema>>;
export type StoredAccountData = StoredAccount["data"];

const envelopeSchema = accountEnvelopeSchema(z);

/** Validates 1 stored account with no decode. The error has no value. */
export function parseStoredAccount(stored: unknown): StoredAccount {
  const result = envelopeSchema.safeParse(stored);
  if (!result.success) {
    throw toRecordDecodeError(ACCOUNTS_RECORD_KEY, ACCOUNTS_RECORD_VERSION, result.error.issues);
  }
  return result.data;
}

/** The id of a stored account, read with no decode, so an unreadable account keeps its id. */
export function storedAccountId(stored: unknown): string | undefined {
  if (typeof stored !== "object" || stored === null || !("data" in stored)) return undefined;
  const { data } = stored;
  if (typeof data !== "object" || data === null || !("id" in data)) return undefined;
  return typeof data.id === "string" ? data.id : undefined;
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
