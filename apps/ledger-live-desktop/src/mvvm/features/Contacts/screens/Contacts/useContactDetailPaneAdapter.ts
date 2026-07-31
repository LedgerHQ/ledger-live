import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ContactId } from "@domain/entity-contact";
import {
  type AddAddressContact,
  useEmptyContactDetail,
  usePopulatedContactDetail,
  useContactAddressDetailDialog,
  type ContactAddressDetailDialogLabels,
  type ContactAddressDetailDialogProps,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  type ContactsListViewProps,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsAddressCurrencyAdapter } from "../../hooks/useContactsAddressCurrencyAdapter";

export function useContactDetailPaneAdapter(
  onAddAddress: (contact: AddAddressContact) => void,
): Readonly<{
  detail: ContactDetailViewProps | undefined;
  addressDetailDialog: ContactAddressDetailDialogProps;
  onOpenMe: ContactsListViewProps["onOpenMe"];
  onOpenContact: ContactsListViewProps["onOpenContact"];
}> {
  const { t } = useTranslation();
  const currencyPort = useContactsAddressCurrencyAdapter();
  const [detailContactId, setDetailContactId] = useState<ContactId | undefined>();
  const emptyContact = useEmptyContactDetail(detailContactId);
  const populatedContactDetail = usePopulatedContactDetail(detailContactId, currencyPort);
  const {
    isOpen,
    selection,
    onAddressRowPress,
    onClose: onCloseAddressDetail,
    clearSelection,
  } = useContactAddressDetailDialog(populatedContactDetail);
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
  const addressDetailDialogLabels = useMemo<ContactAddressDetailDialogLabels>(
    () => ({
      send: t("contacts.addressDetail.send"),
      copy: t("contacts.addressDetail.copy"),
      copied: t("contacts.addressDetail.copied"),
      edit: t("contacts.addressDetail.edit"),
      delete: t("contacts.addressDetail.delete"),
      formatNetworkTag: networkName =>
        t("contacts.addressDetail.networkTag", { name: networkName }),
    }),
    [t],
  );
  const openContact = useCallback(
    (contactId: ContactId) => {
      setDetailContactId(contactId);
      clearSelection();
    },
    [clearSelection],
  );
  const detail = useMemo<ContactDetailViewProps | undefined>(() => {
    const baseDetail = {
      labels,
      meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
    };

    if (populatedContactDetail) {
      return {
        ...baseDetail,
        contact: populatedContactDetail.contact,
        onAddAddress: () => onAddAddress(populatedContactDetail.contact),
        addressGroups: populatedContactDetail.addressGroups,
        onAddressRowPress,
      };
    }

    if (!emptyContact) {
      return undefined;
    }

    return {
      ...baseDetail,
      contact: emptyContact,
      onAddAddress: () => onAddAddress(emptyContact),
    };
  }, [emptyContact, labels, onAddAddress, onAddressRowPress, populatedContactDetail]);
  const addressDetailDialog = useMemo<ContactAddressDetailDialogProps>(
    () => ({
      isOpen,
      contactName: populatedContactDetail?.contact.name ?? "",
      row: selection?.row,
      network: selection?.network,
      labels: addressDetailDialogLabels,
      onClose: onCloseAddressDetail,
    }),
    [
      addressDetailDialogLabels,
      isOpen,
      onCloseAddressDetail,
      populatedContactDetail?.contact.name,
      selection?.network,
      selection?.row,
    ],
  );

  return {
    detail,
    addressDetailDialog,
    onOpenMe: openContact,
    onOpenContact: openContact,
  };
}
