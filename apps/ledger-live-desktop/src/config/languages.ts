import { Language as DeviceLanguages, languageIds } from "@ledgerhq/types-live";

/**
 * This is the only place new language should be added.
 */
export const LanguageIds = ["en", "fr", "de", "ru", "es", "ja", "tr", "ko", "zh", "pt"] as const;

/**
 * This is the only place new locale should be added.
 * @dev The first element is the default locale of the language.
 */
export const LanguageLocaleIds = {
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
} as const satisfies LanguageMap<readonly LanguagePrefixed[]>;

/**
 * This is the Language type.
 */
export type Language = (typeof LanguageIds)[number];

/**
 * This is the Language Locale type.
 */
export type LanguageLocale = (typeof LanguageLocaleIds)[keyof typeof LanguageLocaleIds][number];

/**
 * This is the Locale type.
 */
export type Locale = string;

/**
 * This is the Locales type.
 * @dev It includes a custom `default` field. It refers to the default
 * locale of the language.
 */
export type Locales = readonly Locale[] & { readonly default: Locale };

/**
 * This is the Language definition type.
 */
export type LanguageDefinition = {
  id: Language;

  // Locales
  locales: Locales;

  // Metadata
  label: string;

  // Language device information
  // @dev enforcing `undefined`
  deviceSupport: { label: DeviceLanguages; id: number } | undefined;
};

/**
 * Mapping from languages to their respective infos.
 */
export const Languages = {
  en: {
    id: "en",
    label: "English",
    locales: buildLocales(LanguageLocaleIds.en),

    deviceSupport: { label: "english", id: languageIds.english },
  },
  fr: {
    id: "fr",
    label: "Français",
    locales: buildLocales(LanguageLocaleIds.fr),

    deviceSupport: { label: "french", id: languageIds.french },
  },
  es: {
    id: "es",
    label: "Español",
    locales: buildLocales(LanguageLocaleIds.es),

    deviceSupport: { label: "spanish", id: languageIds.spanish },
  },

  de: {
    id: "de",
    label: "Deutsch",
    locales: buildLocales(LanguageLocaleIds.de),

    deviceSupport: undefined,
  },
  ja: {
    id: "ja",
    label: "日本語",
    locales: buildLocales(LanguageLocaleIds.ja),

    deviceSupport: undefined,
  },
  ko: {
    id: "ko",
    label: "한국어",
    locales: buildLocales(LanguageLocaleIds.ko),

    deviceSupport: undefined,
  },
  pt: {
    id: "pt",
    label: "Português (Brasil)",
    locales: buildLocales(LanguageLocaleIds.pt),

    deviceSupport: undefined,
  },
  ru: {
    id: "ru",
    label: "Русский",
    locales: buildLocales(LanguageLocaleIds.ru),

    deviceSupport: undefined,
  },
  tr: {
    id: "tr",
    label: "Türkçe",
    locales: buildLocales(LanguageLocaleIds.tr),

    deviceSupport: undefined,
  },
  zh: {
    id: "zh",
    label: "简体中文",
    locales: buildLocales(LanguageLocaleIds.zh),

    deviceSupport: undefined,
  },
} as const satisfies LanguageMap<LanguageDefinition>;

/**
 * The default language.
 */
export const DEFAULT_LANGUAGE = Languages.en;

/**
 * List of languages that should be prompted to existing users once if they are
 * using LL in english. It basically reprensents all the Languages minus "en".
 * */
export const pushedLanguages = LanguageIds.filter(e => e !== "en") as Exclude<Language, "en">[];

/**
 * Utils functions
 */
function buildLocales<T extends readonly unknown[]>(src: T): T & { default: T[0] } {
  return Object.assign(src, { default: src[0] });
}

/**
 * Utils types
 */
export type LanguageMap<T = string> = { [key in Language]: T };
export type LanguagePrefixed = `${Language}-${string}`;
