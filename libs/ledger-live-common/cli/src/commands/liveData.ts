import { of, throwError } from "rxjs";
import { reduce, mergeMap } from "rxjs/operators";
import fs from "fs";
import { scan, scanCommonOpts } from "../scan";
import type { ScanCommonOpts } from "../scan";
import { toAccountRaw } from "@ledgerhq/live-common/lib/account/serialization";
import { Account } from "@ledgerhq/live-common/lib/types";
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
  job: (
    opts: ScanCommonOpts &
      Partial<{
        appjson: string;
        add: boolean;
      }>
  ) =>
    scan(opts).pipe(
      reduce<Account, Account[]>(
        (accounts, account) => accounts.concat(account),
        []
      ),
      mergeMap((accounts) => {
        const appjsondata = opts.appjson
          ? JSON.parse(fs.readFileSync(opts.appjson, "utf-8"))
          : {
              data: {
                accounts: [],
              },
            };

        if (typeof appjsondata.data.accounts === "string") {
          return throwError(
            new Error("encrypted ledger live data is not supported")
          );
        }

        const existingIds = appjsondata.data.accounts.map((a) => a.data.id);
        const append = accounts
          .filter((a) => !existingIds.includes(a.id))
          .map((account) => ({
            data: toAccountRaw(account),
            version: 1,
          }));
        appjsondata.data.accounts = appjsondata.data.accounts.concat(append);

        if (opts.appjson) {
          fs.writeFileSync(opts.appjson, JSON.stringify(appjsondata), "utf-8");
          return of(append.length + " accounts added.");
        } else {
          return of(JSON.stringify(appjsondata));
        }
      })
    ),
};
