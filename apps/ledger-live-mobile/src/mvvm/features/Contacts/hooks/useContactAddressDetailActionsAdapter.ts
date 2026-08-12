import { ContactIdSchema, type ContactAddressId, type ContactId } from "@domain/entity-contact";
import {
  type ContactAddressDetailSendIntent,
  type ContactsDeleteAddressDrawerProps,
  type ContactsEditSignerDrawerProps,
  type ContactsEditSignerMismatchDrawerProps,
  type ContactsRenameAddressDrawerProps,
  type ContactAddressDetailDialogNativeProps,
  createActiveContactAddressDetailActionsUiState,
  createInactiveContactAddressDetailActionsUiState,
  resolveContactAddressDetailActionsLabels,
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
  signerMismatchSheet: ContactsEditSignerMismatchDrawerProps;
}>;

function mapUiStateToFlowProps(
  uiState: ReturnType<typeof createInactiveContactAddressDetailActionsUiState>,
): ContactAddressDetailActionsFlowProps {
  return {
    addressDetailDialog: uiState.addressDetailDialog,
    deleteSheet: uiState.delete,
    renameSheet: uiState.rename,
    signerSheet: uiState.signer,
    signerMismatchSheet: uiState.signerMismatch,
  };
}

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
  const labels = useMemo(
    () =>
      resolveContactAddressDetailActionsLabels({
        t,
        addressLabelTooLongKey: "contacts.addAddressName.labelTooLong",
      }),
    [t],
  );
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
  const { flow, renameViewModel } = useContactAddressDetailActionsFlowBindings({
    contactId: contactId ?? ContactIdSchema.parse("contact-me"),
    addressId: isSelectionActive ? addressId : undefined,
    ports,
    onSend,
    onCloseAddressDetail,
  });
  const { onClose: closeRenameViewModel } = renameViewModel;
  const onCloseRename = useCallback(() => {
    closeRenameViewModel();
    onCloseAddressDetail();
  }, [closeRenameViewModel, onCloseAddressDetail]);

  if (!isSelectionActive) {
    return mapUiStateToFlowProps(createInactiveContactAddressDetailActionsUiState(labels));
  }

  const uiState = mapUiStateToFlowProps(
    createActiveContactAddressDetailActionsUiState(flow, renameViewModel, labels),
  );

  return {
    ...uiState,
    renameSheet: {
      ...uiState.renameSheet,
      onClose: onCloseRename,
    },
  };
}
