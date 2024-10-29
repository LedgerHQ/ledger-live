/* eslint-disable no-console */
import { from } from "rxjs";
import type { ScanCommonOpts } from "../../scan";
import installLanguage from "@ledgerhq/live-common/hw/installLanguage";
import uninstallLanguage from "@ledgerhq/live-common/hw/uninstallLanguage";
import type { Language } from "@ledgerhq/types-live";
import { deviceOpt } from "../../scan";

export type I18nJobOpts = ScanCommonOpts & {
  deviceId: string;
  install: string;
  uninstall: string;
  date_created: string;
  date_last_modified: string;
};

const exec = async (opts: I18nJobOpts) => {
  const { deviceId = "", uninstall = "", install = "" } = opts;
  const language = (uninstall || install) as Language;

  if (install) {
    await new Promise<void>(p =>
      installLanguage({ deviceId, request: { language } }).subscribe(
        x => console.log(x),
        e => {
          console.error(e);
          p();
        },
        () => {
          console.log(`${language} language pack installed.`);
          p();
        },
      ),
    );
  } else if (uninstall) {
    await new Promise<void>(p =>
      uninstallLanguage({ deviceId, language }).subscribe(
        x => console.log(x),
        e => {
          console.error(e);
          p();
        },
        () => {
          console.log(`${language} language pack uninstalled.`);
          p();
        },
      ),
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
  job: (opts: I18nJobOpts): any => from(exec(opts)),
};
