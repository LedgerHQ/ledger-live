import { useSelector } from "~/context/hooks";
import { DEFAULT_LANGUAGE_LOCALE, LanguageMap } from "~/languages";
import { languageSelector } from "~/reducers/settings";
import { useCallback } from "react";
import { getLocalizedLedgerUrl } from "@ledgerhq/live-common/hooks/useLocalizedUrl";

const languages: LanguageMap = {
  en: "", // Default language so "" => fallback to the base URL
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
  ar: "",
};

export const useUrlLocalizer = () => {
  const language = useSelector(languageSelector);

  return useCallback(
    (url: string) =>
      getLocalizedLedgerUrl(url, {
        languages,
        defaultLanguage: DEFAULT_LANGUAGE_LOCALE,
        currentLanguage: language,
      }),
    [language],
  );
};

export const useLocalizedUrl = (url: string) => useUrlLocalizer()(url);
