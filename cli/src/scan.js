// @flow

import { BigNumber } from "bignumber.js";
import { Observable, from, defer, of, throwError } from "rxjs";
import {
  skip,
  take,
  reduce,
  mergeMap,
  map,
  filter,
  concatMap
} from "rxjs/operators";
import type { Account, CryptoCurrency } from "@ledgerhq/live-common/lib/types";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import {
  fromAccountRaw,
  encodeAccountId
} from "@ledgerhq/live-common/lib/account";
import { asDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import {
  getAccountBridge,
  getCurrencyBridge
} from "@ledgerhq/live-common/lib/bridge";
import { findCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import { delay } from "@ledgerhq/live-common/lib/promise";
import { jsonFromFile } from "./stream";
import { shortAddressPreview } from "@ledgerhq/live-common/lib/account/helpers";
import fs from "fs";

export const deviceOpt = {
  name: "device",
  type: String,
  descOpt: "usb path",
  desc: "provide a specific HID path of a device"
};

export const currencyOpt = {
  name: "currency",
  alias: "c",
  type: String,
  desc:
    "Currency name or ticker. If not provided, it will be inferred from the device."
};

export type ScanCommonOpts = $Shape<{
  device: string,
  xpub: string[],
  file: string,
  appjsonFile: string,
  currency: string,
  scheme: string,
  index: number,
  length: number,
  paginateOperations: number
}>;

export const scanCommonOpts = [
  deviceOpt,
  {
    name: "xpub",
    type: String,
    desc: "use an xpub (alternatively to --device)",
    multiple: true
  },
  {
    name: "file",
    type: String,
    typeDesc: "filename",
    desc: "use a JSON account file or '-' for stdin (alternatively to --device)"
  },
  {
    name: "appjsonFile",
    type: String,
    typeDesc: "filename",
    desc: "use a desktop app.json (alternatively to --device)"
  },
  currencyOpt,
  {
    name: "scheme",
    alias: "s",
    type: String,
    desc:
      "if provided, filter the derivation path that are scanned by a given sceme. Providing '' empty string will only use the default standard derivation scheme."
  },
  {
    name: "index",
    alias: "i",
    type: Number,
    desc: "select the account by index"
  },
  {
    name: "length",
    alias: "l",
    type: Number,
    desc:
      "set the number of accounts after the index. Defaults to 1 if index was provided, Infinity otherwise."
  },
  {
    name: "paginateOperations",
    type: Number,
    desc: "if defined, will paginate operations"
  }
];

export const getCurrencyByKeyword = (keyword: string): CryptoCurrency => {
  const r = findCryptoCurrency(c => {
    const search = keyword.replace(/ /, "").toLowerCase();
    return (
      c.id === search ||
      c.name.replace(/ /, "").toLowerCase() === search ||
      (c.managerAppName &&
        c.managerAppName.replace(/ /, "").toLowerCase() === search) ||
      c.ticker.toLowerCase() === search
    );
  });
  if (!r) {
    throw new Error("currency '" + keyword + "' not found");
  }
  return r;
};

export const inferManagerApp = (keyword: string): string => {
  try {
    const currency = getCurrencyByKeyword(keyword);
    if (!currency || !currency.managerAppName) return keyword;
    return currency.managerAppName;
  } catch (e) {
    return keyword;
  }
};

export const inferCurrency = <
  T: {
    device: string,
    currency: string,
    file: string,
    xpub: string[]
  }
>({
  device,
  currency,
  file,
  xpub
}: $Shape<T>) => {
  if (currency) {
    return defer(() => of(getCurrencyByKeyword(currency)));
  }
  if (file || xpub) {
    return of(undefined);
  }
  return withDevice(device || "")(t =>
    from(
      getAppAndVersion(t)
        .then(
          r => getCurrencyByKeyword(r.name),
          () => undefined
        )
        .then(r => delay(500).then(() => r))
    )
  );
};

export function scan(arg: ScanCommonOpts): Observable<Account> {
  const {
    device,
    xpub: xpubArray,
    file,
    appjsonFile,
    scheme,
    index,
    length,
    paginateOperations
  } = arg;

  const syncConfig = { paginationConfig: {} };

  if (paginateOperations) {
    syncConfig.paginationConfig.operations = paginateOperations;
  }

  if (typeof appjsonFile === "string") {
    const appjsondata = appjsonFile
      ? JSON.parse(fs.readFileSync(appjsonFile, "utf-8"))
      : { data: { accounts: [] } };

    if (typeof appjsondata.data.accounts === "string") {
      return throwError(
        new Error("encrypted ledger live data is not supported")
      );
    }
    return from(
      appjsondata.data.accounts.map(a => fromAccountRaw(a.data))
    ).pipe(
      skip(index || 0),
      take(length === undefined ? (index !== undefined ? 1 : Infinity) : length)
    );
  }

  if (typeof file === "string") {
    return jsonFromFile(file).pipe(
      map(fromAccountRaw),
      concatMap(account =>
        getAccountBridge(account, null)
          .sync(account, syncConfig)
          .pipe(reduce((a, f) => f(a), account))
      )
    );
  }

  return inferCurrency(arg).pipe(
    mergeMap(cur => {
      if (!cur) throw new Error("--currency is required");

      if (xpubArray) {
        const derivationMode = scheme || "";
        return from(
          xpubArray.map(xpub => {
            const account: $Exact<Account> = {
              type: "Account",
              name:
                cur.name +
                " " +
                (derivationMode || "legacy") +
                " " +
                shortAddressPreview(xpub),
              xpub,
              seedIdentifier: xpub,
              id: encodeAccountId({
                type: getEnv("BRIDGE_FORCE_IMPLEMENTATION") || "libcore",
                version: "1",
                currencyId: cur.id,
                xpubOrAddress: xpub,
                derivationMode: asDerivationMode(derivationMode || "")
              }),
              derivationMode: asDerivationMode(derivationMode),
              currency: cur,
              unit: cur.units[0],
              index: 0,
              freshAddress: xpub, // HACK for JS impl force mode that would only support address version
              freshAddressPath: "",
              freshAddresses: [],
              lastSyncDate: new Date(0),
              blockHeight: 0,
              balance: new BigNumber(0),
              spendableBalance: new BigNumber(0),
              operationsCount: 0,
              operations: [],
              pendingOperations: []
            };
            return account;
          })
        ).pipe(
          concatMap(account =>
            getAccountBridge(account, null)
              .sync(account, syncConfig)
              .pipe(reduce((a: Account, f: *) => f(a), account))
          )
        );
      }
      return getCurrencyBridge(cur)
        .scanAccounts({
          currency: cur,
          deviceId: device || "",
          scheme: scheme && asDerivationMode(scheme),
          syncConfig
        })
        .pipe(
          filter(e => e.type === "discovered"),
          map(e => e.account)
        );
    }),
    skip(index || 0),
    take(length === undefined ? (index !== undefined ? 1 : Infinity) : length)
  );
}
