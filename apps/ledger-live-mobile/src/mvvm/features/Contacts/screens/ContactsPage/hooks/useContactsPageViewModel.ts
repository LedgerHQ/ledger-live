import {
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
  isContactsLedgerSyncActivationRequired,
  resolveContactsLedgerSyncIntroductionOpen,
  useContactsFeatureIntroductionState,
} from "@features/flow-contacts-introduction";
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { Contact } from "@domain/entity-contact";
import { useContacts } from "@features/platform-contacts";
import type { BaseNavigationComposite } from "~/components/RootNavigator/types/helpers";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { ScreenName } from "~/const";
import { useContactsAnalytics } from "../../../analytics/useContactsAnalytics";
import { useContactsFeatureIntroductionPreference } from "../../../hooks/useContactsFeatureIntroductionPreference";
import { useContactsLedgerSyncStatus } from "../../../hooks/useContactsLedgerSyncStatus";
import { useContactsLedgerSyncActivationDrawer } from "../../../hooks/useContactsLedgerSyncActivationDrawer";
import type { ContactsPageViewModel } from "../types";

type NavigationProp = BaseNavigationComposite<
  NativeStackNavigationProp<MyWalletNavigatorStackParamList>
>;

export function useContactsPageViewModel(
  onSelectContact?: (contact: Contact) => void,
): ContactsPageViewModel {
  const navigation = useNavigation<NavigationProp>();
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const contacts = useContacts();
  const preference = useContactsFeatureIntroductionPreference();
  const { isRequested: isFeatureIntroductionRequested, dismiss: dismissFeatureIntroduction } =
    useContactsFeatureIntroductionState({
      isContactsEntryAvailable: true,
      preference,
    });
  const ledgerSyncStatus = useContactsLedgerSyncStatus();
  const { requestMutation, dismissPendingIntent } = useContactsLedgerSyncMutationGuard();
  const { ledgerSyncActivationDrawer, openLedgerSyncActivationDrawer } =
    useContactsLedgerSyncActivationDrawer();
  const [isLedgerSyncIntroductionRequested, setIsLedgerSyncIntroductionRequested] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const viewModel = useContactsSearchViewModel(searchQuery);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback<ContactsViewNativeProps["onOpenContact"]>(
    contactId => {
      trackContactsListContactOpen(analytics, contactId, meContact.id);
      if (onSelectContact) {
        const contact = contacts.find(candidate => candidate.id === contactId);
        if (contact) {
          onSelectContact(contact);
          return;
        }
      }
      navigation.navigate(ScreenName.MyWalletContactDetail, { contactId });
    },
    [analytics, contacts, meContact.id, navigation, onSelectContact],
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

  useEffect(() => {
    if (!isContactsLedgerSyncActivationRequired(ledgerSyncStatus)) {
      dismissPendingIntent();
      setIsLedgerSyncIntroductionRequested(false);
    }
  }, [dismissPendingIntent, ledgerSyncStatus]);

  const showFeatureIntroduction = !onSelectContact && isFeatureIntroductionRequested;
  const isLedgerSyncIntroductionOpen = resolveContactsLedgerSyncIntroductionOpen({
    isFeatureIntroductionRequested: showFeatureIntroduction,
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
    searchQuery,
    onSearchQueryChange,
    onOpenContact,
    ledgerSyncStatus,
    featureIntroduction: {
      isOpen: showFeatureIntroduction,
      onComplete: dismissFeatureIntroduction,
      onClose: dismissFeatureIntroduction,
    },
    ledgerSyncIntroduction: {
      isOpen: isLedgerSyncIntroductionOpen,
      onActivate: onActivateIntroduction,
      onDismiss: onDismissLedgerSyncIntroduction,
    },
    ledgerSyncActivationDrawer,
    onRequestAddContact,
  };
}
