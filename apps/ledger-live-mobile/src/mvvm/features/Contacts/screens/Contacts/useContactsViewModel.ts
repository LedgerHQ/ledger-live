import {
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
  type ContactsPageProps,
  useContactsListViewModel,
} from "@features/flow-contacts";
import { useCallback, useMemo, useState } from "react";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

export type ContactsViewModel = ContactsPageProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const [isIntroductionDismissed, setIsIntroductionDismissed] = useState(false);
  const viewModel = useContactsListViewModel();
  const onOpenContact = useCallback<ContactsPageProps["onOpenContact"]>(() => undefined, []);
  const onAddContact = useCallback(() => undefined, []);
  const onDismissIntroduction = useCallback(() => setIsIntroductionDismissed(true), []);

  return {
    viewModel,
    labels,
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
