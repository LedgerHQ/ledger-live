import { Language } from "@ledgerhq/types-live";

/**
 * This is the only place where new language should be added.
 */
export const Languages = ["en", "fr", "de", "ru", "es", "ja", "tr", "ko", "zh", "pt"] as const;

/**
 * This is the Locale type used accross the app.
 */
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
 * using LL in english. It reprensents all the Languages minus "en".
 * */
export const pushedLanguages = Languages.filter(e => e !== "en");

/**
 * This variable maps each language to its default Locale.
 */
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
};
