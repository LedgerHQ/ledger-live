import {
  CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME,
  ContactIdSchema,
  DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import {
  type ContactsDeleteAddressDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsRenameAddressDialogProps,
  type ContactAddressDetailDialogProps,
  type ContactAddressDetailSendIntent,
  useContactAddressDetailActionsFlowBindings,
  useContactsAddressDetailActionsPorts,
} from "@features/flow-contacts";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useOpenSendFlow } from "LLD/features/Send/hooks/useOpenSendFlow";

export type ContactAddressDetailActionsDialogProps = Readonly<{
  addressDetailDialog: Pick<
    ContactAddressDetailDialogProps,
    "onSend" | "onEdit" | "onDelete" | "canSend" | "canEdit" | "canDelete"
  >;
  deleteDialog: ContactsDeleteAddressDialogProps;
  renameDialog: ContactsRenameAddressDialogProps;
  signerDialog: ContactsEditSignerDialogProps;
}>;

export function useContactAddressDetailActionsAdapter(
  contactId: ContactId | undefined,
  addressId: ContactAddressId | undefined,
  onCloseAddressDetail: () => void,
): ContactAddressDetailActionsDialogProps {
  const { t } = useTranslation();
  const ports = useContactsAddressDetailActionsPorts();
  const openSendFlow = useOpenSendFlow();
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const onSend = useCallback(
    (intent: ContactAddressDetailSendIntent) => {
      openSendFlow({
        currencyIds: [intent.currencyId],
        recipient: intent.address,
      });
      onCloseAddressDetail();
    },
    [onCloseAddressDetail, openSendFlow],
  );
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    onSend,
    onCloseAddressDetail,
  });
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
        [INVALID_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.editAddress.invalidLabelError"),
        [DUPLICATE_CONTACT_ADDRESS_LABEL_ERROR_NAME]: t("contacts.addAddressName.duplicateLabel"),
        [CONTACT_ADDRESS_LABEL_TOO_LONG_ERROR_NAME]: t("contacts.addAddressName.tooLongLabel"),
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

  if (!isSelectionActive) {
    return {
      addressDetailDialog: {
        canSend: false,
        canEdit: false,
        canDelete: false,
      },
      deleteDialog: {
        isOpen: false,
        isDeleting: false,
        labels: deleteLabels,
        onConfirm: async () => undefined,
        onCancel: () => undefined,
      },
      renameDialog: {
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
      signerDialog: {
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
    deleteDialog: {
      isOpen: flow.deleteLifecycle.status === "open",
      isDeleting: flow.isDeleting,
      labels: deleteLabels,
      onConfirm: flow.confirmDelete,
      onCancel: flow.cancelDelete,
    },
    renameDialog: {
      ...renameViewModel,
      labels: renameLabels,
    },
    signerDialog: {
      isOpen: flow.editUiState === "signer-open",
      labels: signerLabels,
      onConfirm: flow.onSignerConfirm,
      onCancel: flow.onSignerCancel,
    },
  };
}
