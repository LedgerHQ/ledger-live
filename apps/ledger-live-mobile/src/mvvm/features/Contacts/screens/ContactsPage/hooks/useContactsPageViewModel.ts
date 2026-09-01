import {
  type ContactsListViewLabels,
  type ContactsViewNativeProps,
  useContactsSearchViewModel,
  useContactsMeContact,
  useContactsListPageAnalytics,
  trackContactsLedgerSyncActivate,
  trackContactsLedgerSyncDismiss,
  trackContactsListContactOpen,
  useContactsLedgerSyncMutationGuard,
} from "@features/flow-contacts";
import {
  CONTACTS_FEATURE_INTRODUCTION_HIGHLIGHTS,
  isContactsLedgerSyncActivationRequired,
  resolveContactsLedgerSyncIntroductionOpen,
  useContactsFeatureIntroductionState,
} from "@features/flow-contacts-introduction";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";
import { useContactsFeatureIntroductionPreference } from "../../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsLedgerSyncStatus } from "../../../hooks/useContactsLedgerSyncStatus";
import { useContactsLedgerSyncActivationDrawer } from "../../../hooks/useContactsLedgerSyncActivationDrawer";
import type { ContactsPageViewModel } from "../types";

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactsPageViewModel(): ContactsPageViewModel {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const labels = useMemo<ContactsListViewLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      ledgerSyncCheckingAccessibilityLabel: t(
        "contacts.ledgerSyncIntroduction.checkingAccessibilityLabel",
      ),
      formatAddressCount: count => t("contacts.addressCount", { count }),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
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
  const ledgerSyncStatus = useContactsLedgerSyncStatus();
  const { requestMutation, dismissPendingIntent } = useContactsLedgerSyncMutationGuard();
  const { ledgerSyncActivationDrawer, openLedgerSyncActivationDrawer } =
    useContactsLedgerSyncActivationDrawer();
  const [isLedgerSyncIntroductionRequested, setIsLedgerSyncIntroductionRequested] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const viewModel = useContactsSearchViewModel(searchQuery, labels.formatMeDisplayName);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback<ContactsViewNativeProps["onOpenContact"]>(
    contactId => {
      trackContactsListContactOpen(analytics, contactId, meContact.id);
      navigation.navigate(ScreenName.MyWalletContactDetail, { contactId });
    },
    [analytics, meContact.id, navigation],
  );
  const onDismissLedgerSyncIntroduction = useCallback(() => {
    trackContactsLedgerSyncDismiss(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
  }, [analytics, dismissPendingIntent]);
  const onActivateIntroduction = useCallback(() => {
    trackContactsLedgerSyncActivate(analytics);
    dismissPendingIntent();
    setIsLedgerSyncIntroductionRequested(false);
    openLedgerSyncActivationDrawer();
  }, [analytics, dismissPendingIntent, openLedgerSyncActivationDrawer]);
  const onRequestAddContact = useCallback(
    (onAllowed: () => void) => {
      const result = requestMutation({ kind: "addContact" }, ledgerSyncStatus);
      if (result.status === "allowed") {
        onAllowed();
      } else if (result.status === "blocked") {
        setIsLedgerSyncIntroductionRequested(true);
      }
    },
    [ledgerSyncStatus, requestMutation],
  );
  const onCompleteFeatureIntroduction = useCallback(() => {
    featureIntroductionState.dismiss();
  }, [featureIntroductionState]);
  const onCloseFeatureIntroduction = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (!isContactsLedgerSyncActivationRequired(ledgerSyncStatus)) {
      dismissPendingIntent();
      setIsLedgerSyncIntroductionRequested(false);
    }
  }, [dismissPendingIntent, ledgerSyncStatus]);

  const isLedgerSyncIntroductionOpen = resolveContactsLedgerSyncIntroductionOpen({
    isFeatureIntroductionRequested: featureIntroductionState.isRequested,
    ledgerSyncStatus,
    isLedgerSyncIntroductionRequested,
  });
  const searchHasResults = !("status" in viewModel && viewModel.status === "no-results");

  useContactsListPageAnalytics({
    analytics,
    searchQuery,
    searchHasResults,
    isLedgerSyncIntroductionOpen,
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
      highlights: featureIntroductionHighlights,
      primaryActionLabel: t("contacts.featureIntroduction.primaryAction"),
      onComplete: onCompleteFeatureIntroduction,
      onClose: onCloseFeatureIntroduction,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      title: t("contacts.ledgerSyncIntroduction.title"),
      description: t("contacts.ledgerSyncIntroduction.description"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onActivate: onActivateIntroduction,
      onDismiss: onDismissLedgerSyncIntroduction,
    },
    ledgerSyncActivationDrawer,
    onRequestAddContact,
  };
}
