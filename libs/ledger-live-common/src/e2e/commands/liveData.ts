import fs from "fs";
import { lastValueFrom } from "rxjs";
import { reduce } from "rxjs/operators";
import type { Account } from "@ledgerhq/types-live";
import { getReduxStore } from "@ledgerhq/cryptoassets/cal-client/test-helpers";
import {
  extractTokensFromState,
  PERSISTENCE_VERSION,
  type PersistedCAL,
} from "@ledgerhq/cryptoassets/cal-client/persistence";
import { toAccountRaw } from "../../account/serialization";
import type { LiveDataOpts } from "./types";
import { scan } from "./scan";

export async function cmdLiveData(opts: LiveDataOpts): Promise<string> {
  if (!opts.currency) throw new Error("--currency is required");

  const accounts = await lastValueFrom(
    scan({
      currency: opts.currency,
      scheme: opts.scheme,
      index: opts.index,
    }).pipe(reduce<Account, Account[]>((acc, account) => acc.concat(account), [])),
    { defaultValue: [] as Account[] },
  );

  const appjsondata = opts.appjson
    ? JSON.parse(fs.readFileSync(opts.appjson, "utf-8"))
    : { data: { accounts: [] } };

  if (typeof appjsondata.data.accounts === "string") {
    throw new Error("encrypted ledger live data is not supported");
  }

  const existingIds = appjsondata.data.accounts.map((a: { data: { id: string } }) => a.data.id);
  const append = await Promise.all(
    accounts
      .filter(a => !existingIds.includes(a.id))
      .map(async account => ({ data: await toAccountRaw(account), version: 1 })),
  );
  appjsondata.data.accounts = appjsondata.data.accounts.concat(append);

  const state = getReduxStore().getState();
  const tokens = extractTokensFromState(state);
  const persistedTokens: PersistedCAL = { version: PERSISTENCE_VERSION, tokens };
  appjsondata.data.cryptoAssets = persistedTokens;

  if (opts.appjson) {
    fs.writeFileSync(opts.appjson, JSON.stringify(appjsondata), "utf-8");
    return append.length + " accounts added.";
  }
  return JSON.stringify(appjsondata);
}
