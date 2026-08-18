import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import type { ContactId } from "@domain/entity-contact";
import {
  type AddAddressContact,
  useContactsMeContact,
  useContactDetailSharedState,
  useEmptyContactDetail,
  usePopulatedContactDetail,
  useContactAddressDetailDialog,
  type ContactAddressDetailDialogLabels,
  type ContactAddressDetailDialogProps,
  type ContactDetailLabels,
  type ContactDetailViewProps,
  type ContactsViewProps,
  CONTACTS_EVENT_SOURCE,
  CONTACTS_PAGE_EVENTS,
  trackContactsAddAddressClick,
  trackContactsListContactOpen,
} from "@features/flow-contacts";
import { MY_WALLET_AVATAR_USER_URL } from "LLD/features/MyWallet/components/UserAvatar/constants";
import { useContactsAnalytics } from "../../analytics";
import { useContactsAddressCurrencyAdapter } from "../../hooks/useContactsAddressCurrencyAdapter";
import { useContactAddressDetailActionsAdapter } from "./useContactAddressDetailActionsAdapter";
import { useContactDetailEditDeleteAdapter } from "./useContactDetailEditDeleteAdapter";

export function useContactDetailPaneAdapter(
  onAddAddress: (contact: AddAddressContact) => void,
): Readonly<{
  detail: ContactDetailViewProps | undefined;
  addressDetailDialog: ContactAddressDetailDialogProps;
  editDeleteDialogs: ReturnType<typeof useContactDetailEditDeleteAdapter>;
  addressDetailActionsDialogs: ReturnType<typeof useContactAddressDetailActionsAdapter>;
  onOpenMe: ContactsViewProps["onOpenMe"];
  onOpenContact: ContactsViewProps["onOpenContact"];
}> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const analytics = useContactsAnalytics();
  const meContact = useContactsMeContact();
  const currencyPort = useContactsAddressCurrencyAdapter();
  const trackedContactDetailId = useRef<ContactId | undefined>(undefined);
  const trackedAddressDetailId = useRef<string | undefined>(undefined);
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
  const addressDetailAsset = selection?.network.networkTicker;
  const addressDetailNetwork = selection?.network.networkName;
  const addressDetailActionsDialogs = useContactAddressDetailActionsAdapter(
    detailContactId,
    selection?.row?.addressId,
    onCloseAddressDetail,
    addressDetailAsset,
    addressDetailNetwork,
  );
  const labels = useMemo<ContactDetailLabels>(
    () => ({
      addAddress: t("contacts.addAddress"),
      addExternalAddress: t("contacts.addExternalAddress"),
      emptyMeTitle: t("contacts.detail.emptyState.meTitle"),
      emptyContactTitle: name => t("contacts.detail.emptyState.contactTitle", { name }),
      emptyMeDescription: t("contacts.detail.emptyState.meDescription"),
      emptyContactDescription: () => t("contacts.detail.emptyState.contactDescription"),
      ledgerWalletAddresses: t("contacts.detail.ledgerWalletAddresses"),
      formatMeDisplayName: name => t("contacts.detail.meDisplayName", { name }),
      formatAddressCount: count => t("contacts.addressCount", { count }),
    }),
    [t],
  );
  const detailSharedState = useContactDetailSharedState(
    detailContactId,
    labels.formatMeDisplayName,
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
  const onLedgerWalletAccountsPress = useCallback(() => {
    navigate("/cryptos");
  }, [navigate]);
  const openContact = useCallback(
    (contactId: ContactId) => {
      trackContactsListContactOpen(analytics, contactId, meContact.id);
      setDetailContactId(contactId);
      clearSelection();
    },
    [analytics, clearSelection, meContact.id],
  );
  const handleAddAddress = useCallback(
    (contact: AddAddressContact) => {
      trackContactsAddAddressClick(analytics, contact.id, meContact.id);
      onAddAddress(contact);
    },
    [analytics, meContact.id, onAddAddress],
  );
  const detail = useMemo<ContactDetailViewProps | undefined>(() => {
    const contact = populatedContactDetail?.contact ?? emptyContact;

    if (!contact) {
      return undefined;
    }

    return {
      labels,
      meAvatarSrc: MY_WALLET_AVATAR_USER_URL,
      contact,
      onAddAddress: () => handleAddAddress(contact),
      ledgerWalletAccountsIntent: detailSharedState?.ledgerWalletAccountsIntent,
      onLedgerWalletAccountsPress,
      ...(populatedContactDetail
        ? {
            addressGroups: populatedContactDetail.addressGroups,
            onAddressRowPress,
          }
        : {}),
      detailActions: editDeleteDialogs.detailActions,
    };
  }, [
    detailSharedState?.ledgerWalletAccountsIntent,
    emptyContact,
    editDeleteDialogs.detailActions,
    handleAddAddress,
    labels,
    onLedgerWalletAccountsPress,
    onAddressRowPress,
    populatedContactDetail,
  ]);
  const addressDetailDialog = useMemo<ContactAddressDetailDialogProps>(() => {
    const isAddressActionDialogOpen =
      addressDetailActionsDialogs.deleteDialog.isOpen ||
      addressDetailActionsDialogs.signerDialog.isOpen ||
      addressDetailActionsDialogs.signerMismatchDialog.isOpen ||
      addressDetailActionsDialogs.renameDialog.isOpen;

    return {
      isOpen: isOpen && !isAddressActionDialogOpen,
      contactName: populatedContactDetail?.contact.name ?? emptyContact?.name ?? "",
      row: selection?.row,
      network: selection?.network,
      labels: addressDetailDialogLabels,
      onClose: onCloseAddressDetail,
      ...addressDetailActionsDialogs.addressDetailDialog,
    };
  }, [
    addressDetailActionsDialogs.addressDetailDialog,
    addressDetailActionsDialogs.deleteDialog.isOpen,
    addressDetailActionsDialogs.renameDialog.isOpen,
    addressDetailActionsDialogs.signerDialog.isOpen,
    addressDetailActionsDialogs.signerMismatchDialog.isOpen,
    addressDetailDialogLabels,
    emptyContact?.name,
    isOpen,
    onCloseAddressDetail,
    populatedContactDetail?.contact.name,
    selection?.network,
    selection?.row,
  ]);

  useEffect(() => {
    if (detailContactId === undefined) {
      return;
    }

    if (trackedContactDetailId.current === detailContactId) {
      return;
    }

    trackedContactDetailId.current = detailContactId;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.CONTACT_DETAIL, {
      source: CONTACTS_EVENT_SOURCE.CONTACT_DETAIL,
      isSelf: detailContactId === meContact.id,
    });
  }, [analytics, detailContactId, meContact.id]);

  useEffect(() => {
    const addressKey =
      isOpen && selection ? `${selection.row.addressId}:${selection.network.networkId}` : undefined;

    if (addressKey === undefined || trackedAddressDetailId.current === addressKey) {
      return;
    }

    trackedAddressDetailId.current = addressKey;
    analytics.trackPage(CONTACTS_PAGE_EVENTS.ADDRESS_DETAIL, {
      source: CONTACTS_EVENT_SOURCE.ADDRESS_DETAIL,
      network: selection!.network.networkName,
      asset: selection!.network.networkTicker,
    });
  }, [analytics, isOpen, selection]);

  useEffect(() => {
    if (!isOpen) {
      trackedAddressDetailId.current = undefined;
    }
  }, [isOpen]);

  return {
    detail,
    addressDetailDialog,
    editDeleteDialogs,
    addressDetailActionsDialogs,
    onOpenMe: openContact,
    onOpenContact: openContact,
  };
}
