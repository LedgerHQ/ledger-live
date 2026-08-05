import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactAddressDetailSendIntent,
  type ContactsDeleteAddressDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsRenameAddressDrawerProps,
  type ContactAddressDetailDialogNativeProps,
  useContactAddressDetailActionsFlowBindings,
  useContactsAddressDetailActionsPorts,
} from "@features/flow-contacts";
import { useOpenSendFlow } from "LLM/features/Send/hooks/useOpenSendFlow";
import { useCallback, useMemo } from "react";
import { ScreenName } from "~/const";
import { useTranslation } from "~/context/Locale";

export type ContactAddressDetailActionsFlowProps = Readonly<{
  addressDetailDialog: Pick<
    ContactAddressDetailDialogNativeProps,
    "onSend" | "onEdit" | "onDelete" | "canSend" | "canEdit" | "canDelete"
  >;
  deleteSheet: ContactsDeleteAddressDrawerProps;
  renameSheet: ContactsRenameAddressDrawerProps;
  signerSheet: ContactsEditSignerDrawerProps;
}>;

export function useContactAddressDetailActionsAdapter(
  contactId: ContactId | undefined,
  addressId: ContactAddressId | undefined,
  onCloseAddressDetail: () => void,
): ContactAddressDetailActionsFlowProps {
  const { t } = useTranslation();
  const ports = useContactsAddressDetailActionsPorts();
  const { handleOpenSendFlow } = useOpenSendFlow({
    sourceScreenName: ScreenName.MyWalletContactDetail,
  });
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const onSend = useCallback(
    (intent: ContactAddressDetailSendIntent) => {
      handleOpenSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
      });
      onCloseAddressDetail();
    },
    [handleOpenSendFlow, onCloseAddressDetail],
  );
  const deleteLabels = useMemo(
    () => ({
      title: t("contacts.deleteAddress.title"),
      description: t("contacts.deleteAddress.description"),
      confirm: t("contacts.deleteAddress.confirm"),
      cancel: t("contacts.deleteAddress.cancel"),
    }),
    [t],
  );
  const renameLabels = useMemo(
    () => ({
      title: t("contacts.editAddress.title"),
      inputLabel: t("contacts.editAddress.inputLabel"),
      applyChanges: t("contacts.editAddress.applyChanges"),
      labelValidationErrors: {
        InvalidContactAddressLabelError: t("contacts.editAddress.invalidLabelError"),
        DuplicateContactAddressLabelError: t("contacts.addAddressName.duplicateLabel"),
        ContactAddressLabelTooLongError: t("contacts.addAddressName.labelTooLong"),
      },
    }),
    [t],
  );
  const signerLabels = useMemo(
    () => ({
      title: t("contacts.editSigner.title"),
      description: t("contacts.editSigner.description"),
      confirm: t("contacts.editSigner.confirm"),
      cancel: t("contacts.editSigner.cancel"),
    }),
    [t],
  );
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    onSend,
    onCloseAddressDetail,
  });

  if (!isSelectionActive) {
    return {
      addressDetailDialog: {
        canSend: false,
        canEdit: false,
        canDelete: false,
      },
      deleteSheet: {
        isOpen: false,
        isDeleting: false,
        labels: deleteLabels,
        onConfirm: async () => undefined,
        onCancel: () => undefined,
      },
      renameSheet: {
        isOpen: false,
        isSaving: false,
        draftLabel: "",
        invalidLabelError: null,
        isConfirmEnabled: false,
        labels: renameLabels,
        onOpen: () => undefined,
        onClose: () => undefined,
        onDraftLabelChange: () => undefined,
        onConfirm: async () => undefined,
      },
      signerSheet: {
        isOpen: false,
        labels: signerLabels,
        onConfirm: () => undefined,
        onCancel: () => undefined,
      },
    };
  }

  return {
    addressDetailDialog: {
      onSend: flow.onSendPress,
      onEdit: flow.onEditPress,
      onDelete: flow.onDeletePress,
      canSend: flow.canSend,
      canEdit: flow.canEdit,
      canDelete: flow.canDelete,
    },
    deleteSheet: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: deleteLabels,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    renameSheet: {
      ...renameViewModel,
      labels: renameLabels,
    },
    signerSheet: {
      isOpen: flow.editUiState === "signer-open",
      labels: signerLabels,
      onConfirm: flow.onSignerConfirm,
      onCancel: flow.onSignerCancel,
    },
  };
}
