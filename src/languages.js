// @flow
import Locale from "react-native-locale";
import Config from "react-native-config";
import allLocales from "./locales";

export const languages = {
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  es: "Español",
  fi: "suomi",
  fr: "Français",
  hu: "magyar",
  it: "italiano",
  ja: "日本語",
  ko: "한국어",
  nl: "Nederlands",
  no: "Norsk",
  pl: "polski",
  pt: "português",
  ru: "Русский",
  sr: "српски",
  sv: "svenska",
  tr: "Türkçe",
  zh: "简体中文",
};

export const DEFAULT_LANGUAGE_LOCALE = "en";

export const localeIds: string[] = Object.keys(allLocales);
export const pushedLanguages = ["fr", "ru"];
export const supportedLocales = Config.LEDGER_DEBUG_ALL_LANGS
  ? localeIds
  : ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko"];
export const locales = supportedLocales.reduce((obj, key) => {
  obj[key] = allLocales[key]; // eslint-disable-line no-param-reassign
  return obj;
}, {});

export const getDefaultLanguageLocale = (
  fallbackLocale: string = DEFAULT_LANGUAGE_LOCALE,
) => {
  const { localeIdentifier, preferredLanguages } = Locale.constants();
  const locale =
    (preferredLanguages && preferredLanguages[0]) || localeIdentifier;
  const matches = locale.match(/([a-z]{2,4}[-_]([A-Z]{2,4}|[0-9]{3}))/);
  const lang = (matches && matches[1].replace("_", "-")) || "en-US";
  return (
    Object.keys(locales).find(locale => lang.startsWith(locale)) ||
    fallbackLocale
  );
};
