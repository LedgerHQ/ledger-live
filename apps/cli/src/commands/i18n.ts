/* eslint-disable no-console */
import { from } from "rxjs";
import type { ScanCommonOpts } from "../scan";
import installLanguage from "@ledgerhq/live-common/lib/hw/installLanguage";
import uninstallLanguage from "@ledgerhq/live-common/lib/hw/uninstallLanguage";
import type { Language } from "@ledgerhq/live-common/lib/types/languages";
import { deviceOpt } from "../scan";

type i18nJobOps = ScanCommonOpts & {
  deviceId: string;
  install: string;
  uninstall: string;
  date_created: string;
  date_last_modified: string;
};


const exec = async (opts: i18nJobOps) => {
  const { deviceId = "", uninstall = "", install = "" } = opts;
  const language = (uninstall || install) as Language;

  if (install) {
    await new Promise<void>((p) =>
      installLanguage({ deviceId, language}).subscribe(
        (x) => console.log(x),
        (e) => {
          console.error(e);
          p();
        },
        () => {
          console.log(`${language} language pack installed.`);
          p();
        }
      )
    );
  } else if (uninstall) {
    await new Promise<void>((p) =>
      uninstallLanguage({ deviceId, language}).subscribe(
        (x) => console.log(x),
        (e) => {
          console.error(e);
          p();
        },
        () => {
          console.log(`${language} language pack uninstalled.`);
          p();
        }
      )
    );
  }
};

export default {
  description: "Test e2e functionality for device localization support",
  args: [
    deviceOpt,
    {
      name: "install",
      alias: "i",
      type: String,
      desc: "install a language pack by its id",
    },
    {
      name: "uninstall",
      alias: "u",
      type: String,
      desc: "uninstall a language pack by its id",
    },
  ],
  job: (opts: i18nJobOps): any => from(exec(opts)),
};
