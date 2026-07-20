import {
  type ContactsLedgerSyncStatus,
  type ContactsPageLabels,
  type ContactsPageProps,
  useContactsListViewModel,
} from "@features/flow-contacts";
import { useCallback, useEffect, useMemo, useState } from "react";
import { USER_AVATAR_URL } from "LLM/components/UserAvatar/constants";
import { useTranslation } from "~/context/Locale";

type ContactsLedgerSyncIntroductionSheetProps = Readonly<{
  title: string;
  activateLabel: string;
  onActivate: () => void;
}>;

export type ContactsViewModel = ContactsPageProps &
  Readonly<{
    ledgerSyncIntroductionSheet: ContactsLedgerSyncIntroductionSheetProps;
  }>;

export function useContactsViewModel(): ContactsViewModel {
  const { t } = useTranslation();
  const labels = useMemo<ContactsPageLabels>(
    () => ({
      title: t("contacts.title"),
      searchPlaceholder: t("contacts.searchPlaceholder"),
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
  const viewModel = useContactsListViewModel();
  const onOpenContact = useCallback<ContactsPageProps["onOpenContact"]>(() => undefined, []);
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
    ledgerSyncIntroductionSheet: {
      title: t("contacts.ledgerSyncIntroduction.title"),
      activateLabel: t("contacts.ledgerSyncIntroduction.activate"),
      onActivate: onActivateIntroduction,
    },
  };
}
