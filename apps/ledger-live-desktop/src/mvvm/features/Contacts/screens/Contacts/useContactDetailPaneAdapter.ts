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

export function useContactDetailPaneAdapter(
  contacts: readonly Contact[],
  onAddAddress: (contactId: ContactId) => void,
): Readonly<{
  detail: ContactDetailViewProps | undefined;
  onOpenMe: ContactsListViewProps["onOpenMe"];
  onOpenContact: ContactsListViewProps["onOpenContact"];
}> {
  const { t } = useTranslation();
  const [detailContactId, setDetailContactId] = useState<ContactId | undefined>();
  const selectedContact = useEmptyContactDetail(detailContactId);
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
    setDetailContactId(contactId);
  }, []);
  const onOpenContact = useCallback<ContactsListViewProps["onOpenContact"]>(
    contactId => {
      const isEmptyContact = contacts.some(
        contact => contact.id === contactId && contact.addresses.length === 0,
      );

      if (!isEmptyContact) {
        setDetailContactId(undefined);
        return;
      }

      setDetailContactId(contactId);
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
      onAddAddress: () => onAddAddress(selectedContact.id),
    };
  }, [labels, onAddAddress, selectedContact]);

  return {
    detail,
    onOpenMe,
    onOpenContact,
  };
}
