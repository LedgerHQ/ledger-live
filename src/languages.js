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

/**
 * This is the list of languages that are supported in terms of in-app translations
 * and it is meant to appear in the settings.
 */
export const supportedLocales = Config.LEDGER_DEBUG_ALL_LANGS
  ? localeIds
  : ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko"];

/**
 * This is the list of languages that are supported in terms of in-app translations
 * (so it is a subset of `supportedLocales`)
 * AND supported in terms of external resources (i.e. customer support, articles etc.)
 * These languages will be used by default for new users if it's their system language
 * or in the case of existing users, they will be prompted once to change their
 * Ledger Live language.
 */
export const fullySupportedLocales = ["en", "fr", "ru"];

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
    fullySupportedLocales.find(locale => lang.startsWith(locale)) ||
    fallbackLocale
  );
};
