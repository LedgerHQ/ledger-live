import {
  CONTACT_SIGNER_MISMATCH_ERROR,
  resolveContactSignerValidationResult,
  type ContactAddressId,
  type ContactId,
  type ContactSignerValidationStatus,
} from "@domain/entity-contact";
import { useCallback, useState } from "react";
import type { ContactAddressDetailEditFlowPorts } from "./model/ports";
import {
  resolveEditUiStateOnPress,
  resolveEditUiStateOnSignerCancel,
  type SignerEditUiState,
} from "./model/signerEditUiState";
import { useContactAddressDetailActionsViewModel } from "./useContactAddressDetailActionsViewModel";

export type ContactAddressDetailEditUiState = SignerEditUiState;

export type ContactAddressDetailEditSignerValidationState =
  | Readonly<{ status: "idle" | "validating" }>
  | Readonly<{ status: ContactSignerValidationStatus }>;

export type UseContactAddressDetailEditFlowViewModelOptions = Readonly<{
  contactId: ContactId;
  addressId: ContactAddressId;
  ports: ContactAddressDetailEditFlowPorts;
}>;

export type UseContactAddressDetailEditFlowViewModelResult = ReturnType<
  typeof useContactAddressDetailActionsViewModel
> &
  Readonly<{
    editUiState: ContactAddressDetailEditUiState;
    signerValidationState: ContactAddressDetailEditSignerValidationState;
    onEditPress: () => void;
    onSignerConfirm: () => Promise<void>;
    onSignerCancel: () => void;
    onEditClose: () => void;
  }>;

export function useContactAddressDetailEditFlowViewModel({
  contactId,
  addressId,
  ports,
}: UseContactAddressDetailEditFlowViewModelOptions): UseContactAddressDetailEditFlowViewModelResult {
  const actionsViewModel = useContactAddressDetailActionsViewModel(contactId, addressId, ports);
  const { editIntent, isSignerRequiredForEdit } = actionsViewModel;
  const [editUiState, setEditUiState] = useState<ContactAddressDetailEditUiState>("closed");
  const [signerValidationState, setSignerValidationState] =
    useState<ContactAddressDetailEditSignerValidationState>({ status: "idle" });

  const onEditPress = useCallback(() => {
    setSignerValidationState({ status: "idle" });
    setEditUiState(resolveEditUiStateOnPress(isSignerRequiredForEdit));
  }, [isSignerRequiredForEdit]);

  const onSignerConfirm = useCallback(async () => {
    if (editIntent === undefined) {
      return;
    }

    setSignerValidationState({ status: "validating" });

    const [expectedSignerId, currentSignerId] = await Promise.all([
      ports.signerValidation.getExpectedSignerId({
        contactId: editIntent.contactId,
        addressId: editIntent.addressId,
      }),
      ports.signerValidation.getCurrentSignerId(),
    ]);
    const status = resolveContactSignerValidationResult(expectedSignerId, currentSignerId);

    if (status === CONTACT_SIGNER_MISMATCH_ERROR) {
      setSignerValidationState({ status: CONTACT_SIGNER_MISMATCH_ERROR });
      return;
    }

    setSignerValidationState({ status: "valid" });
    setEditUiState("edit-open");
  }, [editIntent, ports.signerValidation]);

  const onSignerCancel = useCallback(() => {
    // QueuedBottomSheet calls onClose when isRequestingToBeOpened becomes false — including
    // after the user confirms and we transition to edit-open. Only cancel when still on signer.
    setEditUiState(current => resolveEditUiStateOnSignerCancel(current));
  }, []);

  const onEditClose = useCallback(() => {
    setEditUiState("closed");
    setSignerValidationState({ status: "idle" });
  }, []);

  return {
    ...actionsViewModel,
    editUiState,
    signerValidationState,
    onEditPress,
    onSignerConfirm,
    onSignerCancel,
    onEditClose,
  };
}
