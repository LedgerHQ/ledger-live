import type { LocalizationConfig } from "./types";

export const LEDGER_URL_LANGUAGES: Record<string, string> = {
  en: "",
  fr: "fr",
  es: "es",
  de: "de",
  ru: "ru",
  zh: "zh-hans",
  tr: "tr",
  pt: "pt-br",
  ja: "ja",
  ko: "ko",
  th: "th",
};

export const DEFAULT_LANGUAGE = "en";

const BASE_LEDGER_SUPPORT = "https://support.ledger.com";
const LEDGER = "https://www.ledger.com";
const SHOP = "https://shop.ledger.com";
const SALESFORCE_SUPPORT = `${BASE_LEDGER_SUPPORT}/article`;

function buildLocalizedBase(
  baseUrl: string,
  langMap: Record<string, string>,
  currentLanguage: string,
  defaultLanguage: string,
  suffix = "",
): string {
  const languagePart = currentLanguage === defaultLanguage ? "" : langMap[currentLanguage] || "";
  const suffixPart = suffix ? `/${suffix}` : "";
  const langSegment = languagePart ? `/${languagePart}` : "";
  return `${baseUrl}${langSegment}${suffixPart}`;
}

export function localizeUrl(url: string, config: LocalizationConfig): string {
  const { currentLanguage, defaultLanguage, languages } = config;

  const salesforceLang: Record<string, string> = { ...languages, zh: "zh-cn" };

  const patterns: Record<string, string> = {
    [LEDGER]: buildLocalizedBase(LEDGER, languages, currentLanguage, defaultLanguage),
    [SHOP]: buildLocalizedBase(SHOP, languages, currentLanguage, defaultLanguage),
    [BASE_LEDGER_SUPPORT]: buildLocalizedBase(
      BASE_LEDGER_SUPPORT,
      salesforceLang,
      currentLanguage,
      defaultLanguage,
    ),
    [SALESFORCE_SUPPORT]: buildLocalizedBase(
      BASE_LEDGER_SUPPORT,
      salesforceLang,
      currentLanguage,
      defaultLanguage,
      "article",
    ),
  };

  const matchingPattern = Object.keys(patterns).find(
    p =>
      url.startsWith(p) &&
      (url.length === p.length || url[p.length] === "/" || url[p.length] === "?"),
  );
  if (!matchingPattern) return url;

  return url.replace(matchingPattern, patterns[matchingPattern]);
}
