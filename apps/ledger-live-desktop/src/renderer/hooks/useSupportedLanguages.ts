import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useMemo } from "react";
import { Language, LanguageIds, Languages } from "~/config/languages";

export const useSupportedLanguages = (availableLanguages?: Language[]) => {
  const thaiFeature = useFeature("lldThai");

  // When adding a new language, add the feature flag here
  const languagesFeatureFlags: Partial<Record<Language, boolean>> = useMemo(
    () => ({
      th: Boolean(thaiFeature?.enabled),
    }),
    [thaiFeature?.enabled],
  );

  const locales = useMemo(
    () =>
      (availableLanguages || LanguageIds).filter(locale => {
        if (locale in languagesFeatureFlags && !languagesFeatureFlags[locale]) {
          return false;
        }

        return true;
      }),
    [availableLanguages, languagesFeatureFlags],
  );
  const languages = Object.fromEntries(locales.map(locale => [[locale], Languages[locale]]));

  return {
    locales,
    languages,
  };
};
