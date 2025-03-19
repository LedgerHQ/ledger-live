import { useSelector } from "react-redux";
import { DEFAULT_LANGUAGE, LanguageMap } from "~/config/languages";
import { languageSelector } from "~/renderer/reducers/settings";
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
};

export const useLocalizedUrl = (url: string) => {
  const language = useSelector(languageSelector);

  return useLocalizedUrlHook(url, {
    languages,
    defaultLanguage: DEFAULT_LANGUAGE.id,
    currentLanguage: language,
  });
};
