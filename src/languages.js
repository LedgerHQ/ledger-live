// @flow
import Config from "react-native-config";
import allLocales from "./locales";

export const localeIds: string[] = Object.keys(allLocales);
export const supportedLocales = Config.LEDGER_DEBUG_ALL_LANGS
  ? localeIds
  : ["en", "fr", "es", "ru", "zh"];
export const locales = supportedLocales.reduce((obj, key) => {
  obj[key] = allLocales[key]; // eslint-disable-line no-param-reassign
  return obj;
}, {});
