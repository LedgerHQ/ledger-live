import fs from "fs";
import path from "path";
import { appendAccounts } from "@features/platform-persistence-accounts";
import type { Account, TokenAccount } from "./enum/Account";
import {
  isEncryptedUserdataError,
  readUserdataAccounts,
  updateUserdataCryptoAssets,
  validateStoredAccount,
  writeUserdataAccounts,
} from "./userdataAccounts";

type AccountRawEntry = {
  data: {
    id?: string;
    currencyId?: string;
    index?: number;
    derivationMode?: string;
    freshAddress?: string;
  };
  version: number;
};

type CryptoAssets = { version?: number; tokens?: { id?: string }[] };

type UserdataFile = {
  data?: { accounts?: AccountRawEntry[] | string; cryptoAssets?: CryptoAssets };
};

const ENV_DIR = "E2E_GENERATED_USERDATA_DIR";

export function getGeneratedUserdataDir(): string | null {
  const dir = process.env[ENV_DIR]?.trim();
  return dir ? dir : null;
}

function readJson(file: string): UserdataFile | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf-8")) as UserdataFile;
  } catch {
    return null;
  }
}

function loadCoinFile(account: Account | TokenAccount): UserdataFile | null {
  const dir = getGeneratedUserdataDir();
  if (!dir || account.currency.id.includes("/")) return null;
  return readJson(path.join(dir, `${account.currency.id}.json`));
}

function matchEntry(
  accounts: AccountRawEntry[],
  account: Account | TokenAccount,
): AccountRawEntry | undefined {
  const sameIndex = accounts.filter(
    e =>
      e.data.index === account.index &&
      (e.data.currencyId === undefined || e.data.currencyId === account.currency.id),
  );
  if (sameIndex.length <= 1 || account.derivationMode == null) return sameIndex[0];
  return (
    sameIndex.find(e => (e.data.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0]
  );
}

function mergeCryptoAssets(
  existing: CryptoAssets | undefined,
  coin: UserdataFile | null,
): CryptoAssets | undefined {
  const tokens = coin?.data?.cryptoAssets?.tokens;
  if (!tokens?.length) return undefined;
  const merged = existing ?? {
    version: coin?.data?.cryptoAssets?.version,
    tokens: [],
  };
  const mergedTokens = merged.tokens ?? [];
  const seen = new Set(mergedTokens.map(t => t.id));
  merged.tokens = [...mergedTokens, ...tokens.filter(token => !seen.has(token.id))];
  return merged;
}

const isCryptoAssets = (value: unknown): value is CryptoAssets =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export function hasGeneratedUserdata(account: Account | TokenAccount): boolean {
  if (account.currency.id.includes("/")) return false;
  const accounts = loadCoinFile(account)?.data?.accounts;
  return Array.isArray(accounts) && matchEntry(accounts, account) !== undefined;
}

export async function applyGeneratedUserdata(
  account: Account | TokenAccount,
  userdataPath?: string,
): Promise<boolean> {
  if (account.currency.id.includes("/")) return false;

  const coin = loadCoinFile(account);
  const accounts = coin?.data?.accounts;
  const entry = Array.isArray(accounts) ? matchEntry(accounts, account) : undefined;
  if (!userdataPath || !entry) return false;

  let stored: unknown[];
  try {
    stored = await readUserdataAccounts(userdataPath);
  } catch (error) {
    // The cli refuses an encrypted file too: leave it as it is.
    if (isEncryptedUserdataError(error)) return false;
    throw error;
  }

  validateStoredAccount(entry);
  await writeUserdataAccounts(userdataPath, appendAccounts(stored, [entry]));
  await updateUserdataCryptoAssets(userdataPath, existing =>
    mergeCryptoAssets(isCryptoAssets(existing) ? existing : undefined, coin),
  );
  return true;
}

export function getGeneratedAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;

  const coin = loadCoinFile(account);
  const accounts = coin?.data?.accounts;
  const address = Array.isArray(accounts) ? matchEntry(accounts, account)?.data.freshAddress : null;
  return address ?? null;
}
