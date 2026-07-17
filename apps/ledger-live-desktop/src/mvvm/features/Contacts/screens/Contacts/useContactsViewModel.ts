import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  useContactsListViewModel,
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import type { ContactsViewProps } from "./ContactsView";

export type ContactsViewModel = ContactsViewProps;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const viewModel = useContactsListViewModel();
  const [isIntroductionDismissed, setIsIntroductionDismissed] = useState(false);
  const [ledgerSyncStatus] = useState<ContactsLedgerSyncStatus>("ready");
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
      addContact: t("contacts.addContact"),
      formatAddressCount: count => t("contacts.me.addressCount", { count }),
    }),
    [t],
  );
  const onOpenContact = useCallback<ContactsViewProps["onOpenContact"]>(
    _contactId => undefined,
    [],
  );
  const onAddContact = useCallback(() => undefined, []);
  const onDismissIntroduction = useCallback(() => setIsIntroductionDismissed(true), []);

  useEffect(() => {
    if (ledgerSyncStatus !== "inactive") {
      setIsIntroductionDismissed(false);
    }
  }, [ledgerSyncStatus]);

  const isIntroductionOpen = ledgerSyncStatus === "inactive" && !isIntroductionDismissed;

  return {
    viewModel,
    labels,
    meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    onOpenContact,
    onAddContact,
    ledgerSyncStatus,
    ledgerSyncIntroduction: {
      isOpen: isIntroductionOpen,
      description: t("contacts.ledgerSyncIntroduction.description"),
      dismissLabel: t("contacts.ledgerSyncIntroduction.dismiss"),
      onDismiss: onDismissIntroduction,
    },
  };
}
