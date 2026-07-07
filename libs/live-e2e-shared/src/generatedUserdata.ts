import fs from "fs";
import path from "path";
import type { Account, TokenAccount } from "./enum/Account";

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
  const sameIndex = accounts.filter(e => e.data.index === account.index);
  if (sameIndex.length <= 1 || account.derivationMode == null) return sameIndex[0];
  return (
    sameIndex.find(e => (e.data.derivationMode ?? "") === account.derivationMode) ?? sameIndex[0]
  );
}

function mergeCryptoAssets(base: UserdataFile, coin: UserdataFile | null): void {
  const tokens = coin?.data?.cryptoAssets?.tokens;
  if (!tokens?.length) return;
  base.data = base.data ?? {};
  const existing = base.data.cryptoAssets ?? {
    version: coin?.data?.cryptoAssets?.version,
    tokens: [],
  };
  const seen = new Set((existing.tokens ?? []).map(t => t.id));
  for (const token of tokens) {
    if (!seen.has(token.id)) (existing.tokens ??= []).push(token);
  }
  base.data.cryptoAssets = existing;
}

export function hasGeneratedUserdata(account: Account | TokenAccount): boolean {
  if (account.currency.id.includes("/")) return false;
  const accounts = loadCoinFile(account)?.data?.accounts;
  return Array.isArray(accounts) && matchEntry(accounts, account) !== undefined;
}

export function applyGeneratedUserdata(
  account: Account | TokenAccount,
  userdataPath?: string,
): boolean {
  if (account.currency.id.includes("/")) return false;

  const coin = loadCoinFile(account);
  const accounts = coin?.data?.accounts;
  const entry = Array.isArray(accounts) ? matchEntry(accounts, account) : undefined;

  if (userdataPath && entry) {
    const base = readJson(userdataPath) ?? {};
    base.data = base.data ?? {};
    if (typeof base.data.accounts !== "string") {
      base.data.accounts = base.data.accounts ?? [];
      if (!base.data.accounts.some(e => e?.data?.id === entry.data.id)) {
        base.data.accounts.push(entry);
      }
      mergeCryptoAssets(base, coin);
      fs.writeFileSync(userdataPath, JSON.stringify(base), "utf-8");
      return true;
    }
  }

  return false;
}

export function getGeneratedAddress(account: Account | TokenAccount): string | null {
  if (account.currency.id.includes("/")) return null;

  const coin = loadCoinFile(account);
  const accounts = coin?.data?.accounts;
  const address = Array.isArray(accounts) ? matchEntry(accounts, account)?.data.freshAddress : null;
  return address ?? null;
}
