import {
  selectContactAddressById,
  selectContactById,
  type ContactAddressId,
  type ContactId,
} from "@domain/entity-contact";
import { ContactAddressIdSchema } from "@domain/entity-contact";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import {
  type ContactAddressEditSavePayload,
  useRenameAddressDialogViewModel,
} from "@features/flow-contacts-edit-address";
import type { ContactAddressDetailActionsPorts } from "./model/ports";
import { useContactAddressDetailActionsFlowViewModel } from "./useContactAddressDetailActionsFlowViewModel";
import type { ContactAddressDetailSendIntent } from "./types";

const PLACEHOLDER_ADDRESS_ID = ContactAddressIdSchema.parse("address-unselected");

type ContactsStateRoot = Parameters<typeof selectContactById>[0];

export type UseContactAddressDetailActionsFlowBindingsOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId | undefined;
  ports: ContactAddressDetailActionsPorts;
  addressValidation?: ContactsAddressValidationPort;
  manualValidationDebounceMs?: number;
  onSend?: (intent: ContactAddressDetailSendIntent) => void;
  onDeleteSuccess?: () => void;
  onCloseAddressDetail?: () => void;
  onEditAddressSaved?: (payload: ContactAddressEditSavePayload) => void;
}>;

export function useContactAddressDetailActionsFlowBindings({
  contactId,
  addressId,
  ports,
  addressValidation,
  manualValidationDebounceMs,
  onSend,
  onDeleteSuccess,
  onCloseAddressDetail,
  onEditAddressSaved,
}: UseContactAddressDetailActionsFlowBindingsOptions) {
  const flow = useContactAddressDetailActionsFlowViewModel({
    contactId,
    addressId,
    ports,
    onSend,
    onDeleteSuccess,
    onCloseAddressDetail,
  });
  const resolvedAddressId = addressId ?? PLACEHOLDER_ADDRESS_ID;
  const contact = useSelector((state: ContactsStateRoot) => selectContactById(state, contactId));
  const contactAddress = useSelector((state: ContactsStateRoot) =>
    selectContactAddressById(state, contactId, resolvedAddressId),
  );
  const existingLabels = useMemo(
    () =>
      contact?.addresses
        .filter(address => address.id !== addressId)
        .map(address => address.label) ?? [],
    [addressId, contact?.addresses],
  );
  const renameViewModel = useRenameAddressDialogViewModel({
    contactId,
    addressId: resolvedAddressId,
    currentLabel: contactAddress?.label ?? "",
    currentAddress: contactAddress?.address,
    currencyId: contactAddress?.currencyId,
    existingLabels,
    editPort: ports.edit,
    addressValidation,
    manualValidationDebounceMs,
    isRequestedOpen: flow.editUiState === "edit-open",
    isEditSessionActive: flow.isEditSessionActive,
    onCloseRequest: flow.onEditClose,
    requestSaveApproval: flow.requestSaveApproval,
    onSaveStart: onCloseAddressDetail,
    onSaveSuccess: onEditAddressSaved,
  });

  return { flow, renameViewModel };
}
