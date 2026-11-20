import { access } from "node:fs/promises";
import { ACCOUNTS_RECORD_KEY, appendAccounts } from "@features/platform-persistence-accounts";
import type { Account } from "@ledgerhq/types-live";
import { decodeEntries, encodeEntries } from "@shared/persistence";
import { StorageLockedError, type StoragePort } from "@shared/storage";
import { createNodeFileStorage } from "@shared/storage-node-file";
import { cliAccountsCodec } from "./accountsCodec";

export const ENCRYPTED_APP_JSON_MESSAGE = "encrypted ledger live data is not supported";

const describeWithoutValue = (error: unknown) =>
  error instanceof Error ? error.name : typeof error;

async function openAppJson(filePath: string): Promise<StoragePort> {
  await access(filePath);
  return createNodeFileStorage({ filePath, encryptedKeys: [ACCOUNTS_RECORD_KEY] });
}

/**
 * The stored accounts as they are, and none when the key is missing. An encrypted file rejects
 * with `StorageLockedError`. Any other value throws, so that the cli never writes over it.
 */
async function readStoredAccounts(storage: StoragePort): Promise<unknown[]> {
  const stored = await storage.get(ACCOUNTS_RECORD_KEY);
  if (stored === undefined || stored === null) return [];
  if (!Array.isArray(stored)) throw new TypeError("The app.json accounts are not a list");
  return stored;
}

const refuseEncrypted = (error: unknown): never => {
  throw error instanceof StorageLockedError ? new Error(ENCRYPTED_APP_JSON_MESSAGE) : error;
};

/** The accounts of an app.json file. An account that does not decode is a warning. */
export async function decodeAppJsonAccounts(filePath: string): Promise<Account[]> {
  const stored = await readStoredAccounts(await openAppJson(filePath)).catch(refuseEncrypted);
  const { decoded, failures } = await decodeEntries(cliAccountsCodec, stored);
  for (const { index, error } of failures) {
    console.warn(
      `app.json: skipped the account at index ${index} (${describeWithoutValue(error)})`,
    );
  }
  return decoded;
}

const encodeNewAccounts = (accounts: ReadonlyArray<Account>) =>
  encodeEntries(cliAccountsCodec, accounts, undefined);

/**
 * Adds the accounts that the app.json file does not have yet, and the token cache. The stored
 * accounts stay as they are. Returns the number of accounts added.
 */
export async function addAccountsToAppJson(
  filePath: string,
  accounts: ReadonlyArray<Account>,
  cryptoAssets: unknown,
): Promise<number> {
  const storage = await openAppJson(filePath);
  const stored = await readStoredAccounts(storage).catch(refuseEncrypted);
  const all = appendAccounts(stored, await encodeNewAccounts(accounts));
  await storage.set(ACCOUNTS_RECORD_KEY, all);
  await storage.set("cryptoAssets", cryptoAssets);
  return all.length - stored.length;
}

/** A new app.json content with the accounts and the token cache, for the standard output. */
export async function buildAppJson(
  accounts: ReadonlyArray<Account>,
  cryptoAssets: unknown,
): Promise<string> {
  const added = await encodeNewAccounts(accounts);
  return JSON.stringify({ data: { [ACCOUNTS_RECORD_KEY]: added, cryptoAssets } });
}
