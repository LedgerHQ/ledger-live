import { useMemo } from "react";
import { Language, LanguageIds, Languages } from "~/config/languages";

export const useSupportedLanguages = (availableLanguages?: Language[]) => {
  const locales = useMemo(() => availableLanguages || [...LanguageIds], [availableLanguages]);
  const languages = Object.fromEntries(locales.map(locale => [[locale], Languages[locale]]));

  return {
    locales,
    languages,
  };
};
