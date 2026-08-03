import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { ContactId } from "@domain/entity-contact";
import {
  type AddAddressContact,
  useContactsMeContact,
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
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";

export function useContactDetailPaneAdapter(
  onAddAddress: (contact: AddAddressContact) => void,
): Readonly<{
  detail: ContactDetailViewProps | undefined;
  addressDetailDialog: ContactAddressDetailDialogProps;
  editDeleteDialogs: ReturnType<typeof useContactDetailEditDeleteAdapter>;
  onOpenMe: ContactsListViewProps["onOpenMe"];
  onOpenContact: ContactsListViewProps["onOpenContact"];
}> {
  const { t } = useTranslation();
  const meContact = useContactsMeContact();
  const currencyPort = useContactsAddressCurrencyAdapter();
  const [detailContactId, setDetailContactId] = useState<ContactId | undefined>(meContact.id);
  const onDeleteSuccess = useCallback(() => {
    setDetailContactId(meContact.id);
  }, [meContact.id]);
  const editDeleteDialogs = useContactDetailEditDeleteAdapter(detailContactId, onDeleteSuccess);
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
      addExternalAddress: t("contacts.addExternalAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.meTitle"),
      emptyContactTitle: name => t("contacts.detail.emptyState.contactTitle", { name }),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: () => t("contacts.detail.emptyState.contactDescription"),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
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
        detailActions: editDeleteDialogs.detailActions,
      };
    }

    if (!emptyContact) {
      return undefined;
    }

    return {
      ...baseDetail,
      contact: emptyContact,
      onAddAddress: () => onAddAddress(emptyContact),
      detailActions: editDeleteDialogs.detailActions,
    };
  }, [
    emptyContact,
    editDeleteDialogs.detailActions,
    labels,
    onAddAddress,
    onAddressRowPress,
    populatedContactDetail,
  ]);
  const addressDetailDialog = useMemo<ContactAddressDetailDialogProps>(
    () => ({
      isOpen,
      contactName: populatedContactDetail?.contact.name ?? emptyContact?.name ?? "",
      row: selection?.row,
      network: selection?.network,
      labels: addressDetailDialogLabels,
      onClose: onCloseAddressDetail,
    }),
    [
      addressDetailDialogLabels,
      emptyContact?.name,
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
    editDeleteDialogs,
    onOpenMe: openContact,
    onOpenContact: openContact,
  };
}
