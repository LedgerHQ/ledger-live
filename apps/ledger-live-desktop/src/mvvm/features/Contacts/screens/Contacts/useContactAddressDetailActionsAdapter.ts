import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactsDeleteAddressDialogProps,
  type ContactsEditSignerDialogProps,
  type ContactsEditSignerMismatchDialogProps,
  type ContactsRenameAddressDialogProps,
  type ContactAddressDetailDialogProps,
  type ContactAddressDetailSendIntent,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
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
  signerMismatchDialog: ContactsEditSignerMismatchDialogProps;
}>;

function mapUiStateToDialogProps(
  uiState: ReturnType<typeof createInactiveContactAddressDetailActionsUiState>,
): ContactAddressDetailActionsDialogProps {
  return {
    addressDetailDialog: uiState.addressDetailDialog,
    deleteDialog: uiState.delete,
    renameDialog: uiState.rename,
    signerDialog: uiState.signer,
    signerMismatchDialog: uiState.signerMismatch,
  };
}

export function useContactAddressDetailActionsAdapter(
  contactId: ContactId | undefined,
  addressId: ContactAddressId | undefined,
  onCloseAddressDetail: () => void,
): ContactAddressDetailActionsDialogProps {
  const { t } = useTranslation();
  const ports = useContactsAddressDetailActionsPorts();
  const openSendFlow = useOpenSendFlow();
  const isSelectionActive = contactId !== undefined && addressId !== undefined;
  const labels = useMemo(() => resolveContactAddressDetailActionsLabels({ t }), [t]);
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

  if (!isSelectionActive) {
    return mapUiStateToDialogProps(createInactiveContactAddressDetailActionsUiState(labels));
  }

  return mapUiStateToDialogProps(
    createActiveContactAddressDetailActionsUiState(flow, renameViewModel, labels),
  );
}
