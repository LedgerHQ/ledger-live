// @flow

import { BigNumber } from "bignumber.js";
import { from, defer, of, throwError } from "rxjs";
import { skip, take, reduce, mergeMap, map, concatMap } from "rxjs/operators";
import type { Account } from "@ledgerhq/live-common/lib/types";
import { fromAccountRaw } from "@ledgerhq/live-common/lib/account";
import { syncAccount } from "@ledgerhq/live-common/lib/libcore/syncAccount";
import { scanAccountsOnDevice } from "@ledgerhq/live-common/lib/libcore/scanAccountsOnDevice";
import { findCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
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
  }
];

const getCurrencyByKeyword = keyword => {
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

export const inferManagerApp = keyword => {
  try {
    const currency = getCurrencyByKeyword(keyword);
    if (!currency || !currency.managerAppName) return keyword;
    return currency.managerAppName;
  } catch (e) {
    return keyword;
  }
};

export const inferCurrency = ({ device, currency, file, xpub }) => {
  if (currency) {
    return defer(() => of(getCurrencyByKeyword(currency)));
  }
  if (file || xpub) {
    return of(undefined);
  }
  return withDevice(device || "")(t =>
    from(
      getAppAndVersion(t).then(
        r => getCurrencyByKeyword(r.name),
        () => undefined
      )
    )
  );
};

export function scan(arg) {
  const {
    device,
    xpub: xpubArray,
    file,
    appjsonFile,
    scheme,
    index,
    length
  } = arg;

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
        syncAccount(account).pipe(reduce((a, f) => f(a), account))
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
              id: `libcore:1:bitcoin:${xpub}:${derivationMode}`,
              derivationMode,
              currency: cur,
              unit: cur.units[0],
              index: 0,
              freshAddress: "",
              freshAddressPath: "",
              lastSyncDate: new Date(0),
              blockHeight: 0,
              balance: new BigNumber(0),
              operations: [],
              pendingOperations: []
            };
            return account;
          })
        ).pipe(
          concatMap(account =>
            syncAccount(account).pipe(
              reduce((a: Account, f: *) => f(a), account)
            )
          )
        );
      }

      return scanAccountsOnDevice(cur, device || "", mode =>
        scheme !== undefined ? scheme === mode : true
      );
    }),
    skip(index || 0),
    take(length === undefined ? (index !== undefined ? 1 : Infinity) : length)
  );
}
