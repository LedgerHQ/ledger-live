import {
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
  type ContactsPageNativeProps,
  createClosedContactsFeatureIntroduction,
  useContactsSearchViewModel,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

type ContactsLedgerSyncIntroductionSheetProps = Readonly<{
  title: string;
  activateLabel: string;
  onActivate: () => void;
}>;

export type ContactsViewModel = ContactsPageNativeProps &
  Readonly<{
    ledgerSyncIntroductionSheet: ContactsLedgerSyncIntroductionSheetProps;
  }>;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
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
  const viewModel = useContactsSearchViewModel(searchQuery);
  const onSearchQueryChange = useCallback((query: string) => setSearchQuery(query), []);
  const onOpenContact = useCallback<ContactsPageNativeProps["onOpenContact"]>(() => undefined, []);
  const onAddContact = useCallback(() => undefined, []);
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
    onAddContact,
    ledgerSyncStatus,
    featureIntroduction: createClosedContactsFeatureIntroduction(),
    ledgerSyncIntroduction: {
      isOpen: ledgerSyncStatus === "inactive" && !isIntroductionDismissed,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissIntroduction,
    },
    ledgerSyncIntroductionSheet: {
      title: t("contacts.ledgerSyncIntroduction.title"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      onActivate: onActivateIntroduction,
    },
  };
}
