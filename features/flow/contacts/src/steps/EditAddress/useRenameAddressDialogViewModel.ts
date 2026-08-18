import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import type { ContactsAddressValidationPort } from "../AddAddress/model/addressValidation/types";
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
  onCloseRequest,
  onSaveSuccess,
}: UseRenameAddressDialogViewModelOptionsWithValidation &
  Readonly<{
    isRequestedOpen: boolean;
    onCloseRequest: () => void;
  }>): RenameAddressDialogViewModel {
  const [draftLabel, setDraftLabel] = useState(currentLabel);
  const [isSaving, setIsSaving] = useState(false);
  const { addressEntry, onAddressChange } = useEditAddressAddressEntry({
    addressValidation,
    currencyId,
    currentAddress,
    isActive: isRequestedOpen,
    manualValidationDebounceMs,
  });
  const { invalidLabelError, isConfirmEnabled, save } = useRenameAddressViewModel(
    contactId,
    addressId,
    currentLabel,
    currentAddress,
    draftLabel,
    addressEntry,
    existingLabels,
    editPort,
  );

  useEffect(() => {
    if (isRequestedOpen) {
      setDraftLabel(currentLabel);
    }
  }, [currentLabel, isRequestedOpen]);

  const onClose = useCallback(() => {
    onCloseRequest();
    setDraftLabel(currentLabel);
  }, [currentLabel, onCloseRequest]);

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
      onCloseRequest();
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
    onSaveSuccess,
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
    onClose,
    onDraftLabelChange,
    onAddressChange,
    onConfirm,
  };
}

export type { UseRenameAddressDialogViewModelOptions };
