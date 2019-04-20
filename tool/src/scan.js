// @flow

import fs from "fs";
import { BigNumber } from "bignumber.js";
import { Observable, from, defer } from "rxjs";
import { skip, take, reduce, mergeMap } from "rxjs/operators";
import { fromAccountRaw } from "@ledgerhq/live-common/lib/account";
import { syncAccount } from "@ledgerhq/live-common/lib/libcore/syncAccount";
import { scanAccountsOnDevice } from "@ledgerhq/live-common/lib/libcore/scanAccountsOnDevice";
import { findCryptoCurrency } from "@ledgerhq/live-common/lib/currencies";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import { withDevice } from "../../lib/hw/deviceAccess";

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
    desc: "use an xpub (alternatively to --device)"
  },
  {
    name: "file",
    type: String,
    typeDesc: "filename",
    desc: "use a JSON account file or '-' for stdin (alternatively to --device)"
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

export const inferCurrency = ({ device, currency }) => {
  if (currency) {
    return defer(() => getCurrencyByKeyword(currency));
  }
  return withDevice(device)(t =>
    from(
      getAppAndVersion(t).then(
        r => getCurrencyByKeyword(r.name),
        () => undefined
      )
    )
  );
};

export function scan(arg) {
  const { device, xpub, file, scheme, index, length } = arg;
  return inferCurrency(arg).pipe(
    mergeMap(cur => {
      if (!cur) throw new Error("--currency is required");

      if (typeof xpub === "string") {
        const account: Account = {
          name: cur.name,
          xpub,
          seedIdentifier: xpub,
          id: `libcore:1:bitcoin:${xpub}:`,
          derivationMode: "",
          currency: cur,
          unit: cur.units[0],
          index: 0,
          freshAddress: "",
          freshAddressPath: "44'/0'/0'/0/0",
          lastSyncDate: new Date(0),
          blockHeight: 0,
          balance: new BigNumber(0),
          operations: [],
          pendingOperations: []
        };
        return syncAccount(account).pipe(
          reduce((a: Account, f: *) => f(a), account)
        );
      }

      if (typeof file === "string") {
        return Observable.create(o => {
          let sub;
          let closed;

          const readStream =
            file === "-" ? process.stdin : fs.createReadStream(file);

          const chunks = [];
          readStream.on("data", chunk => {
            chunks.push(chunk);
          });

          readStream.on("close", () => {
            try {
              if (closed) return;
              const account = fromAccountRaw(
                JSON.parse(Buffer.concat(chunks).toString("ascii"))
              );
              sub = syncAccount(account)
                .pipe(reduce((a, f) => f(a), account))
                .subscribe(o);
            } catch (e) {
              o.error(e);
            }
          });

          readStream.on("error", err => {
            o.error(err);
          });

          return () => {
            closed = true;
            if (sub) sub.unsubscribe();
          };
        });
      }

      return scanAccountsOnDevice(cur, device || "", mode =>
        typeof scheme === "string" ? scheme.indexOf(mode) > -1 : true
      ).pipe(
        skip(index || 0),
        take(
          length === undefined ? (index !== undefined ? 1 : Infinity) : length
        )
      );
    })
  );
}
