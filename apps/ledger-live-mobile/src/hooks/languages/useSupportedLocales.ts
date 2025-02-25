import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useMemo } from "react";
import { supportedLocales } from "~/languages";

export const useSupportedLocales = () => {
  const thaiFeature = useFeature("llmThai");

  const supportedLocalesFiltered = useMemo(
    () =>
      supportedLocales.filter(locale => {
        if (locale === "th" && !thaiFeature?.enabled) {
          return false;
        }

        return true;
      }),
    [thaiFeature?.enabled],
  );

  return supportedLocalesFiltered;
};
