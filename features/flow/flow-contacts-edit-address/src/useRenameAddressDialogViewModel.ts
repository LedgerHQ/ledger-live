import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import type { ContactsAddressValidationPort } from "@features/platform-contacts";
import { useEditAddressAddressEntry } from "./useEditAddressAddressEntry";
import { useRenameAddressViewModel } from "./useRenameAddressViewModel";
import type { RenameAddressDialogViewModel, UseRenameAddressDialogViewModelOptions } from "./types";

export type UseRenameAddressDialogViewModelOptionsWithValidation =
  UseRenameAddressDialogViewModelOptions &
    Readonly<{
      addressValidation?: ContactsAddressValidationPort;
      manualValidationDebounceMs?: number;
    }>;

export function useRenameAddressDialogViewModel({
  contactId,
  addressId,
  currentLabel,
  currentAddress,
  currencyId,
  existingLabels,
  editPort,
  addressValidation,
  manualValidationDebounceMs,
  isRequestedOpen,
  isEditSessionActive = isRequestedOpen,
  onCloseRequest,
  onSaveStart,
  onSaveSuccess,
  requestSaveApproval,
}: UseRenameAddressDialogViewModelOptionsWithValidation): RenameAddressDialogViewModel {
  const [draftLabel, setDraftLabel] = useState(currentLabel);
  const [isSaving, setIsSaving] = useState(false);
  const { addressEntry, onAddressChange } = useEditAddressAddressEntry({
    addressValidation,
    currencyId,
    currentAddress,
    isActive: isEditSessionActive,
    manualValidationDebounceMs,
  });
  const { invalidLabelError, isConfirmEnabled, save } = useRenameAddressViewModel({
    contactId,
    addressId,
    currentLabel,
    currentAddress,
    draftLabel,
    addressEntry,
    existingLabels,
    editPort,
  });

  useEffect(() => {
    if (isEditSessionActive) {
      setDraftLabel(currentLabel);
    }
  }, [currentLabel, isEditSessionActive]);

  const onDraftLabelChange = useCallback(
    (label: string) => setDraftLabel(label.slice(0, CONTACT_ADDRESS_LABEL_MAX_LENGTH)),
    [],
  );

  const onConfirm = useCallback(async () => {
    if (!isConfirmEnabled || isSaving) {
      return;
    }

    setIsSaving(true);

    try {
      if (requestSaveApproval !== undefined && !(await requestSaveApproval())) {
        return;
      }

      /**
       * Dismiss the dialog before save(): the Device Intent Executor takes over the device
       * interaction UI.
       */
      onCloseRequest();
      onSaveStart?.();
      await save();
      const addressChanged =
        addressEntry.status === "valid" &&
        currentAddress !== undefined &&
        addressEntry.resolvedAddress !== currentAddress;
      onSaveSuccess?.({
        currencyId,
        inputMethod: addressChanged ? addressEntry.inputMethod : null,
        labelChanged: draftLabel.trim() !== currentLabel.trim(),
        addressChanged,
      });
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }, [
    addressEntry,
    currencyId,
    currentAddress,
    currentLabel,
    draftLabel,
    isConfirmEnabled,
    isSaving,
    onCloseRequest,
    onSaveStart,
    onSaveSuccess,
    requestSaveApproval,
    save,
  ]);

  return {
    isOpen: isRequestedOpen,
    isSaving,
    draftLabel,
    invalidLabelError,
    addressEntry,
    isConfirmEnabled: isConfirmEnabled && !isSaving,
    onOpen: () => undefined,
    onClose: onCloseRequest,
    onDraftLabelChange,
    onAddressChange,
    onConfirm,
  };
}

export type { UseRenameAddressDialogViewModelOptions };
