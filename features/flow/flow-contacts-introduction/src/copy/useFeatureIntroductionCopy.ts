import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS } from "../state/constants";

export function useFeatureIntroductionCopy() {
  const { t } = useTranslation();

  return useMemo(
    () => ({
      title: t("contacts.featureIntroduction.title"),
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      highlights: CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
        icon,
        title: t(`contacts.featureIntroduction.highlights.${translationKey}.title`),
        description: t(`contacts.featureIntroduction.highlights.${translationKey}.description`),
      })),
    }),
    [t],
  );
}
