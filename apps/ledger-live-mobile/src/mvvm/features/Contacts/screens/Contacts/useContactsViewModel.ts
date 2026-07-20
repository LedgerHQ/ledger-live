import {
  type ContactsLedgerSyncStatus,
  type ContactsPageNativeLabels,
  type ContactsPageNativeProps,
  useContactsSearchViewModel,
} from "@features/flow-contacts";
import { useCallback, useMemo, useState } from "react";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

export type ContactsViewModel = ContactsPageNativeProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const labels = useMemo<ContactsPageNativeLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      searchNoResults: t("contacts.searchNoResults"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const [isIntroductionDismissed, setIsIntroductionDismissed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const viewModel = useContactsSearchViewModel(searchQuery);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback<ContactsPageNativeProps["onOpenContact"]>(() => undefined, []);
  const onAddContact = useCallback(() => undefined, []);
  const onDismissIntroduction = useCallback(() => setIsIntroductionDismissed(true), []);

  return {
    viewModel,
    labels,
    searchQuery,
    onSearchQueryChange,
    meAvatarSrc: USER_AVATAR_URL,
    onOpenContact,
    onAddContact,
    ledgerSyncStatus,
    ledgerSyncIntroduction: {
      isOpen: ledgerSyncStatus === "inactive" && !isIntroductionDismissed,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissIntroduction,
    },
  };
}
