import fs from "node:fs";
import path from "node:path";

const USERDATA_DIR = path.resolve(__dirname, "../userdata");

type RawTokenAccount = { id: string; tokenId?: string };
type RawAccount = {
  id: string;
  currencyId: string;
  name?: string;
  subAccounts?: RawTokenAccount[];
};

const readAccountsFile = (file: string): RawAccount[] => {
  const raw = JSON.parse(fs.readFileSync(file, "utf-8"));
  return (raw?.data?.accounts ?? []).map((entry: { data: RawAccount }) => entry.data);
};

const readAccounts = (fixture: string): RawAccount[] =>
  readAccountsFile(path.join(USERDATA_DIR, `${fixture}.json`));

/**
 * Count the assets each account of a userdata file holds, by account name: its native coin plus
 * every token sub-account, which is what decides whether Send asks to pick an asset first.
 */
export const readHeldAssetCounts = (userdataPath: string): Map<string, number> =>
  new Map(
    readAccountsFile(userdataPath).flatMap(({ name, subAccounts }) =>
      name ? [[name, 1 + (subAccounts?.length ?? 0)] as const] : [],
    ),
  );

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
