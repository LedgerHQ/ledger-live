import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
  resolveContactsLedgerSyncIntroductionOpen,
  useContactsFeatureIntroductionState,
  useContactsSearchViewModel,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";
import { useContactsFeatureIntroductionPreference } from "../../../hooks/useContactsFeatureIntroductionPreference";
import type { ContactsPageViewModel } from "../types";

export function useContactsPageViewModel(): ContactsPageViewModel {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      ledgerSyncCheckingAccessibilityLabel: t(
        "contacts.ledgerSyncIntroduction.checkingAccessibilityLabel",
      ),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const preference = useContactsFeatureIntroductionPreference();
  const featureIntroductionState = useContactsFeatureIntroductionState({
    isContactsEntryAvailable: true,
    preference,
  });
  const featureIntroductionHighlights = useMemo(
    () =>
      CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS.map(({ icon, translationKey }) => ({
        icon,
        title: t(`contacts.featureIntroduction.highlights.${translationKey}.title`),
        description: t(`contacts.featureIntroduction.highlights.${translationKey}.description`),
      })),
    [t],
  );
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const [isLedgerSyncIntroductionDismissed, setIsLedgerSyncIntroductionDismissed] =
    useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const viewModel = useContactsSearchViewModel(searchQuery);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback(() => undefined, []);
  const onDismissLedgerSyncIntroduction = useCallback(
    () => setIsLedgerSyncIntroductionDismissed(true),
    [],
  );
  const onActivateIntroduction = useCallback(() => undefined, []);
  const onCompleteFeatureIntroduction = useCallback(() => {
    featureIntroductionState.dismiss();
  }, [featureIntroductionState]);
  const onDeferFeatureIntroduction = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (ledgerSyncStatus !== "inactive") {
      setIsLedgerSyncIntroductionDismissed(false);
    }
  }, [ledgerSyncStatus]);

  const isLedgerSyncIntroductionOpen = resolveContactsLedgerSyncIntroductionOpen({
    isFeatureIntroductionRequested: featureIntroductionState.isRequested,
    ledgerSyncStatus,
    isLedgerSyncIntroductionDismissed,
  });

  return {
    viewModel,
    labels,
    searchQuery,
    onSearchQueryChange,
    meAvatarSrc: USER_AVATAR_URL,
    onOpenContact,
    ledgerSyncStatus,
    featureIntroduction: {
      isOpen: featureIntroductionState.isRequested,
      title: t("contacts.featureIntroduction.title"),
      description: t("contacts.featureIntroduction.description"),
      highlights: featureIntroductionHighlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      secondaryActionLabel: t("contacts.featureIntroduction.secondaryAction"),
      onComplete: onCompleteFeatureIntroduction,
      onDefer: onDeferFeatureIntroduction,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissLedgerSyncIntroduction,
    },
    ledgerSyncIntroductionContent: {
      title: t("contacts.ledgerSyncIntroduction.title"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      onActivate: onActivateIntroduction,
    },
  };
}
