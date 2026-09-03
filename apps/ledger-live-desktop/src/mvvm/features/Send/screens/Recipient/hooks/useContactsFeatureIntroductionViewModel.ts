import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  useContactsFeatureIntroductionState,
  type ContactsFeatureIntroduction,
} from "@features/flow-contacts-introduction";
import { useContactsFeatureIntroductionPreference } from "LLD/features/Contacts/hooks/useContactsFeatureIntroductionPreference";

type UseContactsFeatureIntroductionViewModelInput = Readonly<{
  isContactsEntryAvailable: boolean;
  /** Defaults to dismissing, otherwise the introduction reopens right away. */
  onClose?: () => void;
}>;

export function useContactsFeatureIntroductionViewModel({
  isContactsEntryAvailable,
  onClose,
}: UseContactsFeatureIntroductionViewModelInput): ContactsFeatureIntroduction {
  const { t } = useTranslation();
  const preference = useContactsFeatureIntroductionPreference();
  const { isRequested, dismiss } = useContactsFeatureIntroductionState({
    isContactsEntryAvailable,
    preference,
  });
  const highlights = useMemo(
    () =>
      CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
        icon,
        title: t(`contacts.featureIntroduction.highlights.${translationKey}.title`),
        description: t(`contacts.featureIntroduction.highlights.${translationKey}.description`),
      })),
    [t],
  );

  return useMemo(
    () => ({
      isOpen: isRequested,
      title: t("contacts.featureIntroduction.title"),
      highlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      onComplete: dismiss,
      onClose: onClose ?? dismiss,
    }),
    [dismiss, highlights, isRequested, onClose, t],
  );
}
