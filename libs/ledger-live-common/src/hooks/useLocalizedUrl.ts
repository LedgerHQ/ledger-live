type Config = {
  currentLanguage: string;
  defaultLanguage: string;
  languages: Record<string, string>;
};

export const BASE_LEDGER_SUPPORT = "https://support.ledger.com";
export const LEDGER = "https://www.ledger.com";
export const SHOP = "https://shop.ledger.com";
export const SALESFORCE_SUPPORT = `${BASE_LEDGER_SUPPORT}/article`;

/**
 * Constructs a localized URL based on the provided base URL, language, default language, and optional suffix.
 * If the language is the default language, the language part is omitted from the URL.
 *
 * @param {string} baseUrl - The base URL (e.g., "https://www.ledger.com").
 * @param {LanguageMap} langMap - A mapping of language codes to their respective language identifiers (e.g., { en: "en", fr: "fr", ... }).
 * @param {keyof LanguageMap} lang - The selected language code (e.g., "en", "fr").
 * @param {string} DEFAULT_LANGUAGE - The default language configuration(e.g., "en").
 * @param {string} [suffix=""] - An optional suffix to append to the URL (e.g., "article/123").
 *
 * @returns {string} - The localized URL, including the language part (if applicable) and any suffix.
 */
export const getLocalizedUrl = (
  baseUrl: string,
  langMap: Record<string, string>,
  lang: string,
  defaultLanguage: string,
  suffix = "",
) => {
  // Determine the language part based on the selected language. If the language is the default,
  // we don't include it in the URL. If the language isn't in the langMap, fallback to an empty string.
  const languagePart = lang === defaultLanguage ? "" : langMap[lang] || "";

  // If a suffix is provided, prepend it with a "/" for proper URL formatting.
  const suffixPart = suffix ? `/${suffix}` : "";

  // Return the final URL by concatenating the base URL, language part (if any), and the suffix (if any).
  return `${baseUrl}${languagePart && `/${languagePart}`}${suffixPart}`;
};

export const useLocalizedUrl = (
  url: string,
  { languages, defaultLanguage, currentLanguage }: Config,
) => {
  const LEDGER_LANG = { ...languages };
  const SHOP_LANG = { ...languages };
  const SALESFORCE_LANG = {
    ...languages,
    zh: "zh-cn",
  };

  // Define the language patterns in the URL, using the helper function
  const languagePatterns: Record<string, string> = {
    [LEDGER]: getLocalizedUrl(LEDGER, LEDGER_LANG, currentLanguage, defaultLanguage),
    [SHOP]: getLocalizedUrl(SHOP, SHOP_LANG, currentLanguage, defaultLanguage),
    [BASE_LEDGER_SUPPORT]: getLocalizedUrl(
      BASE_LEDGER_SUPPORT,
      SALESFORCE_LANG,
      currentLanguage,
      defaultLanguage,
    ),
    [SALESFORCE_SUPPORT]: getLocalizedUrl(
      BASE_LEDGER_SUPPORT,
      SALESFORCE_LANG,
      currentLanguage,
      defaultLanguage,
      "article",
    ),
  };

  const matchingPattern = Object.keys(languagePatterns).find(pattern => url.startsWith(pattern));

  // If no matching pattern, return the original URL
  if (!matchingPattern) {
    return url;
  }

  // Replace the matching part with the corresponding localized URL
  const transformedUrl = url.replace(matchingPattern, languagePatterns[matchingPattern]);

  return transformedUrl;
};
