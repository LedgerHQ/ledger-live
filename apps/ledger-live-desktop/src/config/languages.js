// @flow
import { getEnv } from "@ledgerhq/live-common/env";

export const allLanguages = [
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

export const prodStableLanguages = ["en", "fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt"];

/**
 * List of languages that should be prompted to existing users once if they are
 * using LL in english.
 * */
export const pushedLanguages = ["fr", "ru", "es", "zh", "pt"];

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
