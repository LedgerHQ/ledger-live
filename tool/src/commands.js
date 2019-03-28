// @flow

import { from } from "rxjs";
import { map, mergeMap, ignoreElements, switchMap } from "rxjs/operators";
import { getEnv } from "@ledgerhq/live-common/lib/env";
import { isValidRecipient } from "@ledgerhq/live-common/lib/libcore/isValidRecipient";
import signAndBroadcast from "@ledgerhq/live-common/lib/libcore/signAndBroadcast";
import { getFeesForTransaction } from "@ledgerhq/live-common/lib/libcore/getFeesForTransaction";
import {
  getCryptoCurrencyById,
  formatCurrencyUnit
} from "@ledgerhq/live-common/lib/currencies";
import manager from "@ledgerhq/live-common/lib/manager";
import { withLibcore } from "@ledgerhq/live-common/lib/libcore/access";
import { withDevice } from "@ledgerhq/live-common/lib/hw/deviceAccess";
import getDeviceInfo from "@ledgerhq/live-common/lib/hw/getDeviceInfo";
import openApp from "@ledgerhq/live-common/lib/hw/openApp";
import quitApp from "@ledgerhq/live-common/lib/hw/quitApp";
import installApp from "@ledgerhq/live-common/lib/hw/installApp";
import uninstallApp from "@ledgerhq/live-common/lib/hw/uninstallApp";
import accountFormatters from "./accountFormatters";
import { scan, scanCommonOpts, currencyOpt, deviceOpt } from "./scan";
import { inferTransaction, inferTransactionOpts } from "./transaction";

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
    args: [
      {
        name: "recipient",
        alias: "r",
        type: String,
        desc: "the address to validate"
      },
      currencyOpt
    ],
    job: ({ currency, recipient }) =>
      isValidRecipient({
        currency: getCryptoCurrencyById(currency || "bitcoin"),
        recipient
      }).then(
        warning =>
          warning ? { type: "warning", warning } : { type: "success" },
        error => ({ type: "error", error: error.message })
      )
  },

  sync: {
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
    args: [...scanCommonOpts],
    job: opts => scan(opts).pipe(map(account => account.freshAddress))
  },

  feesForTransaction: {
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

  listApps: {
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

  app: {
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
