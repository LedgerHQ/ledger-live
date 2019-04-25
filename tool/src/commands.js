// @flow
/* eslint-disable global-require */

import { from, of, concat, empty, Observable } from "rxjs";
import { map, mergeMap, ignoreElements, concatMap } from "rxjs/operators";
import qrcode from "qrcode-terminal";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import signAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { getFeesForTransaction } from "@ledgerhq/live-common/lib/libcore/getFeesForTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import manager from "@ledgerhq/live-common/lib/manager";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getVersion from "@ledgerhq/live-common/lib/hw/getVersion";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import getAppAndVersion from "@ledgerhq/live-common/lib/hw/getAppAndVersion";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import prepareFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-prepare";
import mainFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-main";
import repairFirmwareUpdate from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";
import accountFormatters from "./accountFormatters";
import {
  scan,
  scanCommonOpts,
  currencyOpt,
  deviceOpt,
  inferCurrency
} from "./scan";
import { inferTransaction, inferTransactionOpts } from "./transaction";
import getAddress from "../../lib/hw/getAddress";
import { apdusFromFile } from "./stream";

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
    job: ({ password }) =>
      withLibcore(core =>
        core
          .getPoolInstance()
          .changePassword(getEnv("LIBCORE_PASSWORD"), password || "")
      )
  },

  deviceVersion: {
    args: [deviceOpt],
    job: ({ device }) => withDevice(device || "")(t => from(getVersion(t)))
  },

  deviceAppVersion: {
    args: [deviceOpt],
    job: ({ device }) =>
      withDevice(device || "")(t => from(getAppAndVersion(t)))
  },

  deviceInfo: {
    args: [deviceOpt],
    job: ({ device }) => withDevice(device || "")(t => from(getDeviceInfo(t)))
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
    job: ({ device, file }) =>
      withDevice(device || "")(t =>
        apdusFromFile(file || "-").pipe(concatMap(apdu => t.exchange(apdu)))
      ).pipe(map(res => res.toString("hex")))
  },

  genuineCheck: {
    description: "Perform a genuine check with Ledger's HSM",
    args: [deviceOpt],
    job: ({ device }) =>
      withDevice(device || "")(t =>
        from(getDeviceInfo(t)).pipe(
          mergeMap(deviceInfo => genuineCheck(t, deviceInfo))
        )
      )
  },

  firmwareUpdate: {
    description: "Perform a firmware update",
    args: [deviceOpt],
    job: ({ device }) =>
      withDevice(device || "")(t => from(getDeviceInfo(t))).pipe(
        mergeMap(manager.getLatestFirmwareForDevice),
        mergeMap(firmware => {
          if (!firmware) return of("already up to date");
          return concat(
            of(
              `firmware: ${firmware.final.name}\nOSU: ${
                firmware.osu.name
              } (hash: ${firmware.osu.hash})`
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
    job: ({ device, forceMCU }) => repairFirmwareUpdate(device || "", forceMCU)
  },

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
    job: ({ device, format }) =>
      withDevice(device || "")(t =>
        from(getDeviceInfo(t)).pipe(
          mergeMap(deviceInfo => from(manager.getAppsList(deviceInfo, true))),
          map(list =>
            format === "raw"
              ? list
              : format === "json"
              ? JSON.stringify(list)
              : list.map(item => `- ${item.name} ${item.version}`).join("\n")
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
        desc: "install an application by its name"
      },
      {
        name: "uninstall",
        alias: "u",
        type: String,
        desc: "uninstall an application by its name"
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
    job: ({ device, verbose, install, uninstall, open, quit }) =>
      withDevice(device || "")(t =>
        quit
          ? from(quitApp(t))
          : open
          ? from(openApp(t, open))
          : from(getDeviceInfo(t)).pipe(
              mergeMap(deviceInfo =>
                from(manager.getAppsList(deviceInfo, true)).pipe(
                  mergeMap(list => {
                    const cmd = uninstall ? uninstallApp : installApp;
                    const { targetId } = deviceInfo;
                    const application = install || uninstall;
                    if (!application) {
                      throw new Error("--install or --uninstall required");
                    }
                    const app = list.find(
                      item =>
                        item.name.toLowerCase() === application.toLowerCase()
                    );
                    if (!app) {
                      throw new Error(
                        "application '" + application + "' not found"
                      );
                    }
                    return cmd(t, targetId, app);
                  })
                )
              ),
              verbose ? map(a => a) : ignoreElements()
            )
      )
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
    job: arg =>
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

  getAddress: {
    description:
      "Get an address with the device on specific derivations (advanced)",
    args: [
      currencyOpt,
      { name: "path", type: String, desc: "HDD derivation path" },
      { name: "derivationMode", type: String, desc: "derivationMode to use" },
      {
        name: "verify",
        alias: "v",
        type: Boolean,
        desc: "also ask verification on device"
      }
    ],
    job: arg =>
      inferCurrency(arg).pipe(
        mergeMap(currency => {
          if (!currency) {
            throw new Error("no currency provided");
          }
          if (!arg.path) {
            throw new Error("--path is required");
          }
          if (!arg.derivationMode) {
            throw new Error("--derivationMode is required");
          }
          return withDevice(arg.device || "")(t =>
            from(
              getAddress(t, {
                ...arg,
                currency
              })
            )
          );
        })
      )
  },

  feesForTransaction: {
    description: "Calculate how much fees a given transaction is going to cost",
    args: [...scanCommonOpts, ...inferTransactionOpts],
    job: opts =>
      scan(opts).pipe(
        concatMap((account: Account) =>
          from(
            inferTransaction(account, opts).then(inferred =>
              getFeesForTransaction({
                ...inferred,
                account
              })
            )
          ).pipe(
            map(n =>
              formatCurrencyUnit(account.unit, n, {
                showCode: true,
                disableRounding: true
              })
            )
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
    job: opts =>
      scan(opts).pipe(
        map(account =>
          (accountFormatters[opts.format] || accountFormatters.default)(account)
        )
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
    job: opts =>
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
      ...inferTransactionOpts,
      {
        name: "format",
        alias: "f",
        type: String,
        typeDesc: "default | json",
        desc: "how to display the data"
      }
    ],
    job: opts =>
      scan(opts).pipe(
        concatMap((account: Account) =>
          from(inferTransaction(account, opts)).pipe(
            mergeMap(inferred =>
              signAndBroadcast({
                ...inferred,
                account,
                deviceId: ""
              })
            ),
            map(obj => (opts.format === "json" ? JSON.stringify(obj) : obj))
          )
        )
      )
  }
};

export default all;
