import { useSelector } from "react-redux";
import { DEFAULT_LANGUAGE_LOCALE, LanguageMap } from "~/languages";
import { languageSelector } from "~/reducers/settings";
import { useLocalizedUrl as useLocalizedUrlHook } from "@ledgerhq/live-common/hooks/useLocalizedUrl";

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
  th: "",
  ar: "",
};

export const useLocalizedUrl = (url: string) => {
  const language = useSelector(languageSelector);

  return useLocalizedUrlHook(url, {
    languages,
    defaultLanguage: DEFAULT_LANGUAGE_LOCALE,
    currentLanguage: language,
  });
};
