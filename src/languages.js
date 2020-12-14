// @flow
import allLocales from "./locales";

export const localeIds: string[] = Object.keys(allLocales);
export const locales = localeIds.reduce((obj, key) => {
  obj[key] = allLocales[key]; // eslint-disable-line no-param-reassign
  return obj;
}, {});
