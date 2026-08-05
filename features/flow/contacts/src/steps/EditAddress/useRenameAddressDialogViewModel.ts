import { CONTACT_ADDRESS_LABEL_MAX_LENGTH } from "@domain/entity-contact";
import { useCallback, useEffect, useState } from "react";
import { useRenameAddressViewModel } from "./useRenameAddressViewModel";
import type { RenameAddressDialogViewModel, UseRenameAddressDialogViewModelOptions } from "./types";

export function useRenameAddressDialogViewModel({
  contactId,
  addressId,
  currentLabel,
  existingLabels,
  editPort,
  isRequestedOpen,
  onCloseRequest,
  onSaveSuccess,
}: UseRenameAddressDialogViewModelOptions &
  Readonly<{
    isRequestedOpen: boolean;
    onCloseRequest: () => void;
  }>): RenameAddressDialogViewModel {
  const [draftLabel, setDraftLabel] = useState(currentLabel);
  const [isSaving, setIsSaving] = useState(false);
  const { invalidLabelError, isConfirmEnabled, save } = useRenameAddressViewModel(
    contactId,
    addressId,
    currentLabel,
    draftLabel,
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
      onSaveSuccess();
      onCloseRequest();
    } catch {
      return;
    } finally {
      setIsSaving(false);
    }
  }, [isConfirmEnabled, isSaving, onCloseRequest, onSaveSuccess, save]);

  return {
    isOpen: isRequestedOpen,
    isSaving,
    draftLabel,
    invalidLabelError,
    isConfirmEnabled: isConfirmEnabled && !isSaving,
    onOpen: () => undefined,
    onClose,
    onDraftLabelChange,
    onConfirm,
  };
}

export type { UseRenameAddressDialogViewModelOptions };
