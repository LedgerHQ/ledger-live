import fs from "node:fs";
import path from "node:path";

const USERDATA_DIR = path.resolve(__dirname, "../userdata");

type RawTokenAccount = { id: string; tokenId?: string };
type RawAccount = { id: string; currencyId: string; subAccounts?: RawTokenAccount[] };

const readAccounts = (fixture: string): RawAccount[] => {
  const file = path.join(USERDATA_DIR, `${fixture}.json`);
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return (raw?.data?.accounts ?? []).map((entry: { data: RawAccount }) => entry.data);
};

/**
 * Resolve a parent account id from a userdata fixture by its ledger currency id,
 * so specs reference the app's real ids without hardcoding seed-derived addresses.
 */
export const getFixtureAccountId = (fixture: string, currencyId: string): string => {
  const id = readAccounts(fixture).find(account => account.currencyId === currencyId)?.id;
  if (!id) throw new Error(`No "${currencyId}" account found in fixture "${fixture}"`);
  return id;
};

/**
 * Resolve a token sub-account id from a userdata fixture by its parent currency id
 * and CAL token id.
 */
export const getFixtureTokenAccountId = (
  fixture: string,
  parentCurrencyId: string,
  tokenId: string,
): string => {
  const parent = readAccounts(fixture).find(account => account.currencyId === parentCurrencyId);
  const id = parent?.subAccounts?.find(subAccount => subAccount.tokenId === tokenId)?.id;
  if (!id) {
    throw new Error(`No "${tokenId}" sub-account found in fixture "${fixture}"`);
  }
  return id;
};
