import RNLocalize from "react-native-localize";
import Config from "react-native-config";
import { Language } from "@ledgerhq/types-live";
import type { ResourceLanguage } from "i18next";
import * as allLocales from "./locales";

export const languages = {
  de: "Deutsch",
  el: "Ελληνικά",
  en: "English",
  es: "Español",
  fi: "Suomi",
  fr: "Français",
  hu: "Magyar",
  it: "Italiano",
  ja: "日本語",
  ko: "한국어",
  nl: "Nederlands",
  no: "Norsk",
  pl: "Polski",
  pt: "Português (Brasil)",
  ru: "Русский",
  sr: "Cрпски",
  sv: "Svenska",
  tr: "Türkçe",
  zh: "简体中文",
  ar: "العربية",
};

type localeKeys = keyof typeof allLocales;
export const localeIds = Object.keys(allLocales) as localeKeys[];

/**
 * This is the list of languages that are supported in terms of in-app translations
 * and it is meant to appear in the settings.
 */
export const supportedLocales: localeKeys[] = Config.LEDGER_DEBUG_ALL_LANGS
  ? localeIds
  : ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt", "ar"];

export type Locale = keyof typeof languages;

/**
 * This maps the supported locales from live to theiur equivalent languages on the device.
 * It is to be used for suggesting the user to change their device language according to their Live
 * language.
 */
export const localeIdToDeviceLanguage: { [key in Locale]?: Language } = {
  en: "english",
  fr: "french",
  es: "spanish",
};

/**
 * This is the list of languages that are supported in terms of in-app translations
 * (so it is a subset of `supportedLocales`)
 * AND supported in terms of external resources (i.e. customer support, articles etc.)
 * These languages will be used by default for new users if it's their system language
 * or in the case of existing users, they will be prompted once to change their
 * Ledger Live language.
 */

export const fullySupportedLocales: Locale[] = [
  "en",
  "fr",
  "es",
  "ru",
  "zh",
  "de",
  "tr",
  "ja",
  "ko",
  "pt",
  "ar",
];
export const locales = supportedLocales.reduce((obj, key) => {
  obj[key] = allLocales[key]; // eslint-disable-line no-param-reassign
  return obj;
}, {} as { [k in localeKeys]: ResourceLanguage });

/** For the "language" setting which is used for translations. */
export const DEFAULT_LANGUAGE_LOCALE = "en";
/** This allows us to have the language set by default to the system language
 * if & only if that language is supported.
 */
export const getDefaultLanguageLocale = (
  fallbackLocale: string = DEFAULT_LANGUAGE_LOCALE,
) =>
  RNLocalize.findBestAvailableLanguage(fullySupportedLocales)?.languageTag ||
  fallbackLocale;
const languageLocaleToDefaultLocaleMap: {
  [k: string]: string;
} = {
  de: "de-DE",
  el: "el-GR",
  en: "en-US",
  es: "es-ES",
  fi: "fi-FI",
  fr: "fr-FR",
  hu: "hu-HU",
  it: "it-IT",
  ja: "ja-JP",
  ko: "ko-KR",
  nl: "nl-NL",
  no: "no-NO",
  pl: "pl-PL",
  pt: "pt-BR",
  ru: "ru-RU",
  sr: "sr-SR",
  sv: "sv-SV",
  tr: "tr-TR",
  zh: "zh-CN",
  ar: "ar-EG",
};

/** For the "region" setting which is used for dates & numbers formatting. */
export const DEFAULT_LOCALE = "en-US";
/** This allows us to have the region set by default to the region corresponding
 * to the system language if & only if that language is supported. */
export const getDefaultLocale = () => {
  const defaultLanguageLocale = getDefaultLanguageLocale() as Locale;
  return (
    languageLocaleToDefaultLocaleMap[defaultLanguageLocale] || DEFAULT_LOCALE
  );
};
