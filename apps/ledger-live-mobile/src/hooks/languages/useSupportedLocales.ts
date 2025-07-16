import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useMemo } from "react";
import { LocaleKeys, supportedLocales } from "~/languages";

export const useSupportedLocales = () => {
  const thaiFeature = useFeature("llmThai");

  // When adding a new language, add the feature flag here
  const languagesFeatureFlags: Partial<Record<LocaleKeys, boolean>> = useMemo(
    () => ({
      th: Boolean(thaiFeature?.enabled),
    }),
    [thaiFeature?.enabled],
  );

  const supportedLocalesFiltered = useMemo(
    () =>
      supportedLocales.filter(locale => {
        if (locale in languagesFeatureFlags && !languagesFeatureFlags[locale]) {
          return false;
        }

        return true;
      }),
    [languagesFeatureFlags],
  );

  return supportedLocalesFiltered;
};
