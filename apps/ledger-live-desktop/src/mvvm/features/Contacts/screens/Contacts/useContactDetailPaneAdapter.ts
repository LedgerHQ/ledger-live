import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Contact, ContactId } from "@domain/entity-contact";
import {
  useEmptyContactDetail,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";

const onAddAddress = () => undefined;

export function useContactDetailPaneAdapter(contacts: readonly Contact[]): Readonly<{
  detail: ContactDetailViewProps | undefined;
  onOpenMe: ContactsListViewProps["onOpenMe"];
  onOpenContact: ContactsListViewProps["onOpenContact"];
}> {
  const { t } = useTranslation();
  const [selectedContactId, setSelectedContactId] = useState<ContactId | undefined>();
  const selectedContact = useEmptyContactDetail(selectedContactId);
  const labels = useMemo<ContactDetailLabels>(
    () => ({
      addAddress: t("contacts.addAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.meTitle"),
      emptyContactTitle: name => t("contacts.detail.emptyState.contactTitle", { name }),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: () => t("contacts.detail.emptyState.contactDescription"),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const onOpenMe = useCallback<ContactsListViewProps["onOpenMe"]>(contactId => {
    setSelectedContactId(contactId);
  }, []);
  const onOpenContact = useCallback<ContactsListViewProps["onOpenContact"]>(
    contactId => {
      const isEmptyContact = contacts.some(
        contact => contact.id === contactId && contact.addresses.length === 0,
      );

      if (!isEmptyContact) {
        setSelectedContactId(undefined);
        return;
      }

      setSelectedContactId(contactId);
    },
    [contacts],
  );
  const detail = useMemo<ContactDetailViewProps | undefined>(() => {
    if (!selectedContact) {
      return undefined;
    }

    return {
      contact: selectedContact,
      labels,
      meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
      onAddAddress,
    };
  }, [labels, selectedContact]);

  return {
    detail,
    onOpenMe,
    onOpenContact,
  };
}
