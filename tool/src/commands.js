// @flow

import { from, of, concat } from "rxjs";
import {
  map,
  mergeMap,
  ignoreElements,
  switchMap,
  concatMap
} from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import signAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { getFeesForTransaction } from "@ledgerhq/live-common/lib/libcore/getFeesForTransaction";
import { formatCurrencyUnit } from "@ledgerhq/live-common/lib/currencies";
import manager from "@ledgerhq/live-common/lib/manager";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import genuineCheck from "@ledgerhq/live-common/lib/hw/genuineCheck";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
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

const all = {
  libcoreVersion: {
    args: [],
    job: () =>
      withLibcore(async core => {
        const stringVersion = await core.LedgerCore.getStringVersion();
        const intVersion = await core.LedgerCore.getIntVersion();
        return { stringVersion, intVersion };
      })
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

  send: {
    description: "Send cryptoassets",
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
        mergeMap((account: Account) =>
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
  },

  receive: {
    description:
      "Display receive address for each individual accounts and verify on device",
    args: [...scanCommonOpts],
    job: opts =>
      scan(opts).pipe(
        concatMap(account =>
          concat(
            of(account.freshAddress),
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

  feesForTransaction: {
    description: "Calculate how much fees a given transaction is going to cost",
    args: [...scanCommonOpts, ...inferTransactionOpts],
    job: opts =>
      scan(opts).pipe(
        switchMap((account: Account) =>
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
          mergeMap(deviceInfo => from(manager.getAppsList(deviceInfo))),
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
                from(manager.getAppsList(deviceInfo)).pipe(
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
  }
};

export default all;
