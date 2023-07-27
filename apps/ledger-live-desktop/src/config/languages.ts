import { Language } from "@ledgerhq/types-live";

// This is the only place where new language should be added
export const Languages = [
  //
  "en",
  "fr",
  "de",
  "ru",
  "es",
  "ja",
  "tr",
  "ko",
  "zh",
  "pt",
] as const;

export type Locale = (typeof Languages)[number];

/**
 * This maps the supported locales from live to their equivalent languages on the device.
 * It is to be used for suggesting the user to change their device language according to their Live
 * language.
 */
export const localeIdToDeviceLanguage: { [key in Locale]?: Language } = {
  en: "english",
  fr: "french",
  es: "spanish",
};

/**
 * List of languages that should be prompted to existing users once if they are
 * using LL in english.
 * */
export const pushedLanguages: Locale[] = ["fr", "es", "ru", "zh", "de", "tr", "ja", "ko", "pt"];

export const getLanguages = () => Languages;

export const defaultLocaleForLanguage: { [key in Locale]: string } = {
  de: "de-DE",
  en: "en-US",
  es: "es-ES",
  fr: "fr-FR",
  ja: "ja-JP",
  ko: "ko-KR",
  pt: "pt-BR",
  ru: "ru-RU",
  tr: "tr-TR",
  zh: "zh-CN",
  // sv: "sv-SV",
  // sr: "sr-SR",
  // pl: "pl-PL",
  // no: "no-NO",
  // nl: "nl-NL",
  // it: "it-IT",
  // hu: "hu-HU",
  // el: "el-GR",
  // fi: "fi-FI",
};
