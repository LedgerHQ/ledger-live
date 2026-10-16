import { useMemo } from "react";
import { useTranslation } from "@shared/i18n";
import { CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS } from "../state/constants";

export function useFeatureIntroductionCopy() {
  const { t } = useTranslation();

  return useMemo(() => {
    const highlightCopy = {
      saveAddresses: {
        title: t("contacts.featureIntroduction.highlights.saveAddresses.title"),
        description: t("contacts.featureIntroduction.highlights.saveAddresses.description"),
      },
      sendToRightAddress: {
        title: t("contacts.featureIntroduction.highlights.sendToRightAddress.title"),
        description: t("contacts.featureIntroduction.highlights.sendToRightAddress.description"),
      },
      privateAcrossDevices: {
        title: t("contacts.featureIntroduction.highlights.privateAcrossDevices.title"),
        description: t("contacts.featureIntroduction.highlights.privateAcrossDevices.description"),
      },
    };

    return {
      title: t("contacts.featureIntroduction.title"),
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      highlights: CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
        icon,
        ...highlightCopy[translationKey],
      })),
    };
  }, [t]);
}
