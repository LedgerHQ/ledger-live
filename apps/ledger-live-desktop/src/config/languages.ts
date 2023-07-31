import { Language as DeviceLanguages, languageIds } from "@ledgerhq/types-live";

/**
 * This is the only place new language should be added.
 */
export const LanguageIds = ["en", "fr", "de", "ru", "es", "ja", "tr", "ko", "zh", "pt"] as const;

/**
 * This is the only place new locale should be added.
 */
export const LocaleIds = {
  en: ["en-US"],
  fr: ["fr-FR"],
  es: ["es-ES"],
  de: ["de-DE"],
  ja: ["ja-JP"],
  ko: ["ko-KR"],
  pt: ["pt-BR"],
  ru: ["ru-RU"],
  tr: ["tr-TR"],
  zh: ["zh-CN"],
} as const satisfies LocaleMap<readonly LanguagePrefixed[]>;

/**
 * This is the Language type.
 */
export type Language = (typeof LanguageIds)[number];

/**
 * This is the Locale type.
 */
export type Locale = (typeof LocaleIds)[keyof typeof LocaleIds][number];

/**
 * This is the Language definition type.
 */
export type LanguageDefinition = {
  id: Language;
  label: string;

  locales: readonly Locale[] & { readonly default: Locale };

  deviceSupport?: { label: DeviceLanguages; id: number };
};

/**
 * Mapping from languages to their respective infos.
 */
export const Languages = {
  en: {
    id: "en",
    label: "English",
    locales: addDefault(LocaleIds.en),

    deviceSupport: { label: "english", id: languageIds.english },
  },
  fr: {
    id: "fr",
    label: "Français",
    locales: addDefault(LocaleIds.fr),

    deviceSupport: { label: "french", id: languageIds.french },
  },
  es: {
    id: "es",
    label: "Español",
    locales: addDefault(LocaleIds.es),

    deviceSupport: { label: "spanish", id: languageIds.spanish },
  },

  de: {
    id: "de",
    label: "Deutsch",
    locales: addDefault(LocaleIds.de),
    deviceSupport: undefined,
  },
  ja: {
    id: "ja",
    label: "日本語",
    locales: addDefault(LocaleIds.ja),
    deviceSupport: undefined,
  },
  ko: {
    id: "ko",
    label: "한국어",
    locales: addDefault(LocaleIds.ko),
    deviceSupport: undefined,
  },
  pt: {
    id: "pt",
    label: "Português (Brasil)",
    locales: addDefault(LocaleIds.pt),
    deviceSupport: undefined,
  },
  ru: {
    id: "ru",
    label: "Русский",
    locales: addDefault(LocaleIds.ru),
    deviceSupport: undefined,
  },
  tr: {
    id: "tr",
    label: "Türkçe",
    locales: addDefault(LocaleIds.tr),
    deviceSupport: undefined,
  },
  zh: {
    id: "zh",
    label: "简体中文",
    locales: addDefault(LocaleIds.zh),
    deviceSupport: undefined,
  },
} as const satisfies LocaleMap<LanguageDefinition>;

/**
 * The default language.
 */
export const DEFAULT_LANGUAGE = Languages.en;

/**
 * List of languages that should be prompted to existing users once if they are
 * using LL in english. It basically reprensents all the Languages minus "en".
 * */
export const pushedLanguages = LanguageIds.filter(e => e !== "en");

/**
 * Utils functions
 */
function addDefault<T extends readonly unknown[]>(src: T): T & { default: T[0] } {
  return Object.assign(src, { default: src[0] });
}

/**
 * Utils types
 */
type LanguagePrefixed = `${Language}-${string}`;
type LocaleMap<T = string> = { [key in Language]: T };
