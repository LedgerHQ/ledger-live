import type { Account, AccountRaw, AccountUserData } from "@ledgerhq/types-live";
import accountModel from "~/helpers/accountModel";
import type { State } from "~/renderer/reducers";
import { accountUserDataExportSelector } from "~/renderer/reducers/wallet";

type StoredEntry = { data: AccountRaw; version: number };

/** A frozen copy of the accounts transform of `renderer/storage.ts` before LIVE-41525. */
export const legacyAccountsTransform = {
  get: async (raws: unknown): Promise<Array<[Account, AccountUserData]> | null> => {
    if (typeof raws === "string") return null;
    const accounts: Array<[Account, AccountUserData]> = [];
    if (Array.isArray(raws)) {
      for (const raw of raws) {
        try {
          accounts.push(await accountModel.decode(raw));
        } catch {
          // The legacy transform logs the error and drops the account.
        }
      }
    }
    return accounts;
  },
  set: async (accounts: Array<[Account, AccountUserData]>): Promise<StoredEntry[]> =>
    Promise.all(accounts.map(account => accountModel.encode(account))),
};

/** A frozen copy of `accountsExportSelector` of `renderer/middlewares/db.ts` before LIVE-41525. */
export function legacyAccountsExport(state: Pick<State, "accounts" | "wallet">) {
  const all: Array<[Account, AccountUserData]> = [];
  for (const account of state.accounts) {
    const accountUserData = accountUserDataExportSelector(state.wallet, { account });
    if (accountUserData) all.push([account, accountUserData]);
  }
  return all;
}
