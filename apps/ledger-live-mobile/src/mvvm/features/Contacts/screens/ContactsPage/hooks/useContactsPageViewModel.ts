import {
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
  type ContactsPageNativeProps,
  createClosedContactsFeatureIntroduction,
  useContacts,
  useContactsSearchViewModel,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import type { MyWalletNavigatorStackParamList } from "LLM/features/MyWallet/types";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";
import type { ContactsPageViewModel } from "../types";

export function useContactsPageViewModel(): ContactsPageViewModel {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<MyWalletNavigatorStackParamList>>();
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
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const [isIntroductionDismissed, setIsIntroductionDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const contacts = useContacts();
  const viewModel = useContactsSearchViewModel(searchQuery);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback<ContactsPageNativeProps["onOpenContact"]>(
    contactId => {
      if (!contacts.some(contact => contact.id === contactId && contact.addresses.length === 0)) {
        return;
      }

      navigation.navigate(ScreenName.MyWalletContactDetail, { contactId });
    },
    [contacts, navigation],
  );
  const onDismissIntroduction = useCallback(() => setIsIntroductionDismissed(true), []);
  const onActivateIntroduction = useCallback(() => undefined, []);

  useEffect(() => {
    if (ledgerSyncStatus !== "inactive") {
      setIsIntroductionDismissed(false);
    }
  }, [ledgerSyncStatus]);

  return {
    viewModel,
    labels,
    searchQuery,
    onSearchQueryChange,
    meAvatarSrc: USER_AVATAR_URL,
    onOpenContact,
    ledgerSyncStatus,
    featureIntroduction: createClosedContactsFeatureIntroduction(),
    ledgerSyncIntroduction: {
      isOpen: ledgerSyncStatus === "inactive" && !isIntroductionDismissed,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissIntroduction,
    },
    ledgerSyncIntroductionContent: {
      title: t("contacts.ledgerSyncIntroduction.title"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      onActivate: onActivateIntroduction,
    },
  };
}
