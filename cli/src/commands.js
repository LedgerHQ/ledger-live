// @flow
/* eslint-disable global-require */

import {
  from,
  defer,
  of,
  concat,
  empty,
  Observable,
  interval,
  throwError
} from "rxjs";
import {
  filter,
  map,
  reduce,
  mergeMap,
  ignoreElements,
  concatMap,
  shareReplay,
  tap,
  scan as rxScan,
  catchError
} from "rxjs/operators";
import fs from "fs";
import qrcode from "qrcode-terminal";
import { dataToFrames } from "qrloop";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { getAccountBridge } from "@ledgerhq/live-common/lib/bridge";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import { getAccountNetworkInfo } from "@ledgerhq/live-common/lib/libcore/getAccountNetworkInfo";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";
import {
  toTransactionStatusRaw,
  toTransactionRaw
} from "@ledgerhq/live-common/lib/transaction";
import { encode } from "@ledgerhq/live-common/lib/cross";
import manager from "@ledgerhq/live-common/lib/manager";
import { asDerivationMode } from "@ledgerhq/live-common/lib/derivation";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/lib/hw/getVersion";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import { listApps } from "@ledgerhq/live-common/lib/apps/hw";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import prepareFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-main";
import repairFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";
import getAddress from "@ledgerhq/live-common/lib/hw/getAddress";
import signMessage from "@ledgerhq/live-common/lib/hw/signMessage";
import { discoverDevices } from "@ledgerhq/live-common/lib/hw";
import accountFormatters from "./accountFormatters";
import proxy from "./proxy";
import {
  scan,
  scanCommonOpts,
  currencyOpt,
  deviceOpt,
  inferCurrency,
  inferManagerApp
} from "./scan";
import type { ScanCommonOpts } from "./scan";
import type { InferTransactionsOpts } from "./transaction";
import { inferTransactions, inferTransactionsOpts } from "./transaction";
import { apdusFromFile } from "./stream";
import { toAccountRaw } from "@ledgerhq/live-common/lib/account/serialization";
import { Buffer } from "buffer";
import appsUpdateTestAll from "./cmds/appsUpdateTestAll";

const getAccountNetworkInfoFormatters = {
  json: e => JSON.stringify(e)
};

const getTransactionStatusFormatters = {
  json: ({ status, transaction }) => ({
    status: JSON.stringify(toTransactionStatusRaw(status)),
    transaction: JSON.stringify(toTransactionRaw(transaction))
  })
};

const asQR = str =>
  Observable.create(o =>
    qrcode.generate(str, r => {
      o.next(r);
      o.complete();
    })
  );

