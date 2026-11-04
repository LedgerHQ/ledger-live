import { useSelector } from "LLD/hooks/redux";
import { DEFAULT_LANGUAGE, LanguageMap } from "~/config/languages";
import { languageSelector } from "~/renderer/reducers/settings";
import { useCallback } from "react";
import {
  getLocalizedLedgerUrl,
  useLocalizedUrl as useLocalizedUrlHook,
} from "@ledgerhq/live-common/hooks/useLocalizedUrl";

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
};

export const useLocalizedUrl = (url: string) => {
  const language = useSelector(languageSelector);

  return useLocalizedUrlHook(url, {
    languages,
    defaultLanguage: DEFAULT_LANGUAGE.id,
    currentLanguage: language,
  });
};

export const useUrlLocalizer = () => {
  const language = useSelector(languageSelector);

  return useCallback(
    (url: string) =>
      getLocalizedLedgerUrl(url, {
        languages,
        defaultLanguage: DEFAULT_LANGUAGE.id,
        currentLanguage: language,
      }),
    [language],
  );
};
