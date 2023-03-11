import { getEnv } from "@ledgerhq/live-common/env";
import { Language } from "@ledgerhq/types-live";

export type Locale =
  | "de"
  | "el"
  | "en"
  | "es"
  | "fi"
  | "fr"
  | "hu"
  | "it"
  | "ja"
  | "ko"
  | "nl"
  | "no"
  | "pl"
  | "pt"
  | "ru"
  | "sr"
  | "sv"
  | "tr"
  | "zh";

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

export const allLanguages: Locale[] = [
  "de",
  "el",
  "en",
  "es",
  "fi",
  "fr",
  "hu",
  "it",
  "ja",
  "ko",
  "nl",
  "no",
  "pl",
  "pt",
  "ru",
  "sr",
  "sv",
  "tr",
  "zh",
];

export const prodStableLanguages: Locale[] = [
  "en",
  "fr",
  "es",
  "pt",
  "ru",
  "zh",
  "de",
  "tr",
  "ja",
  "ko",
];

/**
 * List of languages that should be prompted to existing users once if they are
 * using LL in english.
 * */
export const pushedLanguages: Locale[] = ["fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt"];

export const getLanguages = () =>
  getEnv("EXPERIMENTAL_LANGUAGES") ? allLanguages : prodStableLanguages;

export const defaultLocaleForLanguage = {
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
};