const all = {
  version: {
    args: [],
    job: () =>
      concat(
        of("ledger-live cli: " + require("../package.json").version),
        of(
          "@ledgerhq/live-common: " +
            require("@ledgerhq/live-common/package.json").version
        ),
        of(
          "@ledgerhq/ledger-core: " +
            require("@ledgerhq/ledger-core/package.json").version
        ),
        from(withLibcore(core => core.LedgerCore.getStringVersion())).pipe(
          map(v => "libcore: " + v)
        )
      )
  },

  libcoreReset: {
    args: [],
    job: () =>
      withLibcore(async core => {
        await core.getPoolInstance().freshResetAll();
      })
  },

  libcoreSetPassword: {
    args: [{ name: "password", type: String, desc: "the new password" }],
    job: ({ password }: $Shape<{ password: string }>) =>
      withLibcore(core =>
        core
          .getPoolInstance()
          .changePassword(getEnv("LIBCORE_PASSWORD"), password || "")
      )
  },

  proxy,

  discoverDevices: {
    args: [
      {
        name: "module",
        alias: "m",
        type: String,
        desc: "filter a specific module (either hid | ble)"
      },
      {
        name: "interactive",
        alias: "i",
        type: Boolean,
        desc:
          "interactive mode that accumulate the events instead of showing them"
      }
    ],
    job: ({
      module,
      interactive
    }: $Shape<{
      module: string,
      interactive: boolean
    }>) => {
      const events = discoverDevices(m =>
        !module ? true : module.split(",").includes(m.id)
      );
      if (!interactive) return events;
      return events
        .pipe(
          rxScan((acc, value) => {
            let copy;
            if (value.type === "remove") {
              copy = acc.filter(a => a.id === value.id);
            } else {
              const existing = acc.find(o => o.id === value.id);
              if (existing) {
                const i = acc.indexOf(existing);
                copy = [...acc];
                if (value.name) {
                  copy[i] = value;
                }
              } else {
                copy = acc.concat({ id: value.id, name: value.name });
              }
            }
            return copy;
          }, [])
        )
        .pipe(
          tap(() => {
            // eslint-disable-next-line no-console
            console.clear();
          }),
          map(acc =>
            acc
              .map(o => `${(o.name || "(no name)").padEnd(40)} ${o.id}`)
              .join("\n")
          )
        );
    }
  },

  deviceVersion: {
    args: [deviceOpt],
    job: ({ device }: $Shape<{ device: string }>) =>
      withDevice(device || "")(t => from(getVersion(t)))
  },

  deviceAppVersion: {
    args: [deviceOpt],
    job: ({ device }: $Shape<{ device: string }>) =>
      withDevice(device || "")(t => from(getAppAndVersion(t)))
  },

  deviceInfo: {
    args: [deviceOpt],
    job: ({ device }: $Shape<{ device: string }>) =>
      withDevice(device || "")(t => from(getDeviceInfo(t)))
  },

  repl: {
    description: "Low level exchange with the device. Send APDUs from stdin.",
    args: [
      deviceOpt,
      {
        name: "file",
        alias: "f",
        type: String,
        typeDesc: "filename",
        desc: "A file can also be provided. By default stdin is used."
      }
    ],
    job: ({ device, file }: { device: string, file: string }) =>
      withDevice(device || "")(t =>
        apdusFromFile(file || "-").pipe(concatMap(apdu => t.exchange(apdu)))
      ).pipe(map(res => res.toString("hex")))
  },

  liveData: {
    description: "utility for Ledger Live app.json file",
    args: [
      ...scanCommonOpts,
      {
        name: "appjson",
        type: String,
        typeDesc: "filename",
        desc: "path to a live desktop app.json"
      },
      {
        name: "add",
        alias: "a",
        type: Boolean,
        desc: "add accounts to live data"
      }
    ],
    job: (
      opts: ScanCommonOpts &
        $Shape<{
          appjson: string,
          add: boolean
        }>
    ) =>
      scan(opts).pipe(
        reduce((accounts, account) => accounts.concat(account), []),
        mergeMap(accounts => {
          const appjsondata = opts.appjson
            ? JSON.parse(fs.readFileSync(opts.appjson, "utf-8"))
            : { data: { accounts: [] } };
          if (typeof appjsondata.data.accounts === "string") {
            return throwError(
              new Error("encrypted ledger live data is not supported")
            );
          }
          const existingIds = appjsondata.data.accounts.map(a => a.data.id);
          const append = accounts
            .filter(a => !existingIds.includes(a.id))
            .map(account => ({
              data: toAccountRaw(account),
              version: 1
            }));
          appjsondata.data.accounts = appjsondata.data.accounts.concat(append);
          if (opts.appjson) {
            fs.writeFileSync(
              opts.appjson,
              JSON.stringify(appjsondata),
              "utf-8"
            );
            return of(append.length + " accounts added.");
          } else {
            return of(JSON.stringify(appjsondata));
          }
        })
      )
  },

  exportAccounts: {
    description: "Export given accounts to Live QR or console for importing",
    args: [
      ...scanCommonOpts,
      {
        name: "out",
        alias: "o",
        type: Boolean,
        desc: "output to console"
      }
    ],
    job: (
      opts: ScanCommonOpts &
        $Shape<{
          out: boolean
        }>
    ) =>
      scan(opts).pipe(
        reduce((accounts, account) => accounts.concat(account), []),
        mergeMap(accounts => {
          const data = encode({
            accounts,
            settings: {
              pairExchanges: {},
              currenciesSettings: {}
            },
            exporterName: "ledger-live-cli",
            exporterVersion: "0.0.0"
          });
          const frames = dataToFrames(data, 80, 4);

          if (opts.out) {
            return of(Buffer.from(JSON.stringify(frames)).toString("base64"));
          } else {
            const qrObservables = frames.map(str =>
              asQR(str).pipe(shareReplay())
            );
            return interval(300).pipe(
              mergeMap(i => qrObservables[i % qrObservables.length])
            );
          }
        }),
        tap(() => console.clear()) // eslint-disable-line no-console
      )
  },

  genuineCheck: {
    description: "Perform a genuine check with Ledger's HSM",
    args: [deviceOpt],
    job: ({ device }: $Shape<{ device: string }>) =>
      withDevice(device || "")(t =>
        from(getDeviceInfo(t)).pipe(
          mergeMap(deviceInfo => genuineCheck(t, deviceInfo))
        )
      )
  },

  firmwareUpdate: {
    description: "Perform a firmware update",
    args: [deviceOpt],
    job: ({ device }: $Shape<{ device: string }>) =>
      withDevice(device || "")(t => from(getDeviceInfo(t))).pipe(
        mergeMap(manager.getLatestFirmwareForDevice),
        mergeMap(firmware => {
          if (!firmware) return of("already up to date");
          return concat(
            of(
              `firmware: ${firmware.final.name}\nOSU: ${firmware.osu.name} (hash: ${firmware.osu.hash})`
            ),
            prepareFirmwareUpdate("", firmware),
            mainFirmwareUpdate("", firmware)
          );
        })
      )
  },

  firmwareRepair: {
    description: "Repair a firmware update",
    args: [
      deviceOpt,
      {
        name: "forceMCU",
        type: String,
        desc: "force a mcu version to install"
      }
    ],
    job: ({ device, forceMCU }: $Shape<{ device: string, forceMCU: string }>) =>
      repairFirmwareUpdate(device || "", forceMCU)
  },

  appsUpdateTestAll,

  managerListApps: {
    description: "List apps that can be installed on the device",
    args: [
      deviceOpt,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: "raw | json | default"
      }
    ],
    job: ({ device, format }: $Shape<{ device: string, format: string }>) =>
      withDevice(device || "")(t =>
        from(getDeviceInfo(t)).pipe(
          mergeMap(deviceInfo =>
            listApps(t, deviceInfo).pipe(
              filter(e => e.type === "result"),
              map(e => e.result)
            )
          ),
          map(r =>
            format === "raw"
              ? r
              : format === "json"
              ? JSON.stringify(r)
              : r.appsListNames
                  .map(name => {
                    const item = r.appByName[name];
                    const ins = r.installed.find(i => i.name === item.name);
                    return (
                      `- ${item.name} ${item.version}` +
                      (ins
                        ? ins.updated
                          ? " (installed)"
                          : " (outdated!)"
                        : "")
                    );
                  })
                  .join("\n")
          )
        )
      )
  },

  app: {
    description: "Manage Ledger device's apps",
    args: [
      deviceOpt,
      {
        name: "verbose",
        alias: "v",
        type: Boolean,
        desc: "enable verbose logs"
      },
      {
        name: "install",
        alias: "i",
        type: String,
        desc: "install an application by its name",
        multiple: true
      },
      {
        name: "uninstall",
        alias: "u",
        type: String,
        desc: "uninstall an application by its name",
        multiple: true
      },
      {
        name: "open",
        alias: "o",
        type: String,
        desc: "open an application by its display name"
      },
      {
        name: "quit",
        alias: "q",
        type: Boolean,
        desc: "close current application"
      }
    ],
    job: ({
      device,
      verbose,
      install,
      uninstall,
      open,
      quit
    }: $Shape<{
      device: string,
      verbose: boolean,
      install: string[],
      uninstall: string[],
      open: string,
      quit: string
    }>) =>
      withDevice(device || "")(t => {
        if (quit) return from(quitApp(t));
        if (open) return from(openApp(t, inferManagerApp(open)));

        return from(getDeviceInfo(t)).pipe(
          mergeMap(deviceInfo =>
            from(manager.getAppsList(deviceInfo, true)).pipe(
              mergeMap(list =>
                concat(
                  ...(uninstall || []).map(application => {
                    const { targetId } = deviceInfo;
                    const app = list.find(
                      item =>
                        item.name.toLowerCase() ===
                        inferManagerApp(application).toLowerCase()
                    );
                    if (!app) {
                      throw new Error(
                        "application '" + application + "' not found"
                      );
                    }
                    return uninstallApp(t, targetId, app);
                  }),
                  ...(install || []).map(application => {
                    const { targetId } = deviceInfo;
                    const app = list.find(
                      item =>
                        item.name.toLowerCase() ===
                        inferManagerApp(application).toLowerCase()
                    );
                    if (!app) {
                      throw new Error(
                        "application '" + application + "' not found"
                      );
                    }
                    return installApp(t, targetId, app);
                  })
                )
              )
            )
          ),
          verbose ? map(a => a) : ignoreElements()
        );
      })
  },

  validRecipient: {
    description: "Validate a recipient address",
    args: [
      {
        name: "recipient",
        alias: "r",
        type: String,
        desc: "the address to validate"
      },
      currencyOpt,
      deviceOpt
    ],
    job: (
      arg: $Shape<{
        recipient: string,
        currency: string,
        device: string
      }>
    ) =>
      inferCurrency(arg)
        .toPromise()
        .then(currency =>
          isValidRecipient({
            currency,
            recipient: arg.recipient
          })
        )
        .then(
          warning =>
            warning ? { type: "warning", warning } : { type: "success" },
          error => ({ type: "error", error: error.message })
        )
  },

  signMessage: {
    description:
      "Sign a message with the device on specific derivations (advanced)",
    args: [
      currencyOpt,
      { name: "path", type: String, desc: "HDD derivation path" },
      { name: "derivationMode", type: String, desc: "derivationMode to use" },
      { name: "message", type: String, desc: "the message to sign" }
    ],
    job: (arg: *) =>
      inferCurrency(arg).pipe(
        mergeMap(currency => {
          if (!currency) {
            throw new Error("no currency provided");
          }
          if (!arg.path) {
            throw new Error("--path is required");
          }
          asDerivationMode(arg.derivationMode);
          return withDevice(arg.device || "")(t =>
            from(
              signMessage(t, {
                ...arg,
                currency
              })
            )
          );
        })
      )
  },

  getAddress: {
    description:
      "Get an address with the device on specific derivations (advanced)",
    args: [
      currencyOpt,
      deviceOpt,
      { name: "path", type: String, desc: "HDD derivation path" },
      { name: "derivationMode", type: String, desc: "derivationMode to use" },
      {
        name: "verify",
        alias: "v",
        type: Boolean,
        desc: "also ask verification on device"
      }
    ],
    job: (
      arg: $Shape<{
        currency: string,
        device: string,
        path: string,
        derivationMode: string,
        verify: boolean
      }>
    ) =>
      inferCurrency(arg).pipe(
        mergeMap(currency => {
          if (!currency) {
            throw new Error("no currency provided");
          }
          if (!arg.path) {
            throw new Error("--path is required");
          }
          asDerivationMode(arg.derivationMode);
          return withDevice(arg.device || "")(t =>
            from(
              getAddress(t, {
                currency,
                path: arg.path,
                derivationMode: asDerivationMode(arg.derivationMode || "")
              })
            )
          );
        })
      )
  },

  getTransactionStatus: {
    description:
      "Prepare a transaction and returns 'TransactionStatus' meta information",
    args: [
      ...scanCommonOpts,
      ...inferTransactionsOpts,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: Object.keys(getTransactionStatusFormatters).join(" | "),
        desc: "how to display the data"
      }
    ],
    job: (opts: ScanCommonOpts & InferTransactionsOpts & { format: string }) =>
      scan(opts).pipe(
        concatMap(account =>
          from(inferTransactions(account, opts)).pipe(
            mergeMap(inferred =>
              inferred.reduce(
                (acc, transaction) =>
                  concat(
                    acc,
                    from(
                      defer(() =>
                        getAccountBridge(account)
                          .getTransactionStatus(account, transaction)
                          .then(status => ({ transaction, status }))
                      )
                    )
                  ),
                empty()
              )
            ),
            map(e => {
              const f = getTransactionStatusFormatters[opts.format || "json"];
              if (!f) {
                throw new Error(
                  "getTransactionStatusFormatters: no such formatter '" +
                    opts.format +
                    "'"
                );
              }
              return f(e);
            })
          )
        )
      )
  },

  sync: {
    description: "Synchronize accounts with blockchain",
    args: [
      ...scanCommonOpts,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: Object.keys(accountFormatters).join(" | "),
        desc: "how to display the data"
      }
    ],
    job: (opts: ScanCommonOpts & { format: string }) =>
      scan(opts).pipe(
        map(account =>
          (accountFormatters[opts.format] || accountFormatters.default)(account)
        )
      )
  },

  getAccountNetworkInfo: {
    description: "Get the currency network info for accounts",
    args: [
      ...scanCommonOpts,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: Object.keys(getAccountNetworkInfoFormatters).join(" | "),
        desc: "how to display the data"
      }
    ],
    job: (opts: ScanCommonOpts & { format: string }) =>
      scan(opts).pipe(
        mergeMap(account => from(getAccountNetworkInfo(account))),
        map(e => {
          const f = getAccountNetworkInfoFormatters[opts.format || "json"];
          if (!f) {
            throw new Error(
              "getAccountNetworkInfo: no such formatter '" + opts.format + "'"
            );
          }
          return f(e);
        })
      )
  },

  receive: {
    description: "Receive crypto-assets (verify on device)",
    args: [
      ...scanCommonOpts,
      {
        name: "qr",
        type: Boolean,
        desc: "also display a QR Code"
      }
    ],
    job: (opts: ScanCommonOpts & { qr: boolean }) =>
      scan(opts).pipe(
        concatMap(account =>
          concat(
            of(account.freshAddress),
            opts.qr ? asQR(account.freshAddress) : empty(),
            withDevice(opts.device || "")(t =>
              from(
                getAddress(t, {
                  currency: account.currency,
                  derivationMode: account.derivationMode,
                  path: account.freshAddressPath,
                  verify: true
                })
              )
            ).pipe(ignoreElements())
          )
        )
      )
  },

  send: {
    description: "Send crypto-assets",
    args: [
      ...scanCommonOpts,
      ...inferTransactionsOpts,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: "default | json",
        desc: "how to display the data"
      },
      {
        name: "ignore-errors",
        type: Boolean,
        desc: "when using multiple transactions, an error won't stop the flow"
      }
    ],
    job: (
      opts: ScanCommonOpts &
        InferTransactionsOpts & {
          format: string,
          "ignore-errors": boolean
        }
    ) =>
      scan(opts).pipe(
        concatMap(account =>
          from(inferTransactions(account, opts)).pipe(
            mergeMap(inferred =>
              inferred.reduce(
                (acc, t) =>
                  concat(
                    acc,
                    from(
                      defer(() => {
                        const bridge = getAccountBridge(account);
                        return bridge.signAndBroadcast(account, t, "").pipe(
                          ...(opts["ignore-errors"]
                            ? [
                                catchError(e => {
                                  return of({
                                    type: "error",
                                    error: e,
                                    transaction: t
                                  });
                                })
                              ]
                            : [])
                        );
                      })
                    )
                  ),
                empty()
              )
            ),
            map(obj => (opts.format === "json" ? JSON.stringify(obj) : obj))
          )
        )
      )
  }
};

export default all;
