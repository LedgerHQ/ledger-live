import { access } from "node:fs/promises";
import {
  ACCOUNTS_RECORD_KEY,
  appendAccounts,
  encodeRawAccount,
  type StoredAccountData,
} from "@features/platform-persistence-accounts";
import { StorageLockedError, type StoragePort } from "@shared/storage";
import { createNodeFileStorage, type NodeFileStorage } from "@shared/storage-node-file";

export const ENCRYPTED_USERDATA_MESSAGE = "encrypted ledger live data is not supported";

const CRYPTO_ASSETS_KEY = "cryptoAssets";

// The only module of the seeds that uses the storage port.
const openUserdata = (filePath: string): NodeFileStorage =>
  createNodeFileStorage({ filePath, encryptedKeys: [ACCOUNTS_RECORD_KEY] });

/**
 * The stored accounts as they are, and none when the key is missing. An encrypted file rejects
 * with `StorageLockedError`. Any other value throws, so that a seed never writes over it.
 */
async function readStoredAccounts(storage: StoragePort): Promise<unknown[]> {
  const stored = await storage.get(ACCOUNTS_RECORD_KEY);
  if (stored === undefined || stored === null) return [];
  if (!Array.isArray(stored)) throw new TypeError("The userdata accounts are not a list");
  return stored;
}

export const isEncryptedUserdataError = (error: unknown): boolean =>
  error instanceof StorageLockedError;

export const readUserdataAccounts = (filePath: string): Promise<unknown[]> =>
  readStoredAccounts(openUserdata(filePath));

export const writeUserdataAccounts = (
  filePath: string,
  accounts: ReadonlyArray<unknown>,
): Promise<void> => openUserdata(filePath).set(ACCOUNTS_RECORD_KEY, accounts);

/** Writes the accounts and the token cache that `updateCryptoAssets` gives, in 1 write. */
export async function writeUserdataAccountsAndCryptoAssets(
  filePath: string,
  accounts: ReadonlyArray<unknown>,
  updateCryptoAssets: (stored: unknown) => unknown,
): Promise<void> {
  const storage = openUserdata(filePath);
  const cryptoAssets = updateCryptoAssets(await storage.get(CRYPTO_ASSETS_KEY));
  await storage.setMany({
    [ACCOUNTS_RECORD_KEY]: accounts,
    ...(cryptoAssets === undefined ? {} : { [CRYPTO_ASSETS_KEY]: cryptoAssets }),
  });
}

/** Validates a stored account before a seed adds it or changes it. */
export { parseStoredAccount as validateStoredAccount } from "@features/platform-persistence-accounts";

/**
 * Adds a raw account at the version that the cli writes, unless the file has its id. The stored
 * accounts stay as they are. The file must exist, as before.
 */
export async function addRawAccountIfMissing(
  filePath: string,
  raw: StoredAccountData,
): Promise<void> {
  await access(filePath);
  const storage = openUserdata(filePath);
  const accounts = await readStoredAccounts(storage).catch((error: unknown) => {
    throw isEncryptedUserdataError(error) ? new Error(ENCRYPTED_USERDATA_MESSAGE) : error;
  });
  const all = appendAccounts(accounts, [encodeRawAccount(raw)]);
  if (all.length > accounts.length) await storage.set(ACCOUNTS_RECORD_KEY, all);
}
