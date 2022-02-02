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

export const localeIds: string[] = Object.keys(allLocales);
export const pushedLanguages = ["fr", "ru"];
export const supportedLocales = Config.LEDGER_DEBUG_ALL_LANGS
  ? localeIds
  : ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko"];
export const locales = supportedLocales.reduce((obj, key) => {
  obj[key] = allLocales[key]; // eslint-disable-line no-param-reassign
  return obj;
}, {});

/** For the "language" setting which is used for translations. */
export const DEFAULT_LANGUAGE_LOCALE = "en";
/** This allows us to have the language set by default to the system language
 * if & only if that language is supported.
 */
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

const languageLocaleToDefaultLocaleMap = {
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
  pt: "pt-PT",
  ru: "ru-RU",
  sr: "sr-SR",
  sv: "sv-SV",
  tr: "tr-TR",
  zh: "zh-CN",
};

/** For the "region" setting which is used for dates & numbers formatting. */
export const DEFAULT_LOCALE = "en-US";
/** This allows us to have the region set by default to the region corresponding
 * to the system language if & only if that language is supported. */
export const getDefaultLocale = () => {
  const defaultLanguageLocale = getDefaultLanguageLocale();
  return (
    languageLocaleToDefaultLocaleMap[defaultLanguageLocale] || DEFAULT_LOCALE
  );
};
