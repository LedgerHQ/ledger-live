import { BigNumber } from "bignumber.js";
import { Observable, from, defer, of, throwError, concat } from "rxjs";
import {
  skip,
  take,
  reduce,
  mergeMap,
  map,
  filter,
  concatMap,
} from "rxjs/operators";
import type {
  Account,
  CryptoCurrency,
  SyncConfig,
} from "@ledgerhq/live-common/lib/types";
import {
  fromAccountRaw,
  encodeAccountId,
  decodeAccountId,
  emptyHistoryCache,
} from "@ledgerhq/live-common/lib/account";
import { asDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import {
  getAccountBridge,
  getCurrencyBridge,
} from "@ledgerhq/live-common/lib/bridge";
import {
  findCryptoCurrencyByKeyword,
  findCryptoCurrencyById,
  getCryptoCurrencyById,
} from "@ledgerhq/live-common/lib/currencies";
import {
  runDerivationScheme,
  getDerivationScheme,
} from "@ledgerhq/live-common/lib/derivation";
import { makeBridgeCacheSystem } from "@ledgerhq/live-common/lib/bridge/cache";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { jsonFromFile } from "./stream";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account/helpers";
import fs from "fs";
export const deviceOpt = {
  name: "device",
  alias: "d",
  type: String,
  descOpt: "usb path",
  desc: "provide a specific HID path of a device",
};
export const currencyOpt = {
  name: "currency",
  alias: "c",
  type: String,
  desc: "Currency name or ticker. If not provided, it will be inferred from the device.",
};
const localCache = {};
const cache = makeBridgeCacheSystem({
  saveData(c, d) {
    localCache[c.id] = d;
    return Promise.resolve();
  },

  getData(c) {
    return Promise.resolve(localCache[c.id]);
  },
});
export type ScanCommonOpts = Partial<{
  device: string;
  id: string[];
  xpub: string[];
  file: string;
  appjsonFile: string;
  currency: string;
  scheme: string;
  index: number;
  length: number;
  paginateOperations: number;
}>;
export const scanCommonOpts = [
  deviceOpt,
  {
    name: "xpub",
    type: String,
    desc: "use an xpub (alternatively to --device) [DEPRECATED: prefer use of id]",
    multiple: true,
  },
  {
    name: "id",
    type: String,
    desc: "restore an account id (or a partial version of an id) (alternatively to --device)",
    multiple: true,
  },
  {
    name: "file",
    type: String,
    typeDesc: "filename",
    desc: "use a JSON account file or '-' for stdin (alternatively to --device)",
  },
  {
    name: "appjsonFile",
    type: String,
    typeDesc: "filename",
    desc: "use a desktop app.json (alternatively to --device)",
  },
  currencyOpt,
  {
    name: "scheme",
    alias: "s",
    type: String,
    desc: "if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme.",
  },
  {
    name: "index",
    alias: "i",
    type: Number,
    desc: "select the account by index",
  },
  {
    name: "length",
    alias: "l",
    type: Number,
    desc: "set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise.",
  },
  {
    name: "paginateOperations",
    type: Number,
    desc: "if defined, will paginate operations",
  },
];
export const inferManagerApp = (keyword: string): string => {
  try {
    const currency = findCryptoCurrencyByKeyword(keyword);
    if (!currency || !currency.managerAppName) return keyword;
    return currency.managerAppName;
  } catch (e) {
    return keyword;
  }
};
const implTypePerFamily = {
  tron: "js",
  ripple: "js",
  ethereum: "js",
  polkadot: "js",
  bitcoin: "js",
};
const possibleImpls = {
  js: 1,
  mock: 1,
};
export const inferCurrency = <
  T extends {
    device: string;
    currency: string;
    file: string;
    xpub: string[];
    id: string[];
  }
>({
  device,
  currency,
  file,
  xpub,
  id,
}: Partial<T>) => {
  if (currency) {
    return defer(() => of(findCryptoCurrencyByKeyword(currency)));
  }

  if (file || xpub || id) {
    return of(undefined);
  }

  return withDevice(device || "")((t) =>
    from(
      getAppAndVersion(t)
        .then(
          (r) => findCryptoCurrencyByKeyword(r.name),
          () => undefined
        )
        .then((r) => delay(500).then(() => r))
    )
  );
};

function requiredCurrency(cur) {
  if (!cur) throw new Error("--currency is required");
  return cur;
}

const prepareCurrency = (fn) => (observable) =>
  observable.pipe(
    concatMap((item) => {
      const maybeCurrency = fn(item);
      return maybeCurrency
        ? from(cache.prepareCurrency(maybeCurrency).then(() => item))
        : of(item);
    })
  );

export function scan(arg: ScanCommonOpts): Observable<Account> {
  const {
    device,
    id: idArray,
    xpub: xpubArray,
    file,
    appjsonFile,
    scheme,
    index,
    length,
    paginateOperations,
  } = arg;
  const syncConfig: SyncConfig = {
    paginationConfig: {
      operations: undefined,
    },
  };

  if (typeof paginateOperations === "number") {
    syncConfig.paginationConfig.operations = paginateOperations;
  }

  if (typeof appjsonFile === "string") {
    const appjsondata = appjsonFile
      ? JSON.parse(fs.readFileSync(appjsonFile, "utf-8"))
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

    return from(
      appjsondata.data.accounts.map((a) => fromAccountRaw(a.data))
    ).pipe(
      skip(index || 0) as any,
      take(length === undefined ? (index !== undefined ? 1 : Infinity) : length)
    );
  }

  if (typeof file === "string") {
    return jsonFromFile(file).pipe(
      map(fromAccountRaw),
      prepareCurrency((a) => a.currency),
      concatMap((account: Account) =>
        getAccountBridge(account, null)
          .sync(account, syncConfig)
          .pipe(reduce((a, f: (arg: any) => any) => f(a), account))
      )
    ) as Observable<Account>;
  }

  return inferCurrency(arg).pipe(
    mergeMap((cur: CryptoCurrency | null | undefined) => {
      let ids = idArray;

      if (xpubArray) {
        console.warn("Usage of --xpub is deprecated. Prefer usage of `--id`");
        ids = (ids || []).concat(xpubArray);
      }

      // TODO this should be a "inferAccountId" that needs to look at available impl and do same logic as in bridge.. + we should accept full id as param
      // we kill the --xpub to something else too (--id)
      // Restore from ids
      if (ids) {
        // Infer the full ids
        const fullIds: string[] = ids.map((id) => {
          try {
            // preserve if decodeAccountId don't fail
            decodeAccountId(id);
            return id;
          } catch (e) {
            const splitted = id.split(":");

            const findAndEat = (predicate) => {
              const res = splitted.find(predicate);

              if (typeof res === "string") {
                splitted.splice(splitted.indexOf(res), 1);
                return res;
              }
            };

            const currencyId =
              findAndEat((s) => findCryptoCurrencyById(s)) ||
              requiredCurrency(cur).id;
            const currency = getCryptoCurrencyById(currencyId);
            const type =
              findAndEat((s) => possibleImpls[s]) ||
              implTypePerFamily[currency.family] ||
              "js";
            const version = findAndEat((s) => s.match(/^\d+$/)) || "1";
            const derivationMode = asDerivationMode(
              findAndEat((s) => {
                try {
                  return asDerivationMode(s);
                } catch (e) {
                  // this is therefore not a derivation mode
                }
              }) ??
                scheme ??
                ""
            );

            if (splitted.length === 0) {
              throw new Error(
                "invalid id='" + id + "': missing xpub or address part"
              );
            }

            if (splitted.length > 1) {
              throw new Error(
                "invalid id='" +
                  id +
                  "': couldn't understand which of these are the xpub or address part: " +
                  splitted.join(" | ")
              );
            }

            const xpubOrAddress = splitted[0];
            return encodeAccountId({
              type,
              version,
              currencyId,
              xpubOrAddress,
              derivationMode,
            });
          }
        });
        return from(
          fullIds.map((id) => {
            const { derivationMode, xpubOrAddress, currencyId } =
              decodeAccountId(id);
            const currency = getCryptoCurrencyById(currencyId);
            const scheme = getDerivationScheme({
              derivationMode,
              currency,
            });
            const index = 0;
            const freshAddressPath = runDerivationScheme(scheme, currency, {
              account: index,
              node: 0,
              address: 0,
            });
            const account: Account = {
              type: "Account",
              name:
                currency.name +
                " " +
                (derivationMode || "legacy") +
                " " +
                shortAddressPreview(xpubOrAddress),
              xpub: xpubOrAddress,
              seedIdentifier: xpubOrAddress,
              starred: true,
              used: true,
              swapHistory: [],
              id,
              derivationMode,
              currency,
              unit: currency.units[0],
              index,
              freshAddress: xpubOrAddress,
              freshAddressPath,
              freshAddresses: [],
              creationDate: new Date(),
              lastSyncDate: new Date(0),
              blockHeight: 0,
              balance: new BigNumber(0),
              spendableBalance: new BigNumber(0),
              operationsCount: 0,
              operations: [],
              pendingOperations: [],
              balanceHistoryCache: emptyHistoryCache,
            };
            return account;
          })
        ).pipe(
          prepareCurrency((a: Account) => a.currency),
          concatMap((account: Account) =>
            getAccountBridge(account, null)
              .sync(account, syncConfig)
              .pipe(reduce((a: Account, f: any) => f(a), account))
          )
        );
      }

      const currency = requiredCurrency(cur);
      // otherwise we just scan for accounts
      return concat(
        of(currency).pipe(prepareCurrency((a) => a)),
        getCurrencyBridge(currency).scanAccounts({
          currency,
          deviceId: device || "",
          scheme: scheme && asDerivationMode(scheme),
          syncConfig,
        })
      ).pipe(
        filter((e: any) => e.type === "discovered"),
        map((e) => e.account)
      );
    }),
    skip(index || 0),
    take(length === undefined ? (index !== undefined ? 1 : Infinity) : length)
  );
}
