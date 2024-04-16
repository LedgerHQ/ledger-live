import { useSelector } from "react-redux";
import { LanguageMap } from "~/config/languages";
import { languageSelector } from "~/renderer/reducers/settings";

export const SUPPORT_LANG: LanguageMap = {
  en: "en-us",
  fr: "fr-fr",
  es: "es",
  de: "de",
  ru: "ru",
  zh: "zh-cn",
  tr: "tr",
  pt: "pt-br",
  ja: "ja",
  ko: "ko",
};

export const LEDGER_LANG: LanguageMap = {
  en: "en",
  fr: "fr",
  es: "es",
  de: "de",
  ru: "ru",
  zh: "zh-hans",
  tr: "tr",
  pt: "pt-br",
  ja: "ja",
  ko: "ko",
};

export const SHOP_LANG: LanguageMap = {
  en: "en",
  fr: "fr",
  es: "es",
  de: "de",
  ru: "ru",
  zh: "zh-cn",
  tr: "tr",
  pt: "pt-br",
  ja: "ja",
  ko: "ko",
};

export const LEDGER_SUPPORT = "https://support.ledger.com/hc";
export const LEDGER = "https://www.ledger.com";
export const SHOP = "https://shop.ledger.com";

export const useLocalizedUrl = (url: string) => {
  const language = useSelector(languageSelector);

  // Define the language patterns in the URL
  const languagePatterns: Record<string, string> = {
    [LEDGER_SUPPORT]: `${LEDGER_SUPPORT}/${SUPPORT_LANG[language]}`,
    [LEDGER]: `${LEDGER}/${LEDGER_LANG[language]}`,
    [SHOP]: `${SHOP}/${SHOP_LANG[language]}`,
  };

  const matchingPattern = Object.keys(languagePatterns).find(pattern => url.startsWith(pattern));

  // Check if a matching pattern is found, if not then returns url not transformed
  if (!matchingPattern) {
    return url;
  }

  const transformedUrl = url.replace(matchingPattern, languagePatterns[matchingPattern]);

  return transformedUrl;
};
