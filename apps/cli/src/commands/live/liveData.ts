import { reduce, mergeMap } from "rxjs/operators";
import { scan, scanCommonOpts } from "../../scan";
import type { ScanCommonOpts } from "../../scan";
import { Account } from "@ledgerhq/types-live";
import { extractPersistedCALFromState, type PersistedCAL } from "@domain/api-currency-token";
import { calStore } from "../../live-common-setup";
import { addAccountsToAppJson, buildAppJson } from "../../persistence/appJson";

export type LiveDataJobOpts = ScanCommonOpts &
  Partial<{
    appjson: string;
    add: boolean;
  }>;

export default {
  description: "utility for Ledger Live app.json file",
  args: [
    ...scanCommonOpts,
    {
      name: "appjson",
      type: String,
      typeDesc: "filename",
      desc: "path to a live desktop app.json",
    },
    {
      name: "add",
      alias: "a",
      type: Boolean,
      desc: "add accounts to live data",
    },
  ],
  job: (opts: LiveDataJobOpts) =>
    scan(opts).pipe(
      reduce<Account, Account[]>((accounts, account) => accounts.concat(account), []),
      mergeMap(async accounts => {
        const persistedTokens: PersistedCAL = extractPersistedCALFromState(calStore.getState());

        if (opts.appjson) {
          const added = await addAccountsToAppJson(opts.appjson, accounts, persistedTokens);
          return added + " accounts added.";
        }
        return buildAppJson(accounts, persistedTokens);
      }),
    ),
};
